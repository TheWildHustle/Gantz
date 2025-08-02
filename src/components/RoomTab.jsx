import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';
import { storage } from '../utils/storage';
import { safeParseJSON, validateProfilePicture } from '../utils/dataHelpers';
import { findChallengeCompletionEvents } from '../utils/workoutVerification';
import { postChallengeResult, generateRoomId } from '../utils/nostrPublisher';
import TimerComponent from './TimerComponent';
import ChallengeDisplay from './ChallengeDisplay';
import ChallengeFeed from './ChallengeFeed';
import StrengthWorkoutCreator from './StrengthWorkoutCreator';

const RoomTab = () => {
  const { fetchEvents, ndk } = useNostr();
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomState, setRoomState] = useState('WAITING'); // WAITING, FORMED, CHALLENGE_PREP, CHALLENGE
  const [allUsers, setAllUsers] = useState([]);
  const [challengeTimer, setChallengeTimer] = useState(120); // 2 minutes for challenge prep
  const [currentLevel, setCurrentLevel] = useState(1); // Start at level 1
  const [roomId, setRoomId] = useState(null);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [participantStatuses, setParticipantStatuses] = useState({}); // Track each participant's status
  const [feedParticipantStatuses, setFeedParticipantStatuses] = useState({}); // Track statuses from feed

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
      
      // Generate new room ID and initialize participant statuses
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
      setRoomParticipants(selected);
      setRoomState('FORMED');
      setChallengeTimer(120); // Reset challenge timer when room is formed
      
      // Initialize participant statuses
      const initialStatuses = {};
      selected.forEach(participantId => {
        initialStatuses[participantId] = {
          status: 'active', // active, completed, eliminated
          completedLevels: [],
          currentLevel: currentLevel,
          lastActivity: null
        };
      });
      setParticipantStatuses(initialStatuses);
    };

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
        if (roomState === 'WAITING') {
          setTimeout(() => {
            selectRandomParticipants(uniqueUsers);
          }, 1000);
        }
        
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllUsers();
  }, [currentLevel, fetchEvents, roomState]);

  const formNewRoom = () => {
    setRoomState('WAITING');
    // Room formation will be handled by the useEffect when state changes
  };

  const handleChallengeStart = () => {
    setRoomState('CHALLENGE');
    setChallengeStartTime(Date.now());
    console.log('Challenge started! Level:', currentLevel, 'Room ID:', roomId);
  };

  const handleChallengeComplete = async (level) => {
    console.log('User claiming challenge completion for level:', level);
    
    try {
      // Post result to Nostr
      if (ndk) {
        const result = await postChallengeResult(ndk, level, true, roomId);
        if (result.success) {
          console.log('Challenge completion posted to Nostr:', result.eventId);
        }
      }
      
      // Move to next level
      setCurrentLevel(level + 1);
      setRoomState('FORMED');
      setChallengeTimer(120);
    } catch (error) {
      console.error('Failed to post challenge completion:', error);
    }
  };

  const handleChallengeTimeout = async () => {
    console.log('Challenge timed out - 24 hours expired');
    
    try {
      // Check for verified completions for all participants
      await verifyAllParticipants();
      
      // Eliminate participants who didn't complete the challenge
      const activeParticipants = roomParticipants.filter(participantId => {
        const status = participantStatuses[participantId];
        return status && status.status === 'completed';
      });
      
      if (activeParticipants.length === 0) {
        // All participants eliminated
        console.log('All participants eliminated!');
        setRoomState('WAITING'); // This will trigger room formation
      } else if (activeParticipants.length < roomParticipants.length) {
        // Some participants eliminated
        const eliminated = roomParticipants.filter(participantId => {
          const status = participantStatuses[participantId];
          return !status || status.status !== 'completed';
        });
        
        setRoomParticipants(activeParticipants);
        
        // Advance to next level with remaining participants
        setCurrentLevel(currentLevel + 1);
        setRoomState('FORMED');
        setChallengeTimer(120);
        
        console.log(`${eliminated.length} participants eliminated. ${activeParticipants.length} advance to level ${currentLevel + 1}`);
      } else {
        // All participants completed - advance everyone
        setCurrentLevel(currentLevel + 1);
        setRoomState('FORMED');
        setChallengeTimer(120);
        console.log('All participants advance to next level!');
      }
    } catch (error) {
      console.error('Failed to process challenge timeout:', error);
      setRoomState('FORMED');
    }
  };

  const handleParticipantElimination = async (participantId) => {
    console.log('Eliminating participant:', participantId);
    
    try {
      // Post elimination result to Nostr
      if (ndk) {
        const result = await postChallengeResult(ndk, currentLevel, false, roomId);
        if (result.success) {
          console.log('Elimination posted to Nostr:', result.eventId);
        }
      }
      
      // Update participant status
      setParticipantStatuses(prev => ({
        ...prev,
        [participantId]: {
          ...prev[participantId],
          status: 'eliminated'
        }
      }));
      
      setRoomParticipants(prev => prev.filter(id => id !== participantId));
      
      // Check if any participants remain
      if (roomParticipants.length <= 1) {
        console.log('Too few participants remaining - forming new room');
        setRoomState('WAITING');
      }
    } catch (error) {
      console.error('Failed to process elimination:', error);
    }
  };

  const verifyAllParticipants = async () => {
    if (!challengeStartTime) return;
    
    try {
      // Fetch recent 1301 events to check for completions
      const events = await fetchEvents({
        kinds: [1301],
        since: Math.floor(challengeStartTime / 1000),
        limit: 200
      });
      
      // Check each participant for valid completions
      const updatedStatuses = { ...participantStatuses };
      
      for (const participantId of roomParticipants) {
        const verification = findChallengeCompletionEvents(
          events, 
          participantId, 
          currentLevel, 
          challengeStartTime
        );
        
        if (verification.hasCompleted) {
          updatedStatuses[participantId] = {
            ...updatedStatuses[participantId],
            status: 'completed',
            lastActivity: verification.latestCompletion.timestamp,
            completedLevels: [...(updatedStatuses[participantId]?.completedLevels || []), currentLevel]
          };
          console.log(`Participant ${participantId} verified completion of level ${currentLevel}`);
        }
      }
      
      setParticipantStatuses(updatedStatuses);
    } catch (error) {
      console.error('Failed to verify participants:', error);
    }
  };

  // Handle participant status updates from the feed
  const handleParticipantStatusUpdate = (newStatuses) => {
    setFeedParticipantStatuses(newStatuses);
    
    // Update local participant statuses based on feed data
    const updatedStatuses = { ...participantStatuses };
    Object.keys(newStatuses).forEach(participantId => {
      const feedStatus = newStatuses[participantId];
      if (feedStatus.hasCompleted) {
        updatedStatuses[participantId] = {
          ...updatedStatuses[participantId],
          status: 'completed',
          completedLevels: [...(updatedStatuses[participantId]?.completedLevels || []), currentLevel],
          lastActivity: feedStatus.latestEvent?.created_at || Date.now()
        };
      }
    });
    setParticipantStatuses(updatedStatuses);
  };

  // Handle workout posted from StrengthWorkoutCreator
  const handleWorkoutPosted = (workoutEvent) => {
    console.log('New workout posted:', workoutEvent);
    // The feed will automatically refresh and pick up the new workout
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
        
        {/* Challenge Feed during challenge */}
        {challengeStartTime && (
          <ChallengeFeed
            roomParticipants={roomParticipants}
            challengeLevel={currentLevel}
            challengeStartTime={challengeStartTime}
            roomId={roomId}
            onParticipantStatusUpdate={handleParticipantStatusUpdate}
          />
        )}

        {/* Strength Workout Creator during challenge */}
        <StrengthWorkoutCreator
          challengeLevel={currentLevel}
          roomId={roomId}
          onWorkoutPosted={handleWorkoutPosted}
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
              <ChallengeParticipantCard 
                key={participantId} 
                participantId={participantId}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={h2Style}>Gantz Room</h2>
        
        {/* Challenge Timer - Show inline with title when room is formed */}
        {roomState === 'FORMED' && (
          <div style={{
            ...cardStyle,
            background: '#2a1a1a',
            border: '2px solid #ff6b6b',
            textAlign: 'center',
            marginBottom: '0',
            padding: '15px 20px'
          }}>
            <div style={{...h3Style, marginBottom: '10px', fontSize: '16px'}}>⏰ Challenge Begins In:</div>
            <TimerComponent
              initialSeconds={challengeTimer}
              format="MM:SS"
              style={{
                fontSize: '24px',
                color: '#ff6b6b',
                fontWeight: 'bold'
              }}
              onComplete={handleChallengeStart}
            />
          </div>
        )}
      </div>
      
      {/* Current Participants */}
      <div style={cardStyle}>
        <h3 style={h3Style}>Current Participants</h3>
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
            status={participantStatuses[participantId]}
            onEliminate={() => handleParticipantElimination(participantId)}
            currentLevel={currentLevel}
          />
        ))}
      </div>

      {/* Challenge Feed - Show when room is formed or in challenge */}
      {(roomState === 'FORMED' || roomState === 'CHALLENGE') && challengeStartTime && (
        <ChallengeFeed
          roomParticipants={roomParticipants}
          challengeLevel={currentLevel}
          challengeStartTime={challengeStartTime}
          roomId={roomId}
          onParticipantStatusUpdate={handleParticipantStatusUpdate}
        />
      )}

      {/* Strength Workout Creator - Show when room is formed or in challenge */}
      {(roomState === 'FORMED' || roomState === 'CHALLENGE') && (
        <StrengthWorkoutCreator
          challengeLevel={currentLevel}
          roomId={roomId}
          onWorkoutPosted={handleWorkoutPosted}
        />
      )}

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
              background: currentLevel <= 1 ? '#666' : '#ff6b6b',
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
              background: currentLevel >= 10 ? '#666' : '#ff6b6b',
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

const ParticipantCard = ({ participantId, position, cardStyle, h3Style, pStyle, status, onEliminate, currentLevel }) => {
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
    background: '#1a1a1a',
    textAlign: 'center'
  };

  return (
    <div style={participantCardStyle}>

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

    </div>
  );
};

// Simple component for challenge participants display
const ChallengeParticipantCard = ({ participantId }) => {
  const [profile, setProfile] = useState(null);
  const { fetchEvents } = useNostr();

  useEffect(() => {
    const loadProfile = async () => {
      try {
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
        console.error('Failed to load challenge participant profile:', error);
      }
    };
    loadProfile();
  }, [participantId, fetchEvents]);

  return (
    <div style={{
      background: '#333',
      padding: '10px',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #ff6b6b'
    }}>
      <div style={{color: '#ff6b6b', fontWeight: 'bold'}}>
        {profile?.name || `${participantId.slice(0, 8)}...` || 'Anonymous'}
      </div>
    </div>
  );
};

export default RoomTab;