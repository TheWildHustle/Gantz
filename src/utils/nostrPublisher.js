// Nostr Publishing Utilities for Gantz Challenge Results
// Handles posting challenge results and verification events to Nostr relays

/**
 * Publish an event to Nostr relays using NDK
 * @param {Object} ndk - NDK instance
 * @param {Object} eventData - Event data to publish
 * @returns {Promise<Object>} Publication result
 */
export const publishEvent = async (ndk, eventData) => {
  try {
    if (!ndk || !ndk.activeUser) {
      throw new Error('No active Nostr user found. Please connect your Nostr extension.');
    }

    // Create NDK event
    const ndkEvent = new ndk.NDKEvent(ndk, {
      kind: eventData.kind,
      content: eventData.content,
      tags: eventData.tags || [],
      created_at: eventData.created_at || Math.floor(Date.now() / 1000)
    });

    // Sign and publish
    await ndkEvent.sign();
    const publishResult = await ndkEvent.publish();
    
    return {
      success: true,
      eventId: ndkEvent.id,
      publishedTo: publishResult.size || 0,
      event: ndkEvent
    };
  } catch (error) {
    console.error('Failed to publish event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Post challenge completion result to Nostr
 * @param {Object} ndk - NDK instance
 * @param {number} challengeLevel - Challenge level completed
 * @param {boolean} completed - Whether challenge was completed
 * @param {string} roomId - Optional room identifier
 * @param {Object} workoutData - Optional workout verification data
 * @returns {Promise<Object>} Publication result
 */
export const postChallengeResult = async (ndk, challengeLevel, completed, roomId = null, workoutData = null) => {
  const content = completed ? 
    `🔥 GANTZ CHALLENGE LEVEL ${challengeLevel} COMPLETED! 💪\n\n` +
    `Just crushed another level in the Gantz fitness challenge! ` +
    `${workoutData ? `\n\nWorkout details:\n${formatWorkoutSummary(workoutData)}` : ''}` +
    `\n\n#GantzChallenge #Fitness #Level${challengeLevel} #NostrFitness` :
    
    `💀 Gantz Challenge Level ${challengeLevel} - Eliminated\n\n` +
    `Could not complete the challenge in time. The room demands perfection, but I'll train harder and return stronger! ` +
    `Every failure is a step toward victory.\n\n#GantzChallenge #Level${challengeLevel} #Training #NeverGiveUp`;

  const tags = [
    ['t', 'GantzChallenge'],
    ['t', 'Fitness'],
    ['t', 'NostrFitness'],
    ['t', `Level${challengeLevel}`],
    ['challenge_level', challengeLevel.toString()],
    ['challenge_result', completed ? 'completed' : 'eliminated'],
    ['challenge_timestamp', Date.now().toString()]
  ];

  if (roomId) {
    tags.push(['room_id', roomId]);
  }

  if (completed && workoutData) {
    // Add workout metadata tags
    if (workoutData.activityType) {
      tags.push(['activity_type', workoutData.activityType]);
    }
    if (workoutData.distance) {
      tags.push(['distance', workoutData.distance.toString()]);
    }
    if (workoutData.duration) {
      tags.push(['duration', workoutData.duration.toString()]);
    }
  }

  const eventData = {
    kind: 1, // Regular note
    content,
    tags,
    created_at: Math.floor(Date.now() / 1000)
  };

  return await publishEvent(ndk, eventData);
};

/**
 * Post a challenge verification event (for room organizers)
 * @param {Object} ndk - NDK instance
 * @param {string} participantPubkey - Participant's public key
 * @param {number} challengeLevel - Challenge level
 * @param {boolean} verified - Whether the challenge was verified
 * @param {Object} verificationData - Verification details
 * @returns {Promise<Object>} Publication result
 */
export const postChallengeVerification = async (ndk, participantPubkey, challengeLevel, verified, verificationData) => {
  const content = verified ?
    `✅ CHALLENGE VERIFICATION - Level ${challengeLevel}\n\n` +
    `Participant: ${participantPubkey.slice(0, 16)}...\n` +
    `Status: VERIFIED ✅\n` +
    `Verification details: ${JSON.stringify(verificationData, null, 2)}\n\n` +
    `#GantzVerification #Level${challengeLevel}` :
    
    `❌ CHALLENGE VERIFICATION - Level ${challengeLevel}\n\n` +
    `Participant: ${participantPubkey.slice(0, 16)}...\n` +
    `Status: FAILED VERIFICATION ❌\n` +
    `Reason: ${verificationData.errors?.join(', ') || 'Requirements not met'}\n\n` +
    `#GantzVerification #Level${challengeLevel}`;

  const eventData = {
    kind: 1,
    content,
    tags: [
      ['t', 'GantzVerification'],
      ['t', `Level${challengeLevel}`],
      ['p', participantPubkey], // Reference to participant
      ['challenge_level', challengeLevel.toString()],
      ['verification_result', verified ? 'verified' : 'failed'],
      ['verification_timestamp', Date.now().toString()]
    ]
  };

  return await publishEvent(ndk, eventData);
};

/**
 * Post a room formation announcement
 * @param {Object} ndk - NDK instance
 * @param {Array} participants - Array of participant pubkeys
 * @param {number} challengeLevel - Starting challenge level
 * @param {string} roomId - Room identifier
 * @returns {Promise<Object>} Publication result
 */
export const postRoomFormation = async (ndk, participants, challengeLevel, roomId) => {
  const content = `🏟️ GANTZ ROOM FORMED - LEVEL ${challengeLevel}\n\n` +
    `A new Gantz challenge room has been formed! ${participants.length} participants selected:\n\n` +
    participants.map((pubkey, index) => 
      `${index + 1}. ${pubkey.slice(0, 16)}...`
    ).join('\n') +
    `\n\nThe challenge begins now. Participants have 24 hours to complete Level ${challengeLevel}.\n` +
    `Only the strongest will advance. Good luck! 🔥\n\n` +
    `#GantzChallenge #RoomFormation #Level${challengeLevel}`;

  const tags = [
    ['t', 'GantzChallenge'],
    ['t', 'RoomFormation'],
    ['t', `Level${challengeLevel}`],
    ['room_id', roomId],
    ['challenge_level', challengeLevel.toString()],
    ['participant_count', participants.length.toString()],
    ['formation_timestamp', Date.now().toString()]
  ];

  // Add participant references
  participants.forEach(pubkey => {
    tags.push(['p', pubkey]);
  });

  const eventData = {
    kind: 1,
    content,
    tags
  };

  return await publishEvent(ndk, eventData);
};

/**
 * Format workout data for display in posts
 * @param {Object} workoutData - Parsed workout data
 * @returns {string} Formatted summary
 */
const formatWorkoutSummary = (workoutData) => {
  const parts = [];
  
  if (workoutData.activityType) {
    parts.push(`Activity: ${workoutData.activityType}`);
  }
  
  if (workoutData.distance) {
    parts.push(`Distance: ${workoutData.distance} miles`);
  }
  
  if (workoutData.duration) {
    const hours = Math.floor(workoutData.duration / 60);
    const minutes = Math.floor(workoutData.duration % 60);
    const seconds = Math.floor((workoutData.duration % 1) * 60);
    
    let timeStr = '';
    if (hours > 0) timeStr += `${hours}h `;
    if (minutes > 0) timeStr += `${minutes}m `;
    if (seconds > 0) timeStr += `${seconds}s`;
    
    parts.push(`Duration: ${timeStr.trim()}`);
  }
  
  if (workoutData.pushups) {
    parts.push(`Push-ups: ${workoutData.pushups}`);
  }
  
  if (workoutData.situps) {
    parts.push(`Sit-ups: ${workoutData.situps}`);
  }
  
  return parts.join('\n');
};

/**
 * Generate a unique room ID
 * @returns {string} Unique room identifier
 */
export const generateRoomId = () => {
  return `gantz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default {
  publishEvent,
  postChallengeResult,
  postChallengeVerification,
  postRoomFormation,
  generateRoomId
};