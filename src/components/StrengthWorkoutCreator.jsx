import { useState } from 'react';
import { useNostr } from '../contexts/useNostr';

const StrengthWorkoutCreator = ({ 
  challengeLevel, 
  roomId, 
  onWorkoutPosted 
}) => {
  const { ndk } = useNostr();
  const [isOpen, setIsOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [workoutData, setWorkoutData] = useState({
    exerciseType: 'pushups',
    reps: '',
    sets: '',
    duration: '',
    notes: '',
    verificationMethod: 'manual' // manual, ml_verification (future)
  });

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

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    marginBottom: '15px'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const buttonStyle = {
    background: '#ff6b6b',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px'
  };

  const exerciseOptions = [
    { value: 'pushups', label: 'Push-ups', repsLabel: 'Reps' },
    { value: 'situps', label: 'Sit-ups', repsLabel: 'Reps' },
    { value: 'pullups', label: 'Pull-ups', repsLabel: 'Reps' },
    { value: 'squats', label: 'Squats', repsLabel: 'Reps' },
    { value: 'burpees', label: 'Burpees', repsLabel: 'Reps' },
    { value: 'plank', label: 'Plank', repsLabel: 'Duration (seconds)' },
    { value: 'jumping_jacks', label: 'Jumping Jacks', repsLabel: 'Reps' },
    { value: 'lunges', label: 'Lunges', repsLabel: 'Reps (each leg)' }
  ];

  const selectedExercise = exerciseOptions.find(ex => ex.value === workoutData.exerciseType);

  const handleInputChange = (field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateWorkout = () => {
    if (!workoutData.reps && workoutData.exerciseType !== 'plank') {
      return 'Please enter the number of reps';
    }
    if (workoutData.exerciseType === 'plank' && !workoutData.duration) {
      return 'Please enter plank duration in seconds';
    }
    return null;
  };

  const generateWorkoutContent = () => {
    const exercise = selectedExercise;
    let content = `Completed ${exercise.label.toLowerCase()}`;
    
    if (workoutData.exerciseType === 'plank') {
      const mins = Math.floor(workoutData.duration / 60);
      const secs = workoutData.duration % 60;
      if (mins > 0) {
        content += ` for ${mins}:${secs.toString().padStart(2, '0')}`;
      } else {
        content += ` for ${secs} seconds`;
      }
    } else {
      if (workoutData.sets && parseInt(workoutData.sets) > 1) {
        content += `: ${workoutData.sets} sets of ${workoutData.reps} reps`;
      } else {
        content += `: ${workoutData.reps} reps`;
      }
    }

    if (workoutData.notes) {
      content += `. ${workoutData.notes}`;
    }

    content += ` #GantzChallenge #Level${challengeLevel} #StrengthTraining`;
    
    return content;
  };

  const generateEventTags = () => {
    const tags = [
      ['t', 'GantzChallenge'],
      ['t', 'StrengthTraining'],
      ['t', `Level${challengeLevel}`],
      ['exercise', workoutData.exerciseType],
      ['challenge_level', challengeLevel.toString()],
      ['verification', workoutData.verificationMethod],
      ['app', 'gantz_strength']
    ];

    if (roomId) {
      tags.push(['challenge_id', roomId]);
    }

    if (workoutData.reps) {
      tags.push(['reps', workoutData.reps.toString()]);
    }

    if (workoutData.sets) {
      tags.push(['sets', workoutData.sets.toString()]);
    }

    if (workoutData.duration) {
      tags.push(['duration', workoutData.duration.toString()]);
    }

    // Add timestamp for verification
    tags.push(['workout_timestamp', Date.now().toString()]);

    return tags;
  };

  const handlePostWorkout = async () => {
    const validationError = validateWorkout();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!ndk || !ndk.activeUser) {
      alert('Please connect your Nostr extension first');
      return;
    }

    try {
      setIsPosting(true);

      const event = {
        kind: 1301,
        content: generateWorkoutContent(),
        tags: generateEventTags(),
        created_at: Math.floor(Date.now() / 1000)
      };

      // Sign and publish the event
      const signedEvent = await ndk.publish(event);
      
      console.log('Strength workout posted:', signedEvent);

      // Reset form
      setWorkoutData({
        exerciseType: 'pushups',
        reps: '',
        sets: '',
        duration: '',
        notes: '',
        verificationMethod: 'manual'
      });
      
      setIsOpen(false);

      // Notify parent component
      if (onWorkoutPosted) {
        onWorkoutPosted(signedEvent);
      }

      alert('Workout posted successfully!');

    } catch (error) {
      console.error('Failed to post workout:', error);
      alert('Failed to post workout. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) {
    return (
      <div style={cardStyle}>
        <h3 style={h3Style}>💪 Post Strength Workout</h3>
        <p style={{color: '#cccccc', marginBottom: '15px'}}>
          Complete your strength training and verify your performance for the challenge.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          style={buttonStyle}
        >
          + Add Strength Workout
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h3 style={h3Style}>💪 Post Strength Workout</h3>
      
      {/* Exercise Type Selection */}
      <div style={{marginBottom: '15px'}}>
        <label style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'block',
          marginBottom: '8px'
        }}>
          Exercise Type
        </label>
        <select
          style={selectStyle}
          value={workoutData.exerciseType}
          onChange={(e) => handleInputChange('exerciseType', e.target.value)}
        >
          {exerciseOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reps/Duration Input */}
      <div style={{marginBottom: '15px'}}>
        <label style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'block',
          marginBottom: '8px'
        }}>
          {selectedExercise?.repsLabel || 'Reps'}
        </label>
        {workoutData.exerciseType === 'plank' ? (
          <input
            type="number"
            style={inputStyle}
            placeholder="Duration in seconds (e.g., 60)"
            value={workoutData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
          />
        ) : (
          <input
            type="number"
            style={inputStyle}
            placeholder="Number of reps (e.g., 20)"
            value={workoutData.reps}
            onChange={(e) => handleInputChange('reps', e.target.value)}
          />
        )}
      </div>

      {/* Sets Input (not for plank) */}
      {workoutData.exerciseType !== 'plank' && (
        <div style={{marginBottom: '15px'}}>
          <label style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'block',
            marginBottom: '8px'
          }}>
            Sets (Optional)
          </label>
          <input
            type="number"
            style={inputStyle}
            placeholder="Number of sets (e.g., 3)"
            value={workoutData.sets}
            onChange={(e) => handleInputChange('sets', e.target.value)}
          />
        </div>
      )}

      {/* Notes */}
      <div style={{marginBottom: '20px'}}>
        <label style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'block',
          marginBottom: '8px'
        }}>
          Notes (Optional)
        </label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: '80px',
            resize: 'vertical'
          }}
          placeholder="Additional notes about your workout..."
          value={workoutData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      {/* Privacy Notice */}
      <div style={{
        background: '#2a1a1a',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{
          color: '#ff6b6b',
          fontSize: '14px',
          marginBottom: '8px'
        }}>
          📝 Manual Verification
        </h4>
        <p style={{
          color: '#cccccc',
          fontSize: '13px',
          margin: '0',
          lineHeight: '1.4'
        }}>
          This workout will be posted as a manual entry. Future updates will include 
          optional camera-based verification for enhanced accuracy while maintaining privacy.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{display: 'flex', gap: '10px'}}>
        <button
          onClick={handlePostWorkout}
          disabled={isPosting}
          style={{
            ...buttonStyle,
            background: isPosting ? '#666' : '#ff6b6b',
            cursor: isPosting ? 'not-allowed' : 'pointer'
          }}
        >
          {isPosting ? 'Posting...' : 'Post Workout'}
        </button>
        
        <button
          onClick={() => setIsOpen(false)}
          disabled={isPosting}
          style={{
            ...buttonStyle,
            background: '#666',
            cursor: isPosting ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StrengthWorkoutCreator;