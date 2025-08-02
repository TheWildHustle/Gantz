import { useState, useEffect } from 'react';
import { useNostr } from '../contexts/useNostr';
import { getChallengeFeedData } from '../utils/workoutVerification';
import { storage } from '../utils/storage';
import { safeParseJSON, validateProfilePicture } from '../utils/dataHelpers';

const ChallengeFeed = ({ 
  roomParticipants, 
  challengeLevel, 
  challengeStartTime, 
  roomId,
  onParticipantStatusUpdate 
}) => {
  const { fetchEvents } = useNostr();
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333333',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  };

  const h3Style = {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#ff6b6b'
  };

  const pStyle = {
    color: '#cccccc',
    lineHeight: '1.6',
    margin: '0'
  };

  // Load challenge feed data
  useEffect(() => {
    const loadFeedData = async () => {
      if (!challengeStartTime || !roomParticipants.length) return;
      
      try {
        setLoading(true);
        
        // Fetch 1301 events from challenge timeframe
        const events = await fetchEvents({
          kinds: [1301],
          authors: roomParticipants,
          since: Math.floor(challengeStartTime / 1000),
          limit: 50
        });

        // Process events with enhanced verification data
        const processedFeedData = getChallengeFeedData(
          events,
          roomParticipants,
          challengeLevel,
          challengeStartTime,
          roomId
        );

        setFeedData(processedFeedData);
        setLastUpdate(Date.now());

        // Update parent component with participant status
        if (onParticipantStatusUpdate) {
          onParticipantStatusUpdate(processedFeedData.participantStatus);
        }

      } catch (error) {
        console.error('Failed to load challenge feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeedData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadFeedData, 30000);
    return () => clearInterval(interval);
  }, [roomParticipants, challengeLevel, challengeStartTime, roomId, fetchEvents, onParticipantStatusUpdate]);

  if (loading) {
    return (
      <div style={cardStyle}>
        <h3 style={h3Style}>Loading Challenge Feed...</h3>
        <p style={pStyle}>Scanning for participant workout submissions...</p>
      </div>
    );
  }

  if (!feedData || feedData.allEvents.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={h3Style}>📋 Challenge Feed</h3>
        <p style={pStyle}>No workout submissions yet. Be the first to complete the challenge!</p>
        {lastUpdate && (
          <p style={{...pStyle, fontSize: '12px', marginTop: '10px', color: '#888'}}>
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{...h3Style, marginBottom: '0'}}>
          📋 Challenge Feed ({feedData.summary.totalEvents} workouts)
        </h3>
        {lastUpdate && (
          <span style={{fontSize: '12px', color: '#888'}}>
            Updated: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Feed summary */}
      <div style={{
        background: '#2a1a1a',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ff6b6b'
      }}>
        <p style={{...pStyle, fontSize: '14px'}}>
          <span style={{color: '#22c55e', fontWeight: 'bold'}}>
            {feedData.summary.validEvents} verified
          </span>
          {' • '}
          <span style={{color: '#ff6b6b', fontWeight: 'bold'}}>
            {feedData.summary.completedParticipants}/{feedData.summary.totalParticipants} participants completed
          </span>
        </p>
      </div>

      {/* Event feed */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        paddingRight: '10px'
      }}>
        {feedData.allEvents.map((event, index) => (
          <FeedItem 
            key={event.id || index}
            event={event}
            style={{
              background: '#2a1a1a',
              border: `1px solid ${event.feedMetadata.isValid ? '#22c55e' : '#666'}`,
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '12px'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Individual feed item component
const FeedItem = ({ event, style }) => {
  const [profile, setProfile] = useState(null);
  const { fetchEvents } = useNostr();

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const cachedProfile = storage.getProfile(event.author);
        if (cachedProfile) {
          setProfile(cachedProfile);
          return;
        }

        const profileEvents = await fetchEvents({
          kinds: [0],
          authors: [event.author],
          limit: 1,
        });

        if (profileEvents.length > 0) {
          const profileData = safeParseJSON(profileEvents[0].content);
          if (profileData) {
            setProfile(profileData);
            storage.cacheProfile(event.author, profileData);
          }
        }
      } catch (error) {
        console.error('Failed to load profile for feed item:', error);
      }
    };

    loadProfile();
  }, [event.author, fetchEvents]);

  const timeAgo = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={style}>
      {/* Header with user info and verification badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* User avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ff6b6b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
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
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {profile?.name?.[0]?.toUpperCase() || event.author.slice(0, 1)?.toUpperCase() || 'A'}
            </div>
          </div>

          <div>
            <div style={{
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {profile?.name || `${event.author.slice(0, 8)}...`}
            </div>
            <div style={{
              color: '#888',
              fontSize: '12px'
            }}>
              {timeAgo(event.created_at)}
            </div>
          </div>
        </div>

        {/* Verification badge */}
        <div style={{
          background: event.feedMetadata.verificationBadge.color + '20',
          color: event.feedMetadata.verificationBadge.color,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          border: `1px solid ${event.feedMetadata.verificationBadge.color}50`
        }}>
          {event.feedMetadata.verificationBadge.icon} {event.feedMetadata.verificationBadge.text}
        </div>
      </div>

      {/* Workout summary */}
      <div style={{
        color: '#cccccc',
        fontSize: '14px',
        marginBottom: '8px'
      }}>
        {event.feedMetadata.workoutSummary}
      </div>

      {/* Content excerpt */}
      {event.content && (
        <div style={{
          color: '#888',
          fontSize: '13px',
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          "{event.content.length > 100 ? event.content.slice(0, 100) + '...' : event.content}"
        </div>
      )}
    </div>
  );
};

export default ChallengeFeed;