/**
 * CipherChat Client-Side Encryption
 * AES-256-GCM using Web Crypto API
 */

const ITERATIONS = 310000;
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Converts Uint8Array to Base64 string safely and efficiently
 */
function toBase64(u8: Uint8Array): string {
  const CHUNK_SIZE = 8192;
  let binary = '';
  for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
    const chunk = u8.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
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
  const cryptoObj = globalThis.crypto;
  const normalizedPassword = (password || '').normalize('NFKC');
  const normalizedSlug = (roomSlug || '').trim().toLowerCase().normalize('NFKC');
  const actualPassword = normalizedPassword || normalizedSlug;

  if (!actualPassword || !normalizedSlug) {
    throw new Error('Password and room slug are required for key derivation');
  }

  const encoder = new TextEncoder();
  const passwordData = encoder.encode(actualPassword);
  const salt = encoder.encode(normalizedSlug);

  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
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
  const cryptoObj = globalThis.crypto;
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext || '');
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await cryptoObj.subtle.encrypt(
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

    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivData,
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed: Incorrect key or corrupted data');
  }
}
