import { useState, useCallback } from 'react';
import { deriveKey, encryptMessage, decryptMessage } from '../lib/crypto';

export function useE2EE(): {
  key: CryptoKey | null;
  setupKey: (password: string, roomSlug: string) => Promise<void>;
  encrypt: (plaintext: string) => Promise<{ ciphertext: string; iv: string }>;
  decrypt: (ciphertext: string, iv: string) => Promise<string>;
  clearKey: () => void;
} {
  const [key, setKey] = useState<CryptoKey | null>(null);

  const setupKey = useCallback(async (password: string, roomSlug: string) => {
    const derivedKey = await deriveKey(password, roomSlug);
    setKey(derivedKey);
  }, []);

  const encrypt = useCallback(
    async (plaintext: string) => {
      if (!key) throw new Error('Encryption key not initialized');
      return encryptMessage(plaintext, key);
    },
    [key]
  );

  const decrypt = useCallback(
    async (ciphertext: string, iv: string) => {
      if (!key) throw new Error('Encryption key not initialized');
      return decryptMessage(ciphertext, iv, key);
    },
    [key]
  );

  const clearKey = useCallback(() => {
    setKey(null);
  }, []);

  return { key, setupKey, encrypt, decrypt, clearKey };
}
