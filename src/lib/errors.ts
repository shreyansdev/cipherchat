/**
 * CipherChat Error Constants
 */

export const ERROR_MESSAGES = {
  WRONG_PASSWORD: 'Incorrect room password',
  ROOM_NOT_FOUND: 'This room has expired or does not exist',
  ROOM_FULL: 'This room is full (max 50 users)',
  NETWORK_ERROR: 'Could not connect. Please check your connection.',
  RECONNECTING: 'Connection lost. Reconnecting...',
  RATE_LIMITED: (seconds: number) => `Too many attempts. Please wait ${seconds} seconds.`,
  ROOM_EXPIRED: 'This room has expired or does not exist',
} as const;

export const ERROR_CODES = {
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  ROOM_EXPIRED: 'ROOM_EXPIRED',
} as const;
