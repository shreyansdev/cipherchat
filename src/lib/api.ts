import { RoomCreateResponse, RoomVerifyResponse } from '../types';
import { ERROR_CODES } from './errors';

/**
 * Resolves the backend base URL dynamically.
 * Priority:
 * 1. Explicit VITE_API_URL or VITE_SERVER_URL environment variable
 * 2. When running in a deployed browser session (non-localhost), use relative paths (same origin)
 * 3. Default to local dev server (http://localhost:3001)
 */
export function getApiUrl(): string {
  // If running in a deployed browser session (non-localhost hostname):
  // Never connect to localhost:3001 unless explicitly overridden by a non-localhost URL.
  if (typeof window !== 'undefined' && window.location) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      const configured =
        (typeof import.meta !== 'undefined' &&
          (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_SERVER_URL)) ||
        '';
      if (
        configured &&
        !configured.includes('localhost') &&
        !configured.includes('127.0.0.1')
      ) {
        return configured.replace(/\/+$/, '');
      }
      return '';
    }
  }

  const envUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_SERVER_URL)) ||
    '';
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'http://localhost:3001';
}

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

  const baseUrl = getApiUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
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
