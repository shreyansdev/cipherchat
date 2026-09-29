// IMPLEMENTS: spec §4
import { describe, it, expect } from 'vitest';
import { deriveKey, encryptMessage, decryptMessage, encryptFileBuffer, decryptFileBuffer } from '../../src/lib/crypto';

describe('Cryptography Module (AES-256-GCM)', () => {
  const password = 'test-password-123';
  const roomSlug = 'cool-chat-room';
  const plaintext = 'Hello, this is a secret message!';

  describe('Key Derivation Determinism', () => {
    it('should produce the same key for the same password and roomSlug', async () => {
      const key1 = await deriveKey(password, roomSlug);
      const { ciphertext, iv } = await encryptMessage(plaintext, key1);
      
      const key2 = await deriveKey(password, roomSlug);
      const decrypted = await decryptMessage(ciphertext, iv, key2);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should fall back to roomSlug as password if password is empty or undefined', async () => {
      const key1 = await deriveKey('', roomSlug);
      expect(key1).toBeDefined();

      const key2 = await deriveKey(undefined as any, roomSlug);
      expect(key2).toBeDefined();
    });

    it('should throw if roomSlug is empty or null/undefined', async () => {
      await expect(deriveKey('password', '')).rejects.toThrow('Password and room slug are required for key derivation');
      await expect(deriveKey('password', null as any)).rejects.toThrow('Password and room slug are required for key derivation');
      await expect(deriveKey('password', '   ')).rejects.toThrow('Password and room slug are required for key derivation');
    });

    it('should throw if both password and roomSlug are empty', async () => {
      await expect(deriveKey('', '')).rejects.toThrow('Password and room slug are required for key derivation');
      await expect(deriveKey(null as any, null as any)).rejects.toThrow('Password and room slug are required for key derivation');
    });

    it('should fail to decrypt if the password is different', async () => {
      const key1 = await deriveKey(password, roomSlug);
      const { ciphertext, iv } = await encryptMessage(plaintext, key1);
      
      const key2 = await deriveKey('wrong-password', roomSlug);
      await expect(decryptMessage(ciphertext, iv, key2)).rejects.toThrow();
    });

    it('should derive identical keys for composed vs decomposed Unicode equivalents (NFKC normalization)', async () => {
      // Decomposed 'e' + combining acute accent vs precomposed 'é'
      const decomposedPassword = 'cafe\u0301-secret';
      const precomposedPassword = 'caf\u00E9-secret';
      
      const key1 = await deriveKey(decomposedPassword, roomSlug);
      const { ciphertext, iv } = await encryptMessage(plaintext, key1);

      const key2 = await deriveKey(precomposedPassword, roomSlug);
      const decrypted = await decryptMessage(ciphertext, iv, key2);

      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt if the roomSlug is different', async () => {
      const key1 = await deriveKey(password, roomSlug);
      const { ciphertext, iv } = await encryptMessage(plaintext, key1);
      
      const key2 = await deriveKey(password, 'different-room');
      await expect(decryptMessage(ciphertext, iv, key2)).rejects.toThrow();
    });
  });

  describe('IV Uniqueness', () => {
    it('should generate a unique IV for every encryption call', async () => {
      const key = await deriveKey(password, roomSlug);
      const ivs = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const { iv } = await encryptMessage(plaintext, key);
        expect(ivs.has(iv)).toBe(false);
        ivs.add(iv);
      }

      expect(ivs.size).toBe(iterations);
    });
  });

  describe('Round-trip Integrity', () => {
    it('should correctly encrypt and decrypt various inputs', async () => {
      const key = await deriveKey(password, roomSlug);
      const testCases = [
        '',
        'a',
        'A'.repeat(1000),
        '🔒 End-to-End Encrypted! 🚀',
        '你好, 世界',
        '<script>alert("XSS")</script> & <div>HTML</div>',
      ];

      for (const input of testCases) {
        const { ciphertext, iv } = await encryptMessage(input, key);
        const decrypted = await decryptMessage(ciphertext, iv, key);
        expect(decrypted).toBe(input);
      }
    });
  });

  describe('Decryption Failure Handling', () => {
    it('should throw an error if the ciphertext is tampered with', async () => {
      const key = await deriveKey(password, roomSlug);
      const { ciphertext, iv } = await encryptMessage(plaintext, key);
      
      // Tamper with ciphertext (flip one byte in the base64 string)
      const tamperedCiphertext = ciphertext.substring(0, 5) + 
        (ciphertext[5] === 'A' ? 'B' : 'A') + 
        ciphertext.substring(6);
      
      await expect(decryptMessage(tamperedCiphertext, iv, key)).rejects.toThrow();
    });

    it('should throw an error if the IV is tampered with', async () => {
      const key = await deriveKey(password, roomSlug);
      const { ciphertext, iv } = await encryptMessage(plaintext, key);
      
      // Tamper with IV
      const tamperedIv = iv.substring(0, 5) + 
        (iv[5] === 'A' ? 'B' : 'A') + 
        iv.substring(6);
      
      await expect(decryptMessage(ciphertext, tamperedIv, key)).rejects.toThrow();
    });
  });

  describe('Output Format', () => {
    it('should return exactly ciphertext and iv as base64 strings', async () => {
      const key = await deriveKey(password, roomSlug);
      const payload = await encryptMessage(plaintext, key);
      
      expect(Object.keys(payload)).toHaveLength(2);
      expect(payload).toHaveProperty('ciphertext');
      expect(payload).toHaveProperty('iv');
      
      // Basic Base64 regex check
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(payload.ciphertext).toMatch(base64Regex);
      expect(payload.iv).toMatch(base64Regex);
    });
  });

  describe('File Encryption and Decryption (E2EE Client-Side)', () => {
    it('should encrypt and decrypt file buffer cleanly', async () => {
      const key = await deriveKey(password, roomSlug);
      const originalText = 'Hello secret document content!';
      const encoder = new TextEncoder();
      const fileData = encoder.encode(originalText).buffer;

      const encrypted = await encryptFileBuffer(fileData, key);
      expect(encrypted.length).toBeGreaterThan(fileData.byteLength);

      const decrypted = await decryptFileBuffer(encrypted, key);
      const decoder = new TextDecoder();
      expect(decoder.decode(decrypted)).toBe(originalText);
    });

    it('should fail decryption if tampered or wrong key', async () => {
      const key1 = await deriveKey(password, roomSlug);
      const key2 = await deriveKey('different-password', roomSlug);
      const originalText = 'Secret data';
      const fileData = new TextEncoder().encode(originalText).buffer;

      const encrypted = await encryptFileBuffer(fileData, key1);

      // Wrong key
      await expect(decryptFileBuffer(encrypted, key2)).rejects.toThrow();

      // Tampered data
      const tampered = new Uint8Array(encrypted);
      tampered[15] ^= 0xff;
      await expect(decryptFileBuffer(tampered, key1)).rejects.toThrow();
    });
  });
});
