import { RoomCreateResponse, RoomVerifyResponse } from '../types';
import { ERROR_CODES } from './errors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Create a new room
 */
export const createRoom = async (roomName: string, password?: string, ttl?: number): Promise<RoomCreateResponse> => {
  const response = await fetch(`${API_URL}/api/rooms/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName, password, ttl }),
  });

  if (response.status === 429) {
    throw new Error(ERROR_CODES.RATE_LIMITED);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create room');
  }

  return response.json();
};

/**
 * Check if room is password protected
 */
export const checkRoomProtection = async (roomName: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/rooms/${roomName}/protected`);

  if (response.status === 404) {
    throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
  }

  if (response.status === 429) {
    throw new Error(ERROR_CODES.RATE_LIMITED);
  }

  if (!response.ok) {
    throw new Error('Failed to check room protection');
  }

  const data = await response.json();
  return data.isProtected;
};

/**
 * Verify room password
 */
export const verifyRoomPassword = async (roomName: string, password: string): Promise<RoomVerifyResponse> => {
  const response = await fetch(`${API_URL}/api/rooms/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName, password }),
  });

  if (response.status === 401) {
    throw new Error(ERROR_CODES.WRONG_PASSWORD);
  }

  if (response.status === 404) {
    throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
  }

  if (response.status === 429) {
    throw new Error(ERROR_CODES.RATE_LIMITED);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify password');
  }

  return response.json();
};
