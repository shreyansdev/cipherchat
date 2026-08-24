/**
 * CipherChat Client-Side Encryption
 * AES-256-GCM using Web Crypto API
 */

const ITERATIONS = 310000;
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Converts Uint8Array to Base64 string safely (avoids stack overflow on large payloads)
 */
function toBase64(u8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]!);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array safely
 */
function fromBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const u8 = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    u8[i] = binaryString.charCodeAt(i);
  }
  return u8;
}

/**
 * Derives an encryption key from a password and room slug
 */
export async function deriveKey(password: string, roomSlug: string): Promise<CryptoKey> {
  const actualPassword = password || roomSlug;
  if (!actualPassword || !roomSlug) {
    throw new Error('Password and room slug are required for key derivation');
  }

  const encoder = new TextEncoder();
  const passwordData = encoder.encode(actualPassword);
  const salt = encoder.encode(roomSlug);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a message using the derived key
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    data
  );

  return {
    ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
    iv: toBase64(iv),
  };
}

/**
 * Decrypts a message using the derived key
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const encryptedData = fromBase64(ciphertext);
    const ivData = fromBase64(iv);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivData,
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    // Log for debugging but throw a generic error to the UI
    console.error('Decryption internal error:', error);
    throw new Error('Decryption failed: Incorrect key or corrupted data');
  }
}
