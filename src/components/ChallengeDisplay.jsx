import { useState, useEffect } from 'react';
import { getChallengeLevel } from '../utils/challengeData';
import { findChallengeCompletionEvents } from '../utils/workoutVerification';
import { useNostr } from '../contexts/useNostr';
import TimerComponent from './TimerComponent';

const ChallengeDisplay = ({ level, onChallengeComplete, onChallengeTimeout }) => {
  const [challenge, setChallenge] = useState(null);
  const [challengeStartTime] = useState(Date.now());
  const [verificationStatus, setVerificationStatus] = useState(null);
  const { fetchEvents, ndk } = useNostr();

  useEffect(() => {
    const challengeData = getChallengeLevel(level);
    setChallenge(challengeData);
    setVerificationStatus(null); // Reset verification when level changes
  }, [level]);

  // Auto-verify user's workouts every 30 seconds
  useEffect(() => {
    if (!ndk?.activeUser) return;
    
    const verifyWorkouts = async () => {
      try {
        const userPubkey = ndk.activeUser.pubkey;
        
        // Fetch recent 1301 events from the user
        const events = await fetchEvents({
          kinds: [1301],
          authors: [userPubkey],
          since: Math.floor(challengeStartTime / 1000),
          limit: 20
        });
        
        
        // Check for valid completions
        const verification = findChallengeCompletionEvents(
          events,
          userPubkey,
          level,
          challengeStartTime
        );
        
        setVerificationStatus(verification);
        
        // Auto-complete if verified
        if (verification.hasCompleted) {
          console.log('Auto-verified challenge completion!');
        }
      } catch (error) {
        console.error('Failed to verify workouts:', error);
      }
    };
    
    // Initial verification
    verifyWorkouts();
    
    // Set up periodic verification
    const interval = setInterval(verifyWorkouts, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [level, challengeStartTime, ndk, fetchEvents]);

  if (!challenge) {
    return (
      <div style={{
        background: '#1a1a1a',
        border: '2px solid #ff6b6b',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#ff6b6b', marginBottom: '15px' }}>Loading Challenge...</h3>
      </div>
    );
  }

  const cardStyle = {
    background: 'linear-gradient(135deg, #2a1a1a 0%, #1a1a1a 100%)',
    border: '3px solid #ff6b6b',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: '10px',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(255, 107, 107, 0.5)'
  };

  const descriptionStyle = {
    fontSize: '24px',
    color: '#ffffff',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '600'
  };

  const difficultyColors = {
    'Beginner+': '#22d3ee', 
    'Intermediate': '#f59e0b',
    'Intermediate+': '#f97316',
    'Advanced': '#ef4444',
    'Elite': '#8b5cf6',
    'EXTREME': '#dc2626'
  };

  const getDifficultyStyle = (difficulty) => ({
    background: difficultyColors[difficulty] || '#ff6b6b',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-block',
    marginBottom: '20px'
  });

  const requirementStyle = {
    background: '#333333',
    border: '1px solid #555555',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    fontSize: '16px',
    color: '#cccccc'
  };

  // Calculate 24-hour timer in seconds
  const twentyFourHoursInSeconds = 24 * 60 * 60; // 86400 seconds

  return (
    <div style={cardStyle}>
      {/* Decorative background element */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        fontSize: '120px',
        opacity: '0.1',
        color: '#ff6b6b',
        lineHeight: '1',
        pointerEvents: 'none'
      }}>
        {challenge.emoji}
      </div>

      {/* Level Badge */}
      <div style={{
        position: 'absolute',
        top: '-3px',
        left: '-3px',
        background: '#ff6b6b',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '15px 0 15px 0',
        fontSize: '18px',
        fontWeight: 'bold',
        boxShadow: '0 5px 15px rgba(255, 107, 107, 0.4)'
      }}>
        LEVEL {challenge.level}
      </div>

      {/* Challenge Header */}
      <div style={{ marginTop: '20px', marginBottom: '25px' }}>
        <h2 style={titleStyle}>
          {challenge.emoji} {challenge.title}
        </h2>
        
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <span style={getDifficultyStyle(challenge.difficulty)}>
            {challenge.difficulty}
          </span>
        </div>

        <p style={descriptionStyle}>
          {challenge.description}
        </p>
      </div>

      {/* 24-Hour Countdown Timer */}
      <div style={{
        background: 'rgba(255, 107, 107, 0.1)',
        border: '2px solid #ff6b6b',
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <h3 style={{ 
          color: '#ff6b6b', 
          marginBottom: '10px',
          fontSize: '18px'
        }}>
          ⏰ Challenge Deadline
        </h3>
        <TimerComponent
          initialSeconds={twentyFourHoursInSeconds}
          format="MM:SS"
          style={{
            fontSize: '28px',
            color: '#ff6b6b',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}
          onComplete={() => {
            console.log('24-hour challenge period expired');
            if (onChallengeTimeout) onChallengeTimeout();
          }}
        />
        <p style={{ 
          color: '#cccccc', 
          marginTop: '10px',
          fontSize: '14px' 
        }}>
          You have 24 hours to complete this challenge
        </p>
      </div>

      {/* Requirements */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{
          color: '#ffffff',
          marginBottom: '15px',
          fontSize: '20px',
          borderBottom: '2px solid #ff6b6b',
          paddingBottom: '5px'
        }}>
          Requirements
        </h3>
        
        {challenge.requirements.map((requirement, index) => (
          <div key={index} style={requirementStyle}>
            <span style={{ color: '#ff6b6b', marginRight: '10px' }}>
              {index + 1}.
            </span>
            {requirement}
          </div>
        ))}
      </div>


      {/* Automated Verification Notice */}
      <div style={{
        background: 'rgba(255, 107, 107, 0.1)',
        border: '2px solid #ff6b6b',
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          color: '#ff6b6b', 
          marginBottom: '10px',
          fontSize: '18px'
        }}>
          🎯 Automated Challenge Verification
        </h3>
        <p style={{ 
          color: '#cccccc', 
          marginBottom: '15px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <strong>RUNSTR</strong> assists in cardio workouts. <strong>POWR</strong> assists in strength workouts. 
          Workouts from those apps will count towards the room's challenge. You can also use the 
          <strong> Strength Workout Creator</strong> below to post workouts directly.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          fontSize: '14px',
          color: '#888'
        }}>
          <span>💪 Post Workout</span>
          <span>→</span>
          <span>📋 Auto-Verification</span>
          <span>→</span>
          <span>✅ Challenge Progress</span>
        </div>
      </div>

      {/* Challenge Info Footer */}
      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#888888',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          💡 Tip: Post your workout to Nostr with Kind 1301 events for verification
        </p>
        <p style={{ margin: '0' }}>
          Challenge started: {new Date(challengeStartTime).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ChallengeDisplay;