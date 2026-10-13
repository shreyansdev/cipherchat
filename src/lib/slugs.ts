/**
 * Room Slug and Anonymous Alias Generation Module
 * Provides deterministic and randomized slug generation and validation.
 */

export const ROOM_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const ADJECTIVES = [
  'cyber', 'neon', 'quantum', 'stealth', 'shadow', 'hyper',
  'crypto', 'dark', 'void', 'sonic', 'phantom', 'zero',
  'iron', 'silent', 'vector', 'binary', 'neural', 'pulse'
] as const;

export const NOUNS = [
  'pulse', 'matrix', 'vault', 'cipher', 'nexus', 'shield',
  'specter', 'core', 'signal', 'node', 'relay', 'bastion',
  'terminal', 'protocol', 'beacon', 'gateway', 'vertex', 'stratum'
] as const;

export const RANDOM_ALIASES = [
  'Ghost_Protocol', 'Cipher_007', 'Neon_Specter', 'Quantum_Rebel',
  'Void_Runner', 'Shadow_Agent', 'Cipherpunk_42', 'Zero_Trace',
  'Entropy_Node', 'Kernel_Specter', 'Stealth_Echo'
] as const;

/**
 * Validates a room identifier against allowed slug characters.
 */
export function isValidRoomSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return ROOM_NAME_REGEX.test(slug.trim());
}

/**
 * Generates a human-readable, three-segment slug: [adj]-[noun]-[4-digit-num]
 */
export function generateRandomSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

/**
 * Picks a random anonymous cyberpunk alias for session identity.
 */
export function generateRandomAlias(): string {
  return RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
}
