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
