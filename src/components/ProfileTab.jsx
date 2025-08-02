import { useState, useEffect, useRef } from 'react';
import { useNostr } from '../contexts/useNostr';
import { storage } from '../utils/storage';
import { 
  getTagValue, 
  getActivityTypeEmoji, 
  buildMetricsText,
  safeParseJSON,
  validateProfilePicture,
  formatNpub,
  formatLightningAddress,
  isValidNip05,
  copyToClipboard
} from '../utils/dataHelpers';

const ProfileTab = () => {
  const { user, fetchEvents } = useNostr();
  const [profile, setProfile] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const loadingTimeoutRef = useRef(null);

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
      if (!user) {
        console.log('❌ No user object available');
        return;
      }

      console.log('👤 User object:', user);
      console.log('🔑 User hexpubkey:', user.hexpubkey);
      console.log('🔑 User pubkey:', user.pubkey);

      // Try different possible pubkey properties
      const pubkey = user.hexpubkey || user.pubkey || user.pk;
      if (!pubkey) {
        console.error('❌ No pubkey found in user object. Available properties:', Object.keys(user));
        return;
      }

      try {
        setLoading(true);
        setProfileError(false);

        // Set a timeout for loading
        loadingTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          setProfileError(true);
        }, 5000);

        // Try cache first for profile
        const cachedProfile = storage.getProfile(pubkey);
        if (cachedProfile) {
          setProfile(cachedProfile);
        }

        // Always try to fetch latest profile
        console.log('🔍 Fetching profile for user:', pubkey);
        try {
          const profileEvents = await fetchEvents({
            kinds: [0],
            authors: [pubkey],
            limit: 1,
          });

          console.log(`📦 Profile fetch result: ${profileEvents.length} events found`);
          
          if (profileEvents.length > 0) {
            console.log('📄 Raw profile event:', profileEvents[0]);
            const profileData = safeParseJSON(profileEvents[0].content);
            if (profileData) {
              console.log('✅ Successfully parsed profile data:', profileData);
              setProfile(profileData);
              storage.cacheProfile(pubkey, profileData);
            } else {
              console.warn('❌ Failed to parse profile content:', profileEvents[0].content);
            }
          } else {
            console.log('ℹ️ No profile event found for user:', formatNpub(pubkey), '- this is normal for new users');
          }
        } catch (profileError) {
          console.error('🚨 Error fetching profile:', profileError);
          // Continue with cached data if available
        }

        // Try cache first for workouts
        const cachedWorkouts = storage.getUserWorkouts(pubkey);
        if (cachedWorkouts) {
          setUserWorkouts(cachedWorkouts);
        }

        // Fetch user's workouts (kind 1301)
        console.log('🏃 Fetching workouts for user:', pubkey);
        try {
          const workoutEvents = await fetchEvents({
            kinds: [1301],
            authors: [pubkey],
            limit: 20,
          });

          console.log(`📊 Workout fetch result: ${workoutEvents.length} events found`);
          
          const sortedWorkouts = workoutEvents.sort((a, b) => b.created_at - a.created_at);
          setUserWorkouts(sortedWorkouts);
          if (sortedWorkouts.length > 0) {
            console.log('✅ Successfully cached', sortedWorkouts.length, 'workouts');
            storage.cacheUserWorkouts(pubkey, sortedWorkouts);
          } else {
            console.log('ℹ️ No workout events found - user hasn\'t published any kind 1301 events yet');
          }
        } catch (workoutError) {
          console.error('🚨 Error fetching workouts:', workoutError);
          // Continue with cached data if available
        }

      } catch (error) {
        console.error('Failed to load user data:', error);
        setProfileError(true);
      } finally {
        clearTimeout(loadingTimeoutRef.current);
        setLoading(false);
      }
    };

    loadUserData();

    return () => {
      clearTimeout(loadingTimeoutRef.current);
    };
  }, [user, fetchEvents]);

  if (loading && !profile && userWorkouts.length === 0) {
    return (
      <div>
        <div style={profileHeaderStyle}>
          <div style={{...avatarStyle, background: '#333'}}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#444',
              borderRadius: '50%',
              opacity: 0.7
            }} />
          </div>
          <div style={{flex: 1}}>
            <div style={{
              height: '36px',
              width: '200px',
              background: '#333',
              borderRadius: '8px',
              marginBottom: '10px',
              opacity: 0.7
            }} />
            <div style={{
              height: '20px',
              width: '300px',
              background: '#333',
              borderRadius: '6px',
              opacity: 0.7
            }} />
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
      const distance = getTagValue(workout.tags, 'distance');
      const duration = getTagValue(workout.tags, 'duration');

      if (distance) {
        const dist = parseFloat(distance);
        if (!isNaN(dist) && dist > 0) {
          totalDistance += dist;
        }
      }
      
      if (duration) {
        const dur = parseInt(duration, 10);
        if (!isNaN(dur) && dur > 0) {
          totalDuration += dur;
        }
      }
    });

    return {
      workoutCount,
      totalDistance: totalDistance.toFixed(1),
      totalHours: (totalDuration / 3600).toFixed(1),
    };
  };

  const stats = calculateStats();

  const renderProfileFields = () => {
    const fields = [];
    
    if (profile?.website) {
      fields.push({
        icon: '🌐',
        label: 'Website',
        value: profile.website,
        isLink: true
      });
    }
    
    if (profile?.nip05 && isValidNip05(profile.nip05)) {
      fields.push({
        icon: '✅',
        label: 'Verified',
        value: profile.nip05,
        isVerified: true
      });
    }
    
    const lightningAddress = formatLightningAddress(profile?.lud16);
    if (lightningAddress) {
      fields.push({
        icon: '⚡',
        label: 'Lightning',
        value: lightningAddress,
        isLightning: true
      });
    }
    
    return fields;
  };

  const profileFields = renderProfileFields();

  return (
    <div>
      {/* Profile Header */}
      <div style={profileHeaderStyle}>
        <div style={avatarStyle}>
          {(() => {
            const validPictureUrl = validateProfilePicture(profile?.picture);
            return validPictureUrl ? (
              <img 
                src={validPictureUrl}
                alt="Profile Avatar"
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
              fontSize: '36px',
              fontWeight: 'bold'
            }}
          >
            {profile?.name?.[0]?.toUpperCase() || user?.hexpubkey?.[0]?.toUpperCase() || 'G'}
          </div>
        </div>
        <div style={{flex: 1}}>
          <h1 style={h1Style}>
            {profile?.name || formatNpub(user?.hexpubkey || user?.pubkey || user?.pk) || 'Your Profile'}
          </h1>
          <p style={pStyle}>
            {profile?.about || 'Set up your Nostr profile to share more about yourself'}
          </p>
          
          {/* Profile Fields */}
          {profileFields.length > 0 && (
            <div style={{marginTop: '15px', marginBottom: '15px'}}>
              {profileFields.map((field, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  <span>{field.icon}</span>
                  <span style={{color: '#888'}}>{field.label}:</span>
                  {field.isLink ? (
                    <a 
                      href={field.value.startsWith('http') ? field.value : `https://${field.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{color: '#ff6b6b', textDecoration: 'none'}}
                    >
                      {field.value}
                    </a>
                  ) : (
                    <span style={{
                      color: field.isVerified ? '#4ade80' : field.isLightning ? '#fbbf24' : '#ffffff'
                    }}>
                      {field.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* User ID for copying */}
          <div style={{marginBottom: '15px'}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#666',
              background: '#2a2a2a',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={async () => {
              const pubkey = user?.hexpubkey || user?.pubkey || user?.pk;
              if (pubkey) {
                await copyToClipboard(pubkey, 'pubkey');
              }
            }}
            >
              <span>🔑</span>
              <span>{formatNpub(user?.hexpubkey || user?.pubkey || user?.pk)}</span>
              <span style={{marginLeft: 'auto', fontSize: '10px'}}>📋 click to copy</span>
            </div>
          </div>
          
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
      
      {profileError && (
        <div style={{
          ...cardStyle,
          borderColor: '#ff6b6b',
          background: '#2a1a1a'
        }}>
          <h3 style={h3Style}>⚠️ Connection Issue</h3>
          <p style={pStyle}>
            Having trouble connecting to Nostr relays. Your profile data might be incomplete.
          </p>
        </div>
      )}
      
      {userWorkouts.length > 0 ? (
        <div>
          {userWorkouts.map(workout => (
            <UserWorkoutCard key={workout.id} workout={workout} cardStyle={cardStyle} h3Style={h3Style} pStyle={pStyle} />
          ))}
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{textAlign: 'center', padding: '20px'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}>🏃</div>
            <h3 style={h3Style}>Ready to Start Your Fitness Journey?</h3>
            <p style={pStyle}>
              No workouts recorded yet. When you publish workout activities to Nostr using kind 1301 events, they'll appear here.
            </p>
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#2a2a2a',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <h4 style={{...h3Style, fontSize: '16px', marginBottom: '10px'}}>How to get started:</h4>
              <ul style={{
                margin: '0',
                paddingLeft: '20px',
                color: '#cccccc',
                lineHeight: '1.6'
              }}>
                <li>Use a Nostr client that supports fitness activities</li>
                <li>Log your workouts as kind 1301 events</li>
                <li>Include tags like distance, duration, and activity_type</li>
                <li>Your activities will sync across all Gantz instances</li>
              </ul>
            </div>
            {!profile && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#1a2a1a',
                borderRadius: '8px',
                border: '1px solid #4ade80'
              }}>
                <h4 style={{...h3Style, fontSize: '16px', marginBottom: '10px', color: '#4ade80'}}>💡 Pro Tip</h4>
                <p style={{...pStyle, margin: 0}}>
                  Set up your Nostr profile (kind 0 event) to share your name, bio, and picture with the fitness community!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UserWorkoutCard = ({ workout, cardStyle, h3Style, pStyle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const title = getTagValue(workout.tags, 'title', 'Workout');
  const activityType = getTagValue(workout.tags, 'activity_type', 'Unknown');
  const metricsText = buildMetricsText(workout.tags);

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
        {metricsText || 'No metrics available'}
      </p>
    </div>
  );
};

export default ProfileTab;