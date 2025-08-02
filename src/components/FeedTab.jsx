import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';
import { storage } from '../utils/storage';
import { 
  getTagValue, 
  formatDate, 
  getActivityTypeEmoji, 
  buildMetricsText,
  safeParseJSON,
  validateProfilePicture 
} from '../utils/dataHelpers';

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
          const profileData = safeParseJSON(profileEvents[0].content);
          if (profileData) {
            setProfile(profileData);
            storage.cacheProfile(workout.author, profileData);
          } else {
            console.warn('Failed to parse profile data for author:', workout.author);
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, [workout.author, fetchEvents]);

  // Enhanced data extraction for NIP-101e compliance
  const extractActivityType = (tags) => {
    // Try multiple sources for activity type
    let activityType = getTagValue(tags, 'activity_type');
    
    if (!activityType) {
      // Try to extract from exercise tag (format: "33401:pubkey:uuid-running")
      const exerciseTag = getTagValue(tags, 'exercise');
      if (exerciseTag && typeof exerciseTag === 'string') {
        const parts = exerciseTag.split(':');
        if (parts.length >= 3) {
          const exerciseId = parts[2];
          if (exerciseId.includes('running')) activityType = 'running';
          else if (exerciseId.includes('cycling')) activityType = 'cycling';
          else if (exerciseId.includes('walking')) activityType = 'walking';
          else if (exerciseId.includes('swimming')) activityType = 'swimming';
          else if (exerciseId.includes('hiking')) activityType = 'hiking';
        }
      }
    }
    
    if (!activityType) {
      // Fallback: try to detect from content or title
      const content = workout.content?.toLowerCase() || '';
      const title = getTagValue(tags, 'title', '').toLowerCase();
      const text = `${content} ${title}`;
      
      if (text.includes('run')) activityType = 'running';
      else if (text.includes('bike') || text.includes('cycl')) activityType = 'cycling';
      else if (text.includes('walk')) activityType = 'walking';
      else if (text.includes('swim')) activityType = 'swimming';
      else if (text.includes('hik')) activityType = 'hiking';
    }
    
    return activityType || 'workout';
  };
  
  const title = getTagValue(workout.tags, 'title') || 
               (workout.content && workout.content.length > 50 
                 ? workout.content.substring(0, 47) + '...' 
                 : workout.content) || 
               'Workout Activity';
               
  const activityType = extractActivityType(workout.tags);
  const metricsText = buildMetricsText(workout.tags);
  
  // Extract additional metadata
  const source = getTagValue(workout.tags, 'source') || getTagValue(workout.tags, 'client');
  const completed = getTagValue(workout.tags, 'completed');

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
          {(() => {
            const validPictureUrl = validateProfilePicture(profile?.picture);
            return validPictureUrl ? (
              <img 
                src={validPictureUrl}
                alt="User Avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.warn('Failed to load profile picture:', validPictureUrl);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null;
          })()}
          <div 
            style={{
              display: validateProfilePicture(profile?.picture) ? 'none' : 'flex',
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
      
      {/* Workout Title with Activity Type */}
      <h3 style={h3Style}>
        {getActivityTypeEmoji(activityType)} {title}
      </h3>
      
      {/* Workout Content */}
      {workout.content && workout.content !== title && (
        <p style={{...pStyle, marginBottom: '15px', fontStyle: 'italic'}}>
          "{workout.content}"
        </p>
      )}
      
      {/* Metrics Display */}
      <div style={{marginBottom: '15px'}}>
        {metricsText ? (
          <p style={{...pStyle, fontSize: '16px', fontWeight: '500'}}>
            {metricsText}
          </p>
        ) : (
          <p style={{...pStyle, color: '#666'}}>
            No metrics available
          </p>
        )}
      </div>
      
      {/* Footer with metadata */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #333'
      }}>
        <p style={{...pStyle, color: '#888', margin: 0}}>
          {formatDate(workout.created_at)}
        </p>
        {source && (
          <p style={{...pStyle, color: '#888', margin: 0, fontSize: '12px'}}>
            via {source}
          </p>
        )}
        {completed === 'true' && (
          <div style={{color: '#4ade80', fontSize: '12px', fontWeight: '500'}}>
            ✅ Completed
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedTab;