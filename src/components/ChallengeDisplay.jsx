import { useState, useEffect } from 'react';
import { getChallengeLevel } from '../utils/challengeData';
import TimerComponent from './TimerComponent';

const ChallengeDisplay = ({ level, onChallengeComplete, onChallengeTimeout }) => {
  const [challenge, setChallenge] = useState(null);
  const [challengeStartTime] = useState(Date.now());

  useEffect(() => {
    const challengeData = getChallengeLevel(level);
    setChallenge(challengeData);
  }, [level]);

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
    'Beginner': '#4ade80',
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

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            console.log('Challenge completed by user');
            if (onChallengeComplete) onChallengeComplete(challenge.level);
          }}
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 5px 15px rgba(34, 197, 94, 0.3)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 5px 15px rgba(34, 197, 94, 0.3)';
          }}
        >
          ✅ Mark as Completed
        </button>

        <button
          onClick={() => {
            console.log('User eliminated from challenge');
            // This will be used for elimination in Phase 4
          }}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 5px 15px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 5px 15px rgba(239, 68, 68, 0.3)';
          }}
        >
          ❌ Cannot Complete
        </button>
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