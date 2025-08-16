/**
 * @file Idempotency key helper.
 */

import { createHash } from 'crypto';

/**
 * Creates an idempotency key from a given set of inputs.
 * @param {...(string | number)} args - The inputs to create the key from.
 * @returns {string} The generated idempotency key.
 */
export function createIdempotencyKey(...args: (string | number)[]): string {
  const hash = createHash('sha256');
  for (const arg of args) {
    hash.update(String(arg));
  }
  return hash.digest('hex');
}
