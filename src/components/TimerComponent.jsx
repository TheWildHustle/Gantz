import { useState, useEffect } from 'react';

const TimerComponent = ({ 
  initialSeconds, 
  onComplete, 
  autoStart = true, 
  format = 'MM:SS',
  style = {},
  prefix = '',
  suffix = '',
  isActive = true 
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart && isActive);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(autoStart && isActive);
  }, [initialSeconds, autoStart, isActive]);

  useEffect(() => {
    if (!isRunning || !isActive) return;

    if (timeLeft <= 0) {
      setIsRunning(false);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (onComplete) {
            setTimeout(onComplete, 100); // Small delay to ensure state updates
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete, isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    switch (format) {
      case 'MM:SS':
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      case 'M:SS':
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      case 'seconds':
        return `${seconds}s`;
      default:
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setTimeLeft(initialSeconds);
    setIsRunning(autoStart && isActive);
  };

  const timerStyle = {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: timeLeft <= 10 ? '#ff4444' : '#ff6b6b',
    ...style
  };

  return (
    <span style={timerStyle}>
      {prefix}{formatTime(timeLeft)}{suffix}
    </span>
  );
};

export default TimerComponent;