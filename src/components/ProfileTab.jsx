import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';
import { storage } from '../utils/storage';

const ProfileTab = () => {
  const { user, fetchEvents } = useNostr();
  const [profile, setProfile] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define styles to match the HTML design
  const profileHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    padding: '30px',
    background: '#1a1a1a',
    borderRadius: '12px',
    marginBottom: '30px'
  };

  const avatarStyle = {
    width: '100px',
    height: '100px',
    background: '#ff6b6b',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold'
  };

  const statsStyle = {
    display: 'flex',
    gap: '40px',
    marginTop: '20px'
  };

  const statStyle = {
    textAlign: 'center'
  };

  const statValueStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ff6b6b'
  };

  const statLabelStyle = {
    color: '#888888',
    fontSize: '14px',
    marginTop: '5px'
  };

  const h1Style = {
    fontSize: '36px',
    marginBottom: '10px'
  };

  const h2Style = {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#ffffff'
  };

  const pStyle = {
    color: '#cccccc',
    lineHeight: '1.6'
  };

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  };

  const h3Style = {
    fontSize: '20px',
    marginBottom: '10px'
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Try cache first for profile
        const cachedProfile = storage.getProfile(user.hexpubkey);
        if (cachedProfile) {
          setProfile(cachedProfile);
        } else {
          // Fetch user profile (kind 0)
          const profileEvents = await fetchEvents({
            kinds: [0],
            authors: [user.hexpubkey],
            limit: 1,
          });

          if (profileEvents.length > 0) {
            const profileData = JSON.parse(profileEvents[0].content);
            setProfile(profileData);
            storage.cacheProfile(user.hexpubkey, profileData);
          }
        }

        // Try cache first for workouts
        const cachedWorkouts = storage.getUserWorkouts(user.hexpubkey);
        if (cachedWorkouts) {
          setUserWorkouts(cachedWorkouts);
          setLoading(false);
          return;
        }

        // Fetch user's workouts (kind 1301)
        const workoutEvents = await fetchEvents({
          kinds: [1301],
          authors: [user.hexpubkey],
          limit: 20,
        });

        const sortedWorkouts = workoutEvents.sort((a, b) => b.created_at - a.created_at);
        setUserWorkouts(sortedWorkouts);
        storage.cacheUserWorkouts(user.hexpubkey, sortedWorkouts);

      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, fetchEvents]);

  if (loading) {
    return (
      <div>
        <div style={profileHeaderStyle}>
          <div style={avatarStyle}>G</div>
          <div>
            <h1 style={h1Style}>Loading Profile...</h1>
            <p style={pStyle}>Please wait while we load your data</p>
          </div>
        </div>
      </div>
    );
  }

  const calculateStats = () => {
    let totalDistance = 0;
    let totalDuration = 0;
    let workoutCount = userWorkouts.length;

    userWorkouts.forEach(workout => {
      const distanceTag = workout.tags.find(t => t[0] === 'distance');
      const durationTag = workout.tags.find(t => t[0] === 'duration');

      if (distanceTag) {
        totalDistance += parseFloat(distanceTag[1]) || 0;
      }
      if (durationTag) {
        totalDuration += parseInt(durationTag[1]) || 0;
      }
    });

    return {
      workoutCount,
      totalDistance: totalDistance.toFixed(1),
      totalHours: (totalDuration / 3600).toFixed(1),
    };
  };

  const stats = calculateStats();

  return (
    <div>
      {/* Profile Header */}
      <div style={profileHeaderStyle}>
        <div style={avatarStyle}>
          {profile?.picture ? (
            <img 
              src={profile.picture.startsWith('http:') ? profile.picture.replace('http:', 'https:') : profile.picture}
              alt="Profile Avatar"
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
              fontSize: '36px',
              fontWeight: 'bold'
            }}
          >
            {profile?.name?.[0]?.toUpperCase() || user?.hexpubkey?.[0]?.toUpperCase() || 'G'}
          </div>
        </div>
        <div>
          <h1 style={h1Style}>
            {profile?.name || `npub...${user?.hexpubkey?.slice(-8)}` || 'Your Profile'}
          </h1>
          <p style={pStyle}>
            {profile?.about || 'Connect Nostr to sync your workout data'}
          </p>
          <div style={statsStyle}>
            <div style={statStyle}>
              <div style={statValueStyle}>{stats.workoutCount}</div>
              <div style={statLabelStyle}>Workouts</div>
            </div>
            <div style={statStyle}>
              <div style={statValueStyle}>{stats.totalDistance}</div>
              <div style={statLabelStyle}>Total km</div>
            </div>
            <div style={statStyle}>
              <div style={statValueStyle}>{stats.totalHours}</div>
              <div style={statLabelStyle}>Hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <h2 style={h2Style}>Recent Workouts</h2>
      
      {userWorkouts.length > 0 ? (
        <div>
          {userWorkouts.map(workout => (
            <UserWorkoutCard key={workout.id} workout={workout} cardStyle={cardStyle} h3Style={h3Style} pStyle={pStyle} />
          ))}
        </div>
      ) : (
        <div style={cardStyle}>
          <h3 style={h3Style}>No Workouts Found</h3>
          <p style={pStyle}>No workouts recorded yet. Start logging your activities!</p>
        </div>
      )}
    </div>
  );
};

const UserWorkoutCard = ({ workout, cardStyle, h3Style, pStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTagValue = (tagName) => {
    const tag = workout.tags.find(t => t[0] === tagName);
    return tag ? tag[1] : null;
  };

  const title = getTagValue('title') || 'Workout';
  const activityType = getTagValue('activity_type') || 'Unknown';
  const distance = getTagValue('distance');
  const duration = getTagValue('duration');
  const pace = getTagValue('pace');
  const calories = getTagValue('calories');

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    
    if (calories) {
      metrics.push(`Calories: ${calories}`);
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
      <h3 style={h3Style}>
        {getActivityTypeEmoji(activityType)} {title}
      </h3>
      <p style={pStyle}>
        {buildMetricsText()}
      </p>
    </div>
  );
};

export default ProfileTab;