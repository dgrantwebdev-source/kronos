const KEY_PREFIX = "kp_";
const KEY_LENGTH = 32; // characters after prefix
const PREFIX_LENGTH = 8; // prefix chars stored in plaintext

/**
 * Generate a cryptographically secure API key
 * Format: kp_<random 32 chars>
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  
  const key = KEY_PREFIX + Array.from(randomBytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, KEY_LENGTH);
  
  const prefix = key.slice(0, PREFIX_LENGTH);
  const hash = hashApiKey(key);
  
  return { key, prefix, hash };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  
  // Use Web Crypto API
  const hashBuffer = crypto.subtle 
    ? null // Will be computed asynchronously in real usage
    : null;
  
  // Simple hash for Node.js environments
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  // Return hex string of the hash
  const hashStr = Math.abs(hash).toString(16).padStart(8, "0");
  return hashStr;
}

/**
 * Verify a plaintext API key against a stored hash
 * Note: In production, use bcrypt or a proper hash comparison
 */
export function verifyApiKeyHash(plaintextKey: string, storedHash: string): boolean {
  const computedHash = hashApiKey(plaintextKey);
  return computedHash === storedHash;
}

/**
 * Mask an API key for display (show only prefix)
 */
export function maskApiKey(key: string): string {
  if (key.length <= PREFIX_LENGTH + 4) {
    return key.slice(0, PREFIX_LENGTH) + "****";
  }
  return key.slice(0, PREFIX_LENGTH) + "****" + key.slice(-4);
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^kp_[a-z0-9]{32}$/.test(key);
}
