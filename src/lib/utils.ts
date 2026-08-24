import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Validates that a URL uses a safe protocol (http: or https:) or is a
 * same-origin relative path.  Blocks dangerous schemes like javascript:,
 * data:, vbscript:, etc.
 */
export const isSafeUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    // Allow relative paths starting with / but not protocol-relative //
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
