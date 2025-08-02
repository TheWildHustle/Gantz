// Gantz Challenge Levels - Progressive Difficulty
export const CHALLENGE_LEVELS = {
  1: {
    level: 1,
    title: "Endurance Foundation",
    description: "Walk, run, or cycle 1 mile",
    requirements: [
      "Complete 1 mile distance",
      "Choose: walking, running, or cycling",
      "Any pace acceptable"
    ],
    timeLimit: 24, // hours
    difficulty: "Beginner",
    emoji: "🚶‍♂️",
    verificationTags: ["distance", "activity_type"],
    minDistance: 1.0, // miles
    acceptedActivities: ["walking", "running", "cycling"]
  },
  
  2: {
    level: 2,
    title: "Distance Builder",
    description: "Walk, run, or cycle 2 miles",
    requirements: [
      "Complete 2 miles distance",
      "Choose: walking, running, or cycling", 
      "Any pace acceptable"
    ],
    timeLimit: 24,
    difficulty: "Beginner+",
    emoji: "🚴‍♂️",
    verificationTags: ["distance", "activity_type"],
    minDistance: 2.0,
    acceptedActivities: ["walking", "running", "cycling"]
  },

  3: {
    level: 3,
    title: "Strength & Cardio",
    description: "Walk, run, or cycle 1 mile AND do 100 pushups",
    requirements: [
      "Complete 1 mile distance (walk/run/cycle)",
      "Complete 100 pushups",
      "Both exercises must be completed within 24 hours"
    ],
    timeLimit: 24,
    difficulty: "Intermediate",
    emoji: "💪",
    verificationTags: ["distance", "activity_type", "pushups", "reps"],
    minDistance: 1.0,
    minPushups: 100,
    acceptedActivities: ["walking", "running", "cycling"]
  },

  4: {
    level: 4,
    title: "Speed Challenge I",
    description: "Run a 5K in under 40 minutes",
    requirements: [
      "Complete 5K (3.1 miles) running distance",
      "Finish time must be under 40:00 minutes",
      "Running only - no walking/cycling"
    ],
    timeLimit: 24,
    difficulty: "Intermediate",
    emoji: "🏃‍♂️",
    verificationTags: ["distance", "duration", "activity_type"],
    exactDistance: 3.1, // 5K in miles
    maxDuration: 40, // minutes
    requiredActivity: "running"
  },

  5: {
    level: 5,
    title: "Speed Challenge II",
    description: "Run a 5K in under 39 minutes",
    requirements: [
      "Complete 5K (3.1 miles) running distance",
      "Finish time must be under 39:00 minutes",
      "Running only - no walking/cycling"
    ],
    timeLimit: 24,
    difficulty: "Intermediate+",
    emoji: "⚡",
    verificationTags: ["distance", "duration", "activity_type"],
    exactDistance: 3.1,
    maxDuration: 39, // minutes
    requiredActivity: "running"
  },

  6: {
    level: 6,
    title: "Upper Body Power",
    description: "Do 150 pushups",
    requirements: [
      "Complete 150 pushups total",
      "Can be done in sets throughout the day",
      "All reps must be completed within 24 hours"
    ],
    timeLimit: 24,
    difficulty: "Advanced",
    emoji: "💥",
    verificationTags: ["pushups", "reps"],
    minPushups: 150
  },

  7: {
    level: 7,
    title: "Core Endurance",
    description: "100 sit-ups in one hour",
    requirements: [
      "Complete 100 sit-ups",
      "Must be completed within 1 hour",
      "Can be done in sets within the hour"
    ],
    timeLimit: 24,
    difficulty: "Advanced",
    emoji: "🔥",
    verificationTags: ["situps", "reps", "duration"],
    minSitups: 100,
    maxDuration: 60 // minutes for the exercise itself
  },

  8: {
    level: 8,
    title: "Long Distance",
    description: "Run a 10K",
    requirements: [
      "Complete 10K (6.2 miles) running distance",
      "Any finishing time acceptable",
      "Running only - no walking/cycling"
    ],
    timeLimit: 24,
    difficulty: "Advanced",
    emoji: "🏃‍♂️",
    verificationTags: ["distance", "activity_type"],
    exactDistance: 6.2, // 10K in miles
    requiredActivity: "running"
  },

  9: {
    level: 9,
    title: "Elite Speed",
    description: "1 mile in under 8 minutes",
    requirements: [
      "Complete 1 mile running distance",
      "Finish time must be under 8:00 minutes",
      "Running only - elite pace required"
    ],
    timeLimit: 24,
    difficulty: "Elite",
    emoji: "🔥",
    verificationTags: ["distance", "duration", "activity_type"],
    exactDistance: 1.0,
    maxDuration: 8, // minutes
    requiredActivity: "running"
  },

  10: {
    level: 10,
    title: "GANTZ ULTIMATE CHALLENGE",
    description: "100 pushups, 100 sit-ups, and 10K run in under 80 minutes",
    requirements: [
      "Complete 100 pushups",
      "Complete 100 sit-ups", 
      "Complete 10K (6.2 miles) run",
      "All exercises must be completed within 80 minutes total",
      "Order of exercises is your choice"
    ],
    timeLimit: 24,
    difficulty: "EXTREME",
    emoji: "🔥💀",
    verificationTags: ["pushups", "situps", "distance", "duration", "activity_type"],
    minPushups: 100,
    minSitups: 100,
    exactDistance: 6.2,
    maxDuration: 80, // minutes for all exercises combined
    requiredActivity: "running"
  }
};

// Helper functions
export const getChallengeLevel = (level) => {
  return CHALLENGE_LEVELS[level] || null;
};

export const getNextLevel = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  return nextLevel <= 10 ? CHALLENGE_LEVELS[nextLevel] : null;
};

export const getAllLevels = () => {
  return Object.values(CHALLENGE_LEVELS);
};

export const validateChallengeCompletion = (level, workoutData) => {
  const challenge = getChallengeLevel(level);
  if (!challenge) return false;

  // This is a basic validation framework
  // In Phase 4, we'll implement detailed 1301 note parsing
  
  const { 
    minDistance, 
    exactDistance, 
    maxDuration, 
    minPushups, 
    minSitups,
    requiredActivity,
    acceptedActivities 
  } = challenge;

  let isValid = true;
  const errors = [];

  // Distance validation
  if (minDistance && (!workoutData.distance || workoutData.distance < minDistance)) {
    isValid = false;
    errors.push(`Distance must be at least ${minDistance} miles`);
  }

  if (exactDistance && (!workoutData.distance || Math.abs(workoutData.distance - exactDistance) > 0.1)) {
    isValid = false;
    errors.push(`Distance must be approximately ${exactDistance} miles`);
  }

  // Duration validation
  if (maxDuration && (!workoutData.duration || workoutData.duration > maxDuration)) {
    isValid = false;
    errors.push(`Must be completed in under ${maxDuration} minutes`);
  }

  // Exercise validation
  if (minPushups && (!workoutData.pushups || workoutData.pushups < minPushups)) {
    isValid = false;
    errors.push(`Must complete at least ${minPushups} pushups`);
  }

  if (minSitups && (!workoutData.situps || workoutData.situps < minSitups)) {
    isValid = false;
    errors.push(`Must complete at least ${minSitups} sit-ups`);
  }

  // Activity type validation
  if (requiredActivity && workoutData.activityType !== requiredActivity) {
    isValid = false;
    errors.push(`Activity must be ${requiredActivity}`);
  }

  if (acceptedActivities && !acceptedActivities.includes(workoutData.activityType)) {
    isValid = false;
    errors.push(`Activity must be one of: ${acceptedActivities.join(', ')}`);
  }

  return {
    isValid,
    errors,
    challenge
  };
};