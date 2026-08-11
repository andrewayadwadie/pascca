// 003-auth-authorization (T010). Two different algorithms for two different threat models
// (research R4) — do not "simplify" this to one function. Passwords are low-entropy and
// attacker-guessable, so hashing them must be deliberately slow (argon2id). Refresh tokens are
// 256 bits of random entropy already, looked up on every refresh/logout call; hashing them with
// argon2id would only add latency with no corresponding security gain, so they get SHA-256.
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  return argon2.verify(hash, plaintext);
}

/** A 32-byte, cryptographically random, base64url-encoded refresh-token value. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 of a refresh-token value, hex-encoded — what's actually stored in `tokenHash`. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
