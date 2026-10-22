import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Derives a secure scrypt password hash with a unique random salt.
 * Formatted as: salt:derivedKeyHex
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Securely verifies a plaintext password against a stored salt:hash string.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  try {
    const [salt, keyHex] = combinedHash.split(':');
    if (!salt || !keyHex) return false;

    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random session ID token.
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}
