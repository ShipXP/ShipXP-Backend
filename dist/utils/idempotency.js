"use strict";
/**
 * @file Idempotency key helper.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdempotencyKey = createIdempotencyKey;
const crypto_1 = require("crypto");
/**
 * Creates an idempotency key from a given set of inputs.
 * @param {...(string | number)} args - The inputs to create the key from.
 * @returns {string} The generated idempotency key.
 */
function createIdempotencyKey(...args) {
    const hash = (0, crypto_1.createHash)('sha256');
    for (const arg of args) {
        hash.update(String(arg));
    }
    return hash.digest('hex');
}
