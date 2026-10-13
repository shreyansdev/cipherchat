import { describe, it, expect } from 'vitest';
import {
  generateRandomSlug,
  generateRandomAlias,
  isValidRoomSlug,
  ROOM_NAME_REGEX,
} from '../../src/lib/slugs';

describe('Frontend Slug & Alias Module Tests', () => {
  it('generates valid room slugs matching the required format', () => {
    for (let i = 0; i < 20; i++) {
      const slug = generateRandomSlug();
      expect(slug).toMatch(/^[a-z]+-[a-z]+-\d{4}$/);
      expect(isValidRoomSlug(slug)).toBe(true);
    }
  });

  it('validates slugs with valid alphanumeric, underscores and hyphens', () => {
    expect(isValidRoomSlug('secure-room-1234')).toBe(true);
    expect(isValidRoomSlug('alpha_beta_gamma')).toBe(true);
    expect(isValidRoomSlug('ROOM-42')).toBe(true);
  });

  it('rejects invalid room slugs containing special characters or spaces', () => {
    expect(isValidRoomSlug('room with spaces')).toBe(false);
    expect(isValidRoomSlug('room$money')).toBe(false);
    expect(isValidRoomSlug('<script>alert(1)</script>')).toBe(false);
    expect(isValidRoomSlug('')).toBe(false);
  });

  it('generates non-empty random aliases from wordlist', () => {
    for (let i = 0; i < 10; i++) {
      const alias = generateRandomAlias();
      expect(alias.length).toBeGreaterThan(0);
      expect(typeof alias).toBe('string');
    }
  });
});
