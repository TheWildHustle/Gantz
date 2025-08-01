const CACHE_PREFIX = 'gantz_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const storage = {
  // Set data with expiry
  set(key, data, customExpiry = CACHE_EXPIRY) {
    const item = {
      data,
      expiry: Date.now() + customExpiry,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  },

  // Get data if not expired
  get(key) {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return parsed.data;
    } catch {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
  },

  // Remove specific item
  remove(key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  },

  // Clear all Gantz cache
  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  },

  // Cache profiles for longer (30 minutes)
  cacheProfile(pubkey, profile) {
    this.set(`profile_${pubkey}`, profile, 30 * 60 * 1000);
  },

  getProfile(pubkey) {
    return this.get(`profile_${pubkey}`);
  },

  // Cache workout feed for shorter time (2 minutes)
  cacheFeed(workouts) {
    this.set('workout_feed', workouts, 2 * 60 * 1000);
  },

  getFeed() {
    return this.get('workout_feed');
  },

  // Cache user workouts
  cacheUserWorkouts(pubkey, workouts) {
    this.set(`user_workouts_${pubkey}`, workouts, 5 * 60 * 1000);
  },

  getUserWorkouts(pubkey) {
    return this.get(`user_workouts_${pubkey}`);
  },
};