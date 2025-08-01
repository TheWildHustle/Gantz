import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';
import { storage } from '../utils/storage';

const FeedTab = () => {
  const { fetchEvents } = useNostr();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  };

  const cardHoverStyle = {
    ...cardStyle,
    borderColor: '#ff6b6b',
    transform: 'translateY(-2px)'
  };

  const h2Style = {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#ffffff'
  };

  const h3Style = {
    fontSize: '20px',
    marginBottom: '10px'
  };

  const pStyle = {
    color: '#cccccc',
    lineHeight: '1.6'
  };

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setLoading(true);
        
        // Try cache first
        const cachedWorkouts = storage.getFeed();
        if (cachedWorkouts) {
          setWorkouts(cachedWorkouts);
          setLoading(false);
          return;
        }
        
        const filter = {
          kinds: [1301], // Kind 1301 - Workout records
          limit: 50,
        };

        const events = await fetchEvents(filter, { closeOnEose: true });
        
        // Sort by creation time (newest first)
        const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
        
        // Serialize events to prevent circular reference issues
        const serializedEvents = sortedEvents.map(event => ({
          id: event.id,
          kind: event.kind,
          content: event.content,
          tags: event.tags,
          created_at: event.created_at,
          sig: event.sig,
          author: (event.author?.hexpubkey || event.author?.pubkey || event.author) || event.pubkey
        }));
        
        setWorkouts(serializedEvents);
        storage.cacheFeed(serializedEvents);
      } catch (error) {
        console.error('Failed to load workouts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div>
        <h2 style={h2Style}>Activity Feed</h2>
        <div style={cardStyle}>
          <h3 style={h3Style}>Loading workouts...</h3>
          <p style={pStyle}>Please wait while we fetch the latest activities.</p>
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div>
        <h2 style={h2Style}>Activity Feed</h2>
        <div style={cardStyle}>
          <h3 style={h3Style}>No Workouts Found</h3>
          <p style={pStyle}>No workout activities found in the feed. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={h2Style}>Activity Feed</h2>
      {workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} cardStyle={cardStyle} h3Style={h3Style} pStyle={pStyle} />
      ))}
    </div>
  );
};

const WorkoutCard = ({ workout, cardStyle, h3Style, pStyle }) => {
  const [profile, setProfile] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const { fetchEvents } = useNostr();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Try cache first
        const cachedProfile = storage.getProfile(workout.author);
        if (cachedProfile) {
          setProfile(cachedProfile);
          return;
        }

        const profileEvents = await fetchEvents({
          kinds: [0],
          authors: [workout.author],
          limit: 1,
        });

        if (profileEvents.length > 0) {
          const profileData = JSON.parse(profileEvents[0].content);
          setProfile(profileData);
          storage.cacheProfile(workout.author, profileData);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, [workout.author, fetchEvents]);

  // Extract workout data from tags
  const getTagValue = (tagName) => {
    const tag = workout.tags.find(t => t[0] === tagName);
    return tag ? tag[1] : null;
  };

  const title = getTagValue('title') || 'Workout';
  const activityType = getTagValue('activity_type') || 'Unknown';
  const distance = getTagValue('distance');
  const duration = getTagValue('duration');
  const pace = getTagValue('pace');

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const getActivityTypeEmoji = (type) => {
    switch (type?.toLowerCase()) {
      case 'running':
        return '🏃';
      case 'cycling':
        return '🚴';
      case 'walking':
        return '🚶';
      case 'swimming':
        return '🏊';
      case 'hiking':
        return '🥾';
      default:
        return '💪';
    }
  };

  const buildMetricsText = () => {
    const metrics = [];
    
    if (distance) {
      metrics.push(`Distance: ${parseFloat(distance).toFixed(1)} km`);
    }
    
    if (duration) {
      metrics.push(`Duration: ${formatDuration(parseInt(duration))}`);
    }
    
    if (pace) {
      metrics.push(`Pace: ${pace}`);
    }
    
    return metrics.join(' • ');
  };

  const currentStyle = isHovered ? {
    ...cardStyle,
    borderColor: '#ff6b6b',
    transform: 'translateY(-2px)'
  } : cardStyle;

  return (
    <div 
      style={currentStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* User Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px'}}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#ff6b6b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          overflow: 'hidden'
        }}>
          {profile?.picture ? (
            <img 
              src={profile.picture.startsWith('http:') ? profile.picture.replace('http:', 'https:') : profile.picture}
              alt="User Avatar"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            style={{
              display: profile?.picture ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {profile?.name?.[0]?.toUpperCase() || (typeof workout.author === 'string' ? workout.author.slice(0, 1)?.toUpperCase() : 'A') || 'A'}
          </div>
        </div>
        <div style={{fontSize: '14px', fontWeight: '500', color: '#fff'}}>
          {profile?.name || (typeof workout.author === 'string' ? `${workout.author.slice(0, 8)}...` : 'Anonymous Runner') || 'Anonymous Runner'}
        </div>
      </div>
      
      <h3 style={h3Style}>
        {getActivityTypeEmoji(activityType)} {title}
      </h3>
      <p style={pStyle}>
        {buildMetricsText()}
      </p>
      <p style={{...pStyle, marginTop: '10px', color: '#888'}}>
        {formatDate(workout.created_at)}
      </p>
    </div>
  );
};

export default FeedTab;