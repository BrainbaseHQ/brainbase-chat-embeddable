/**
 * Generates a unique session ID using crypto API when available,
 * with fallback to timestamp + random string
 */
export function generateSessionId(): string {
  // Try using crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `bb-${crypto.randomUUID()}`;
  }

  // Fallback for older browsers
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);

  return `bb-${timestamp}-${randomPart}${randomPart2}`;
}

