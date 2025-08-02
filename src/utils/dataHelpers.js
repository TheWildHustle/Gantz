/**
 * Data validation and formatting utilities for Nostr events
 */

/**
 * Safely get a tag value from a Nostr event
 * @param {Array} tags - Event tags array
 * @param {string} tagName - Tag name to search for
 * @param {*} defaultValue - Default value if tag not found
 * @returns {*} Tag value or default value
 */
export const getTagValue = (tags, tagName, defaultValue = null) => {
  if (!Array.isArray(tags)) return defaultValue;
  
  const tag = tags.find(t => Array.isArray(t) && t[0] === tagName);
  return tag && tag.length > 1 ? tag[1] : defaultValue;
};

/**
 * Get tag value with unit for NIP-101e 3-element tags
 * @param {Array} tags - Event tags array
 * @param {string} tagName - Tag name to search for
 * @returns {Object|null} {value, unit} or null if not found
 */
export const getTagValueWithUnit = (tags, tagName) => {
  if (!Array.isArray(tags)) return null;
  
  const tag = tags.find(t => Array.isArray(t) && t[0] === tagName);
  if (!tag || tag.length < 2) return null;
  
  return {
    value: tag[1],
    unit: tag.length > 2 ? tag[2] : null
  };
};

/**
 * Parse duration from various formats and convert to seconds
 * @param {string|number} durationValue - Duration in seconds, HH:MM:SS, or MM:SS format
 * @returns {number|null} Duration in seconds or null if invalid
 */
export const parseDurationToSeconds = (durationValue) => {
  if (!durationValue && durationValue !== 0) return null;
  
  // If it's already a number, assume it's seconds
  if (typeof durationValue === 'number') {
    return durationValue >= 0 ? durationValue : null;
  }
  
  const durationStr = String(durationValue).trim();
  
  // Check if it's in HH:MM:SS or MM:SS format
  if (durationStr.includes(':')) {
    const parts = durationStr.split(':');
    
    // HH:MM:SS format
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
      if (hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return null;
      
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // MM:SS format
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      
      if (isNaN(minutes) || isNaN(seconds)) return null;
      if (minutes < 0 || seconds < 0 || seconds >= 60) return null;
      
      return minutes * 60 + seconds;
    }
  }
  
  // Try to parse as pure seconds
  const seconds = parseInt(durationStr, 10);
  if (isNaN(seconds) || seconds < 0) return null;
  
  return seconds;
};

/**
 * Format duration from various inputs to MM:SS or HH:MM:SS format
 * @param {string|number} durationValue - Duration in seconds, HH:MM:SS, or MM:SS format
 * @returns {string|null} Formatted duration or null if invalid
 */
export const formatDuration = (durationValue) => {
  const totalSeconds = parseDurationToSeconds(durationValue);
  if (totalSeconds === null) return null;
  
  // Handle different time ranges
  if (totalSeconds < 60) {
    return `0:${totalSeconds.toString().padStart(2, '0')}`;
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // For durations less than an hour, show MM:SS
  if (hours === 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // For longer durations, show HH:MM:SS
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Convert distance between units
 * @param {number} value - Distance value
 * @param {string} fromUnit - Source unit (km, mi, m, ft)
 * @param {string} toUnit - Target unit (km, mi, m, ft)
 * @returns {number} Converted value
 */
export const convertDistance = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  // Convert to meters first
  let meters;
  switch (fromUnit?.toLowerCase()) {
    case 'km':
      meters = value * 1000;
      break;
    case 'mi':
    case 'miles':
      meters = value * 1609.344;
      break;
    case 'm':
    case 'meters':
      meters = value;
      break;
    case 'ft':
    case 'feet':
      meters = value * 0.3048;
      break;
    default:
      return value; // Unknown unit, return as-is
  }
  
  // Convert from meters to target unit
  switch (toUnit?.toLowerCase()) {
    case 'km':
      return meters / 1000;
    case 'mi':
    case 'miles':
      return meters / 1609.344;
    case 'm':
    case 'meters':
      return meters;
    case 'ft':
    case 'feet':
      return meters / 0.3048;
    default:
      return meters; // Unknown target unit, return meters
  }
};

/**
 * Format distance value with proper units
 * @param {string|number} distanceValue - Distance value
 * @param {string} unit - Unit (km, mi, m)
 * @returns {string|null} Formatted distance or null if invalid
 */
export const formatDistance = (distanceValue, unit = 'km') => {
  if (!distanceValue && distanceValue !== 0) return null;
  
  const distance = parseFloat(distanceValue);
  if (isNaN(distance) || distance < 0) return null;
  
  // Determine decimal places based on unit and value
  let decimals = 1;
  if (unit === 'm' || unit === 'meters') {
    decimals = 0; // Whole meters
  } else if (distance > 100) {
    decimals = 0; // Large distances don't need decimals
  }
  
  return `${distance.toFixed(decimals)} ${unit}`;
};

/**
 * Format date for display
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown date';
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Get activity type emoji
 * @param {string} activityType - Activity type
 * @returns {string} Emoji representing the activity
 */
export const getActivityTypeEmoji = (activityType) => {
  if (!activityType) return '🏃';
  
  switch (activityType.toLowerCase()) {
    case 'running':
    case 'run':
      return '🏃';
    case 'cycling':
    case 'bike':
    case 'biking':
      return '🚴';
    case 'walking':
    case 'walk':
      return '🚶';
    case 'swimming':
    case 'swim':
      return '🏊';
    case 'hiking':
    case 'hike':
      return '🥾';
    case 'weightlifting':
    case 'strength':
    case 'weights':
      return '🏋️';
    case 'yoga':
      return '🧘';
    case 'soccer':
    case 'football':
      return '⚽';
    case 'basketball':
      return '🏀';
    case 'tennis':
      return '🎾';
    case 'rowing':
      return '🚣';
    case 'climbing':
      return '🧗';
    default:
      return '🏃'; // Default to running instead of flexing
  }
};

/**
 * Format heart rate with units
 * @param {string|number} heartRate - Heart rate value
 * @param {string} unit - Unit (bpm, etc.)
 * @returns {string|null} Formatted heart rate or null
 */
export const formatHeartRate = (heartRate, unit = 'bpm') => {
  if (!heartRate && heartRate !== 0) return null;
  
  const hr = parseInt(heartRate, 10);
  if (isNaN(hr) || hr <= 0 || hr > 250) return null; // Reasonable HR range
  
  return `${hr} ${unit}`;
};

/**
 * Format elevation with units
 * @param {string|number} elevation - Elevation value
 * @param {string} unit - Unit (m, ft)
 * @returns {string|null} Formatted elevation or null
 */
export const formatElevation = (elevation, unit = 'm') => {
  if (!elevation && elevation !== 0) return null;
  
  const elev = parseFloat(elevation);
  if (isNaN(elev)) return null;
  
  return `${Math.round(elev)} ${unit}`;
};

/**
 * Format pace with proper units
 * @param {string} pace - Pace value (could be "4:52" or "4:52 min/km")
 * @param {string} distanceUnit - Distance unit to determine pace unit
 * @returns {string|null} Formatted pace or null
 */
export const formatPace = (pace, distanceUnit = 'km') => {
  if (!pace) return null;
  
  // If pace already includes unit, return as-is
  if (pace.includes('min/') || pace.includes('/')) {
    return pace;
  }
  
  // Add appropriate unit based on distance unit
  const paceUnit = distanceUnit === 'mi' ? 'min/mi' : 'min/km';
  return `${pace} ${paceUnit}`;
};

/**
 * Build metrics text from workout data using NIP-101e format
 * @param {Array} tags - Event tags array
 * @returns {string} Formatted metrics string
 */
export const buildMetricsText = (tags) => {
  if (!Array.isArray(tags)) return '';
  
  const metrics = [];
  
  // Distance with unit extraction
  const distanceData = getTagValueWithUnit(tags, 'distance');
  if (distanceData?.value) {
    const formattedDistance = formatDistance(distanceData.value, distanceData.unit || 'km');
    if (formattedDistance) {
      metrics.push(`Distance: ${formattedDistance}`);
    }
  }
  
  // Duration
  const duration = getTagValue(tags, 'duration');
  if (duration) {
    const formattedDuration = formatDuration(duration);
    if (formattedDuration) {
      metrics.push(`Duration: ${formattedDuration}`);
    }
  }
  
  // Pace with proper units
  const pace = getTagValue(tags, 'pace');
  if (pace) {
    const formattedPace = formatPace(pace, distanceData?.unit);
    if (formattedPace) {
      metrics.push(`Pace: ${formattedPace}`);
    }
  }
  
  // Heart rate
  const heartRateData = getTagValueWithUnit(tags, 'heart_rate_avg') || getTagValueWithUnit(tags, 'heart_rate');
  if (heartRateData?.value) {
    const formattedHR = formatHeartRate(heartRateData.value, heartRateData.unit || 'bpm');
    if (formattedHR) {
      metrics.push(`Heart Rate: ${formattedHR}`);
    }
  }
  
  // Elevation gain
  const elevationData = getTagValueWithUnit(tags, 'elevation_gain') || getTagValueWithUnit(tags, 'elevation');
  if (elevationData?.value) {
    const formattedElev = formatElevation(elevationData.value, elevationData.unit || 'm');
    if (formattedElev) {
      metrics.push(`Elevation: ${formattedElev}`);
    }
  }
  
  // Calories
  const calories = getTagValue(tags, 'calories');
  if (calories) {
    const cal = parseInt(calories, 10);
    if (!isNaN(cal) && cal > 0) {
      metrics.push(`Calories: ${cal}`);
    }
  }
  
  return metrics.join(' • ');
};

/**
 * Safely parse JSON content from Nostr event
 * @param {string} content - JSON string content
 * @returns {Object|null} Parsed object or null if invalid
 */
export const safeParseJSON = (content) => {
  if (!content || typeof content !== 'string') return null;
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to parse JSON content:', content, error);
    return null;
  }
};

/**
 * Validate and format profile picture URL
 * @param {string} url - Profile picture URL
 * @returns {string|null} Validated URL or null
 */
export const validateProfilePicture = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Convert http to https for security
  if (url.startsWith('http:')) {
    url = url.replace('http:', 'https:');
  }
  
  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
};

/**
 * Format hex pubkey to npub (bech32)
 * @param {string} hexPubkey - Hex encoded public key
 * @returns {string} npub string
 */
export const formatNpub = (hexPubkey) => {
  if (!hexPubkey) return '';
  
  try {
    // Simple display format for hex pubkey
    // For full npub encoding, you'd need a bech32 library
    if (hexPubkey.length === 64) {
      return `npub...${hexPubkey.slice(-8)}`;
    } else {
      // Handle shorter or malformed pubkeys
      return `${hexPubkey.slice(0, 8)}...${hexPubkey.slice(-4)}`;
    }
  } catch {
    return hexPubkey?.slice(0, 12) + '...' || 'unknown';
  }
};

/**
 * Extract activity type from exercise tag or content
 * @param {Array} tags - Event tags
 * @param {string} content - Event content
 * @returns {string} Detected activity type
 */
export const extractActivityType = (tags, content = '') => {
  // Try direct activity_type tag first
  let activityType = getTagValue(tags, 'activity_type');
  
  if (!activityType) {
    // Try to extract from exercise tag (format: "33401:pubkey:uuid-running")
    const exerciseTag = getTagValue(tags, 'exercise');
    if (exerciseTag && typeof exerciseTag === 'string') {
      const parts = exerciseTag.split(':');
      if (parts.length >= 3) {
        const exerciseId = parts[2].toLowerCase();
        if (exerciseId.includes('running') || exerciseId.includes('run')) activityType = 'running';
        else if (exerciseId.includes('cycling') || exerciseId.includes('bike')) activityType = 'cycling';
        else if (exerciseId.includes('walking') || exerciseId.includes('walk')) activityType = 'walking';
        else if (exerciseId.includes('swimming') || exerciseId.includes('swim')) activityType = 'swimming';
        else if (exerciseId.includes('hiking') || exerciseId.includes('hike')) activityType = 'hiking';
      }
    }
  }
  
  if (!activityType && content) {
    // Fallback: detect from content
    const text = content.toLowerCase();
    if (text.includes('run')) activityType = 'running';
    else if (text.includes('bike') || text.includes('cycl')) activityType = 'cycling';
    else if (text.includes('walk')) activityType = 'walking';
    else if (text.includes('swim')) activityType = 'swimming';
    else if (text.includes('hik')) activityType = 'hiking';
    else if (text.includes('lift') || text.includes('weight')) activityType = 'strength';
  }
  
  return activityType || 'workout';
};

/**
 * Calculate workout duration from start/end timestamps
 * @param {Array} tags - Event tags
 * @returns {number|null} Duration in seconds or null
 */
export const calculateWorkoutDuration = (tags) => {
  const startTime = getTagValue(tags, 'start');
  const endTime = getTagValue(tags, 'end');
  
  if (startTime && endTime) {
    const start = parseInt(startTime, 10);
    const end = parseInt(endTime, 10);
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return end - start;
    }
  }
  
  return null;
};

/**
 * Format workout title from tags and content
 * @param {Array} tags - Event tags
 * @param {string} content - Event content
 * @returns {string} Formatted title
 */
export const formatWorkoutTitle = (tags, content = '') => {
  // Try title tag first
  let title = getTagValue(tags, 'title');
  
  if (!title && content) {
    // Use content, truncated if too long
    title = content.length > 50 ? content.substring(0, 47) + '...' : content;
  }
  
  return title || 'Workout Activity';
};

/**
 * Copy text to clipboard with feedback
 * @param {string} text - Text to copy
 * @param {string} label - Label for logging
 */
export const copyToClipboard = async (text, label = 'text') => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      console.log(`📋 Copied ${label} to clipboard:`, text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      if (result) {
        console.log(`📋 Copied ${label} to clipboard (fallback):`, text);
      }
      return result;
    }
  } catch (error) {
    console.error(`❌ Failed to copy ${label} to clipboard:`, error);
    return false;
  }
};

/**
 * Format Lightning address
 * @param {string} lud16 - Lightning address
 * @returns {string} Formatted lightning address
 */
export const formatLightningAddress = (lud16) => {
  if (!lud16) return null;
  
  // Ensure it looks like an email format
  if (lud16.includes('@')) {
    return lud16;
  }
  
  return null;
};

/**
 * Validate NIP-05 identifier
 * @param {string} nip05 - NIP-05 identifier
 * @returns {boolean} Whether the NIP-05 is valid format
 */
export const isValidNip05 = (nip05) => {
  if (!nip05 || typeof nip05 !== 'string') return false;
  
  // Basic validation - should contain @ and a domain
  const parts = nip05.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
};