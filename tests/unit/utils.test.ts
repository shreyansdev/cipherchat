import { describe, it, expect } from 'vitest';
import { isSafeUrl, cn } from '../../src/lib/utils';

describe('utils', () => {
  describe('cn (class names)', () => {
    it('merges tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('handles conditional classes', () => {
      const result = cn('text-sm', true && 'font-bold', false && 'text-red-500');
      expect(result).toBe('text-sm font-bold');
    });
  });

  describe('isSafeUrl', () => {
    it('accepts safe relative URLs', () => {
      expect(isSafeUrl('/api/files/file-123')).toBe(true);
      expect(isSafeUrl('/chat/my-room-1234')).toBe(true);
      expect(isSafeUrl('/images/logo.png')).toBe(true);
    });

    it('accepts valid http and https URLs', () => {
      expect(isSafeUrl('https://example.com/file.jpg')).toBe(true);
      expect(isSafeUrl('http://localhost:3001/api/files/file-123')).toBe(true);
    });

    it('rejects dangerous URI schemes (XSS vectors)', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('blob:https://example.com/uuid')).toBe(false);
      expect(isSafeUrl('file:///C:/Windows/System32')).toBe(false);
    });

    it('rejects protocol-relative URLs', () => {
      expect(isSafeUrl('//evil.com/malicious.js')).toBe(false);
      expect(isSafeUrl('///evil.com')).toBe(false);
    });

    it('rejects backslash evasion and control character bypasses', () => {
      expect(isSafeUrl('/\\evil.com')).toBe(false);
      expect(isSafeUrl('/\\/evil.com')).toBe(false);
      expect(isSafeUrl('/example.com\\malicious')).toBe(false);
      expect(isSafeUrl('javascript:\x00alert(1)')).toBe(false);
      expect(isSafeUrl('\x00/api/files')).toBe(false);
    });

    it('rejects null, undefined, empty, and non-string inputs', () => {
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl('   ')).toBe(false);
      expect(isSafeUrl(null as any)).toBe(false);
      expect(isSafeUrl(12345 as any)).toBe(false);
      expect(isSafeUrl({} as any)).toBe(false);
    });
  });
});
