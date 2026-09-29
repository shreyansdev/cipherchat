import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Validates that a URL uses a safe protocol (http: or https:) or is a
 * safe relative path. Blocks dangerous schemes like javascript:, data:,
 * vbscript:, backslash path normalization bypasses, and control characters.
 */
export const isSafeUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Block ASCII control characters (0-31, 127) and backslashes
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127 || code === 92) {
      return false;
    }
  }

  // Allow safe relative paths starting with a single '/'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates that a media URL strictly points to the application's internal files endpoint
 * (/api/files/file-[id]) to prevent external tracking/IP leak attacks.
 */
export const isSafeInternalMediaUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || !isSafeUrl(trimmed)) return false;

  // Relative path matching /api/files/file-...
  if (/^\/api\/files\/file-[a-zA-Z0-9_-]+$/.test(trimmed.split('?')[0])) {
    return true;
  }

  // Absolute URL: Origin MUST match window.location.origin or VITE_API_URL
  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.split('?')[0];
    if (!/^\/api\/files\/file-[a-zA-Z0-9_-]+$/.test(pathname)) {
      return false;
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
    const allowedOrigins = [currentOrigin, 'http://localhost:3001', 'http://127.0.0.1:3001'];
    if (apiUrl) {
      try {
        allowedOrigins.push(new URL(apiUrl).origin);
      } catch {
        // ignore
      }
    }

    return allowedOrigins.filter(Boolean).includes(parsed.origin);
  } catch {
    return false;
  }
};
