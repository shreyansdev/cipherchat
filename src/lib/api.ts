import { RoomCreateResponse, RoomVerifyResponse } from '../types';
import { ERROR_CODES } from './errors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  json?: unknown;
}

/**
 * Deep internal HTTP request handler that encapsulates status code translation,
 * JSON serialization, and error normalization behind a single seam.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers: customHeaders, ...fetchOptions } = options;
  const headers = new Headers(customHeaders);

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    fetchOptions.body = JSON.stringify(json);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Network request failed');
  }

  if (response.status === 429) {
    throw new Error(ERROR_CODES.RATE_LIMITED);
  }

  if (response.status === 404) {
    throw new Error(ERROR_CODES.ROOM_NOT_FOUND);
  }

  if (response.status === 401) {
    throw new Error(ERROR_CODES.WRONG_PASSWORD);
  }

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errData = await response.json();
      if (errData?.error) errorMessage = errData.error;
    } catch {
      // Non-JSON error payload, retain fallback
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Create a new room with optional password protection and TTL
 */
export async function createRoom(
  roomName: string,
  password?: string,
  ttl?: number
): Promise<RoomCreateResponse> {
  return request<RoomCreateResponse>('/api/rooms/create', {
    method: 'POST',
    json: { roomName, password, ttl },
  });
}

/**
 * Check if a room is password protected
 */
export async function checkRoomProtection(roomName: string): Promise<boolean> {
  const data = await request<{ isProtected: boolean }>(
    `/api/rooms/${encodeURIComponent(roomName)}/protected`
  );
  return Boolean(data.isProtected);
}

/**
 * Verify room password against bcrypt hash on the server
 */
export async function verifyRoomPassword(
  roomName: string,
  password: string
): Promise<RoomVerifyResponse> {
  return request<RoomVerifyResponse>('/api/rooms/verify', {
    method: 'POST',
    json: { roomName, password },
  });
}
