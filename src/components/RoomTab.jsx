import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';
import { storage } from '../utils/storage';
import { safeParseJSON, validateProfilePicture } from '../utils/dataHelpers';
import TimerComponent from './TimerComponent';
import ChallengeDisplay from './ChallengeDisplay';

const RoomTab = () => {
  const { fetchEvents } = useNostr();
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomState, setRoomState] = useState('WAITING'); // WAITING, FORMED, CHALLENGE_PREP, CHALLENGE
  const [allUsers, setAllUsers] = useState([]);
  const [challengeTimer, setChallengeTimer] = useState(120); // 2 minutes for challenge prep
  const [currentLevel, setCurrentLevel] = useState(1); // Start at level 1

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    transition: 'all 0.3s'
  };

  const h2Style = {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#ffffff'
  };

  const h3Style = {
    fontSize: '20px',
    marginBottom: '10px',
    color: '#ff6b6b'
  };

  const pStyle = {
    color: '#cccccc',
    lineHeight: '1.6'
  };

  // Get all unique users from 1301 feed
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setLoading(true);
        
        // Try cache first
        const cachedWorkouts = storage.getFeed();
        let workouts = [];
        
        if (cachedWorkouts) {
          workouts = cachedWorkouts;
        } else {
          // Fetch fresh 1301 events
          const filter = {
            kinds: [1301],
            limit: 100, // Get more events to have a larger user pool
          };

          const events = await fetchEvents(filter, { closeOnEose: true });
          workouts = events.map(event => ({
            id: event.id,
            kind: event.kind,
            content: event.content,
            tags: event.tags,
            created_at: event.created_at,
            sig: event.sig,
            author: (event.author?.hexpubkey || event.author?.pubkey || event.author) || event.pubkey
          }));
        }
        
        // Extract unique authors/users
        const uniqueUsers = [...new Set(workouts.map(workout => workout.author))];
        setAllUsers(uniqueUsers);
        
        // Automatically form a room for demo purposes
        selectRandomParticipants(uniqueUsers);
        
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllUsers();
  }, [fetchEvents]);

  const selectRandomParticipants = (userPool) => {
    if (userPool.length < 4) {
      console.warn('Not enough users in pool to form a room');
      setRoomParticipants(userPool);
      setRoomState('FORMED');
      return;
    }

    // Randomly select 4 users
    const shuffled = [...userPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    
    setRoomParticipants(selected);
    setRoomState('FORMED');
    setChallengeTimer(120); // Reset challenge timer when room is formed
  };

  const formNewRoom = () => {
    setRoomState('WAITING');
    setTimeout(() => {
      selectRandomParticipants(allUsers);
    }, 1000); // Simulate room formation delay
  };

  const handleChallengeStart = () => {
    setRoomState('CHALLENGE');
    console.log('Challenge started! Level:', currentLevel);
  };

  const handleChallengeComplete = (level) => {
    console.log('Challenge completed for level:', level);
    // In Phase 4, this will verify completion and advance to next level
    setCurrentLevel(level + 1);
    setRoomState('FORMED'); // Go back to room formation for next challenge
    setChallengeTimer(120); // Reset timer for next challenge
  };

  const handleChallengeTimeout = () => {
    console.log('Challenge timed out - 24 hours expired');
    // In Phase 4, this will handle elimination logic
    setRoomState('FORMED'); // Reset room for new participants
  };

  if (loading) {
    return (
      <div>
        <h2 style={h2Style}>Gantz Room</h2>
        <div style={cardStyle}>
          <h3 style={h3Style}>Loading room...</h3>
          <p style={pStyle}>Scanning the network for participants...</p>
        </div>
      </div>
    );
  }

  if (roomState === 'WAITING') {
    return (
      <div>
        <h2 style={h2Style}>Gantz Room</h2>
        <div style={cardStyle}>
          <h3 style={h3Style}>🔴 Room Formation in Progress</h3>
          <p style={pStyle}>Selecting 4 participants from the fitness network...</p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 0'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #ff6b6b',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show challenge when in CHALLENGE state
  if (roomState === 'CHALLENGE') {
    return (
      <div>
        <h2 style={h2Style}>Gantz Room - Level {currentLevel}</h2>
        <ChallengeDisplay 
          level={currentLevel}
          onChallengeComplete={handleChallengeComplete}
          onChallengeTimeout={handleChallengeTimeout}
        />
        
        {/* Show current participants during challenge */}
        <div style={cardStyle}>
          <h3 style={h3Style}>🔥 Current Participants in Challenge</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '15px'
          }}>
            {roomParticipants.map((participantId, index) => (
              <div key={participantId} style={{
                background: '#333',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #ff6b6b'
              }}>
                <div style={{color: '#ff6b6b', fontWeight: 'bold'}}>
                  Participant {index + 1}
                </div>
                <div style={{color: '#ccc', fontSize: '12px'}}>
                  {participantId.slice(0, 12)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={h2Style}>Gantz Room</h2>
      
      {/* Challenge Timer - Only show when room is formed */}
      {roomState === 'FORMED' && (
        <div style={{
          ...cardStyle,
          background: '#2a1a1a',
          border: '2px solid #ff6b6b',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{...h3Style, marginBottom: '15px'}}>⏰ Challenge Begins In:</h3>
          <TimerComponent
            initialSeconds={challengeTimer}
            format="MM:SS"
            style={{
              fontSize: '32px',
              color: '#ff6b6b',
              fontWeight: 'bold'
            }}
            onComplete={handleChallengeStart}
          />
          <p style={{...pStyle, marginTop: '15px', marginBottom: '0'}}>
            Prepare for your Gantz challenge. Use this time to get ready!
          </p>
        </div>
      )}
      
      {/* Room Status */}
      <div style={cardStyle}>
        <h3 style={h3Style}>🟢 Room Active - Level {currentLevel} Participants</h3>
        <p style={pStyle}>The following fitness enthusiasts have been chosen for the Gantz challenge:</p>
      </div>

      {/* Participants Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {roomParticipants.map((participantId, index) => (
          <ParticipantCard 
            key={participantId} 
            participantId={participantId} 
            position={index + 1}
            cardStyle={cardStyle}
            h3Style={h3Style}
            pStyle={pStyle}
          />
        ))}
      </div>

      {/* Room Controls */}
      <div style={cardStyle}>
        <h3 style={h3Style}>Room Controls</h3>
        <p style={pStyle}>Current level: {currentLevel}</p>
        <p style={pStyle}>Room participants: {roomParticipants.length}</p>
        <p style={pStyle}>Total users in network: {allUsers.length}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={formNewRoom}
            style={{
              background: '#ff6b6b',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Form New Room
          </button>
          <button
            onClick={() => setCurrentLevel(Math.max(1, currentLevel - 1))}
            disabled={currentLevel <= 1}
            style={{
              background: currentLevel <= 1 ? '#666' : '#4ade80',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: currentLevel <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            Previous Level
          </button>
          <button
            onClick={() => setCurrentLevel(Math.min(10, currentLevel + 1))}
            disabled={currentLevel >= 10}
            style={{
              background: currentLevel >= 10 ? '#666' : '#4ade80',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: currentLevel >= 10 ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            Next Level
          </button>
        </div>
      </div>
    </div>
  );
};

const ParticipantCard = ({ participantId, position, cardStyle, h3Style, pStyle }) => {
  const [profile, setProfile] = useState(null);
  const { fetchEvents } = useNostr();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Try cache first
        const cachedProfile = storage.getProfile(participantId);
        if (cachedProfile) {
          setProfile(cachedProfile);
          return;
        }

        const profileEvents = await fetchEvents({
          kinds: [0],
          authors: [participantId],
          limit: 1,
        });

        if (profileEvents.length > 0) {
          const profileData = safeParseJSON(profileEvents[0].content);
          if (profileData) {
            setProfile(profileData);
            storage.cacheProfile(participantId, profileData);
          }
        }
      } catch (error) {
        console.error('Failed to load participant profile:', error);
      }
    };

    loadProfile();
  }, [participantId, fetchEvents]);

  const participantCardStyle = {
    ...cardStyle,
    border: '2px solid #ff6b6b',
    background: '#2a1a1a',
    textAlign: 'center'
  };

  return (
    <div style={participantCardStyle}>
      {/* Position Badge */}
      <div style={{
        background: '#ff6b6b',
        color: 'white',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '0 auto 15px auto'
      }}>
        {position}
      </div>

      {/* Avatar */}
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: '#ff6b6b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '0 auto 15px auto',
        overflow: 'hidden'
      }}>
        {(() => {
          const validPictureUrl = validateProfilePicture(profile?.picture);
          return validPictureUrl ? (
            <img 
              src={validPictureUrl}
              alt="Participant Avatar"
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
          ) : null;
        })()}
        <div 
          style={{
            display: validateProfilePicture(profile?.picture) ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {profile?.name?.[0]?.toUpperCase() || participantId.slice(0, 1)?.toUpperCase() || 'A'}
        </div>
      </div>

      {/* Name */}
      <h3 style={{...h3Style, fontSize: '16px', marginBottom: '8px'}}>
        {profile?.name || `${participantId.slice(0, 8)}...` || 'Anonymous'}
      </h3>

      {/* Participant ID */}
      <p style={{...pStyle, fontSize: '12px', color: '#888'}}>
        {participantId.slice(0, 12)}...
      </p>

      {/* Status */}
      <div style={{
        background: '#333',
        padding: '8px 12px',
        borderRadius: '6px',
        marginTop: '12px',
        fontSize: '12px',
        color: '#4ade80'
      }}>
        🟢 Ready
      </div>
    </div>
  );
};

export default RoomTab;