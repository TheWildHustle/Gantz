// Workout Verification System for Gantz Challenges
// Parses Kind 1301 Nostr events and validates against challenge requirements

import { validateChallengeCompletion } from './challengeData';

/**
 * Parse a Kind 1301 workout event and extract structured data
 * @param {Object} event - The Nostr Kind 1301 event
 * @returns {Object} Parsed workout data
 */
export const parseWorkoutEvent = (event) => {
  if (!event || event.kind !== 1301) {
    throw new Error('Invalid workout event - must be Kind 1301');
  }

  const workoutData = {
    eventId: event.id,
    author: event.author?.pubkey || event.pubkey,
    timestamp: event.created_at,
    rawContent: event.content,
    tags: event.tags || [],
    // Initialize workout metrics
    activityType: null,
    distance: null,
    duration: null,
    pushups: null,
    situps: null,
    calories: null,
    heartRate: null
  };

  // Parse tags for workout data
  event.tags.forEach(tag => {
    if (!Array.isArray(tag) || tag.length < 2) return;

    const [tagName, tagValue] = tag;
    
    switch (tagName.toLowerCase()) {
      case 't': // Activity type tag
        workoutData.activityType = tagValue.toLowerCase();
        break;
      case 'distance':
        workoutData.distance = parseFloat(tagValue);
        break;
      case 'duration':
        // Parse duration in various formats (minutes, MM:SS, HH:MM:SS)
        workoutData.duration = parseDuration(tagValue);
        break;
      case 'pushups':
      case 'push-ups':
      case 'reps':
        if (tagValue && (event.content.toLowerCase().includes('pushup') || 
                       event.content.toLowerCase().includes('push-up'))) {
          workoutData.pushups = parseInt(tagValue);
        }
        break;
      case 'situps':
      case 'sit-ups':
      case 'crunches':
        workoutData.situps = parseInt(tagValue);
        break;
      case 'calories':
        workoutData.calories = parseInt(tagValue);
        break;
      case 'heart_rate':
      case 'heartrate':
        workoutData.heartRate = parseInt(tagValue);
        break;
    }
  });

  // Parse content for additional data if tags are incomplete
  if (!workoutData.activityType || !workoutData.distance) {
    const contentData = parseWorkoutContent(event.content);
    workoutData.activityType = workoutData.activityType || contentData.activityType;
    workoutData.distance = workoutData.distance || contentData.distance;
    workoutData.duration = workoutData.duration || contentData.duration;
    workoutData.pushups = workoutData.pushups || contentData.pushups;
    workoutData.situps = workoutData.situps || contentData.situps;
  }

  return workoutData;
};

/**
 * Parse workout content text for metrics
 * @param {string} content - The workout content text
 * @returns {Object} Extracted metrics
 */
const parseWorkoutContent = (content) => {
  const data = {
    activityType: null,
    distance: null,
    duration: null,
    pushups: null,
    situps: null
  };

  if (!content) return data;
  
  const lowerContent = content.toLowerCase();

  // Activity type detection
  if (lowerContent.includes('running') || lowerContent.includes(' run ')) {
    data.activityType = 'running';
  } else if (lowerContent.includes('walking') || lowerContent.includes(' walk ')) {
    data.activityType = 'walking';
  } else if (lowerContent.includes('cycling') || lowerContent.includes('biking') || lowerContent.includes(' bike ')) {
    data.activityType = 'cycling';
  }

  // Distance extraction (miles, km, meters)
  const distancePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:miles?|mi)/i,
    /(\d+(?:\.\d+)?)\s*(?:kilometers?|km)/i,
    /(\d+(?:\.\d+)?)\s*(?:meters?|m)(?!\s*in)/i // avoid "minutes"
  ];

  distancePatterns.forEach((pattern, index) => {
    const match = content.match(pattern);
    if (match) {
      let distance = parseFloat(match[1]);
      // Convert to miles
      if (index === 1) distance *= 0.621371; // km to miles
      if (index === 2) distance *= 0.000621371; // meters to miles
      data.distance = distance;
    }
  });

  // Duration extraction
  const durationPatterns = [
    /(\d+:\d+(?::\d+)?)/g, // MM:SS or HH:MM:SS
    /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)/i,
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)/i
  ];

  durationPatterns.forEach((pattern, index) => {
    const match = content.match(pattern);
    if (match) {
      if (index === 0) {
        data.duration = parseDuration(match[1]);
      } else if (index === 1) {
        data.duration = parseFloat(match[1]);
      } else if (index === 2) {
        data.duration = parseFloat(match[1]) * 60; // hours to minutes
      }
    }
  });

  // Exercise repetitions
  const pushupPatterns = [
    /(\d+)\s*(?:push-?ups?|pushups?)/i,
    /push-?ups?:?\s*(\d+)/i
  ];

  pushupPatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match) {
      data.pushups = parseInt(match[1]);
    }
  });

  const situpPatterns = [
    /(\d+)\s*(?:sit-?ups?|situps?|crunches?)/i,
    /(?:sit-?ups?|situps?|crunches?):?\s*(\d+)/i
  ];

  situpPatterns.forEach(pattern => {
    const match = content.match(pattern);
    if (match) {
      data.situps = parseInt(match[1]);
    }
  });

  return data;
};

/**
 * Parse duration string into minutes
 * @param {string} durationStr - Duration in various formats
 * @returns {number} Duration in minutes
 */
const parseDuration = (durationStr) => {
  if (!durationStr) return null;
  
  // Handle MM:SS or HH:MM:SS format
  if (durationStr.includes(':')) {
    const parts = durationStr.split(':').map(p => parseInt(p));
    if (parts.length === 2) {
      // MM:SS
      return parts[0] + (parts[1] / 60);
    } else if (parts.length === 3) {
      // HH:MM:SS
      return (parts[0] * 60) + parts[1] + (parts[2] / 60);
    }
  }
  
  // Handle plain number (assume minutes)
  const num = parseFloat(durationStr);
  return isNaN(num) ? null : num;
};

/**
 * Verify if a workout event satisfies a specific challenge level
 * @param {number} challengeLevel - The challenge level (1-10)
 * @param {Object} workoutEvent - The Kind 1301 event
 * @returns {Object} Verification result
 */
export const verifyChallengeCompletion = (challengeLevel, workoutEvent) => {
  try {
    const workoutData = parseWorkoutEvent(workoutEvent);
    const verification = validateChallengeCompletion(challengeLevel, workoutData);
    
    return {
      success: true,
      isValid: verification.isValid,
      errors: verification.errors,
      workoutData,
      challenge: verification.challenge,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
};

/**
 * Find and verify workout events for a specific user and challenge
 * @param {Array} events - Array of Kind 1301 events
 * @param {string} userPubkey - User's public key
 * @param {number} challengeLevel - Challenge level to verify
 * @param {number} challengeStartTime - When challenge started (timestamp)
 * @returns {Object} Verification results
 */
export const findChallengeCompletionEvents = (events, userPubkey, challengeLevel, challengeStartTime) => {
  const userEvents = events.filter(event => {
    const eventAuthor = event.author?.pubkey || event.pubkey;
    return eventAuthor === userPubkey && 
           event.created_at >= challengeStartTime &&
           event.kind === 1301;
  });

  const verificationResults = userEvents.map(event => 
    verifyChallengeCompletion(challengeLevel, event)
  );

  const validCompletions = verificationResults.filter(result => 
    result.success && result.isValid
  );

  return {
    totalEvents: userEvents.length,
    validCompletions: validCompletions.length,
    hasCompleted: validCompletions.length > 0,
    latestCompletion: validCompletions.length > 0 ? 
      validCompletions[validCompletions.length - 1] : null,
    allResults: verificationResults,
    userEvents
  };
};

/**
 * Get detailed challenge feed data for all participants
 * @param {Array} events - Array of Kind 1301 events
 * @param {Array} participantPubkeys - Array of participant public keys
 * @param {number} challengeLevel - Challenge level to verify
 * @param {number} challengeStartTime - When challenge started (timestamp)
 * @param {string} roomId - Optional room identifier for filtering
 * @returns {Object} Feed data with verification details
 */
export const getChallengeFeedData = (events, participantPubkeys, challengeLevel, challengeStartTime, roomId = null) => {
  // Filter events to challenge participants and timeframe
  const challengeEvents = events.filter(event => {
    const eventAuthor = event.author?.pubkey || event.pubkey;
    const isParticipant = participantPubkeys.includes(eventAuthor);
    const inTimeframe = event.created_at >= Math.floor(challengeStartTime / 1000);
    const isWorkoutEvent = event.kind === 1301;
    
    // Optional: filter by room ID if provided
    let hasRoomTag = true;
    if (roomId) {
      hasRoomTag = event.tags?.some(tag => 
        Array.isArray(tag) && 
        tag[0] === 'challenge_id' && 
        tag[1] === roomId
      );
    }
    
    return isParticipant && inTimeframe && isWorkoutEvent && hasRoomTag;
  });

  // Process each event with verification
  const processedEvents = challengeEvents.map(event => {
    const verification = verifyChallengeCompletion(challengeLevel, event);
    const eventAuthor = event.author?.pubkey || event.pubkey;
    
    return {
      ...event,
      author: eventAuthor,
      verification,
      feedMetadata: {
        isValid: verification.success && verification.isValid,
        timestamp: event.created_at,
        timeSinceChallenge: event.created_at - Math.floor(challengeStartTime / 1000),
        workoutSummary: generateWorkoutSummary(verification.workoutData || {}),
        verificationBadge: getVerificationBadge(verification),
        sortPriority: verification.success && verification.isValid ? 1 : 2
      }
    };
  });

  // Sort by verification status, then by timestamp (newest first)
  processedEvents.sort((a, b) => {
    if (a.feedMetadata.sortPriority !== b.feedMetadata.sortPriority) {
      return a.feedMetadata.sortPriority - b.feedMetadata.sortPriority;
    }
    return b.created_at - a.created_at;
  });

  // Get completion status for each participant
  const participantStatus = {};
  participantPubkeys.forEach(pubkey => {
    const participantEvents = processedEvents.filter(event => event.author === pubkey);
    const hasValidCompletion = participantEvents.some(event => event.feedMetadata.isValid);
    
    participantStatus[pubkey] = {
      hasCompleted: hasValidCompletion,
      eventCount: participantEvents.length,
      latestEvent: participantEvents.length > 0 ? participantEvents[0] : null,
      allEvents: participantEvents
    };
  });

  return {
    allEvents: processedEvents,
    participantStatus,
    summary: {
      totalEvents: processedEvents.length,
      validEvents: processedEvents.filter(e => e.feedMetadata.isValid).length,
      completedParticipants: Object.values(participantStatus).filter(status => status.hasCompleted).length,
      totalParticipants: participantPubkeys.length
    },
    lastUpdated: Date.now()
  };
};

/**
 * Generate a human-readable workout summary for feed display
 * @param {Object} workoutData - Parsed workout data
 * @returns {string} Summary text
 */
const generateWorkoutSummary = (workoutData) => {
  if (!workoutData) return 'Workout completed';
  
  const parts = [];
  
  if (workoutData.activityType) {
    parts.push(workoutData.activityType);
  }
  
  if (workoutData.distance) {
    parts.push(`${workoutData.distance.toFixed(1)} miles`);
  }
  
  if (workoutData.duration) {
    const mins = Math.floor(workoutData.duration);
    const secs = Math.round((workoutData.duration - mins) * 60);
    if (secs > 0) {
      parts.push(`${mins}:${secs.toString().padStart(2, '0')}`);
    } else {
      parts.push(`${mins} min`);
    }
  }
  
  if (workoutData.pushups) {
    parts.push(`${workoutData.pushups} pushups`);
  }
  
  if (workoutData.situps) {
    parts.push(`${workoutData.situps} situps`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Workout completed';
};

/**
 * Get verification badge information for UI display
 * @param {Object} verification - Verification result
 * @returns {Object} Badge display info
 */
const getVerificationBadge = (verification) => {
  if (!verification || !verification.success) {
    return {
      type: 'error',
      text: 'Invalid Event',
      color: '#ef4444',
      icon: '❌'
    };
  }
  
  if (verification.isValid) {
    return {
      type: 'verified',
      text: 'Verified',
      color: '#22c55e',
      icon: '✅'
    };
  }
  
  return {
    type: 'unverified',
    text: 'Not Qualifying',
    color: '#f59e0b',
    icon: '⚠️'
  };
};

/**
 * Create a result event for posting to Nostr
 * @param {number} challengeLevel - Challenge level completed
 * @param {boolean} completed - Whether challenge was completed
 * @param {string} roomId - Optional room identifier
 * @returns {Object} Event template for posting
 */
export const createChallengeResultEvent = (challengeLevel, completed, roomId = null) => {
  const baseEvent = {
    kind: 1, // Regular note
    content: completed ? 
      `✅ Gantz Challenge Level ${challengeLevel} COMPLETED! 💪 #GantzChallenge #Fitness #Level${challengeLevel}` :
      `❌ Gantz Challenge Level ${challengeLevel} - Could not complete in time. Will train harder! #GantzChallenge #Level${challengeLevel}`,
    tags: [
      ['t', 'GantzChallenge'],
      ['t', 'Fitness'],
      ['t', `Level${challengeLevel}`],
      ['challenge_level', challengeLevel.toString()],
      ['challenge_result', completed ? 'completed' : 'failed'],
      ['challenge_timestamp', Date.now().toString()]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };

  if (roomId) {
    baseEvent.tags.push(['room_id', roomId]);
  }

  return baseEvent;
};

export default {
  parseWorkoutEvent,
  verifyChallengeCompletion,
  findChallengeCompletionEvents,
  getChallengeFeedData,
  createChallengeResultEvent
};