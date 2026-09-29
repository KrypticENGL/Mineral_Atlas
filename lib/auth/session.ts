import { getStoredPasswordHash } from "./password-store";

/**
 * Single-password gate. The session cookie holds an HMAC of a fixed label keyed
 * by the current credential (the stored password hash, else ATLAS_PASSWORD), so
 * it can't be forged without it and changing the password signs everyone else
 * out. Web Crypto only: runs in proxy and routes.
 */
export const SESSION_COOKIE = "atlas_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 210_000;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function hmac(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message)));
}

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Salted PBKDF2 hash in `salt:hash` (hex) form, for storing a password. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${toHex(salt.buffer)}:${await pbkdf2(password, salt)}`;
}

/** The configured password, or null when unset (the gate then denies everyone). */
function envPassword(): string | null {
  const password = process.env.ATLAS_PASSWORD;
  return password ? password : null;
}

/** What sessions are keyed by, or null when no password is configured at all. */
async function sessionSecret(): Promise<string | null> {
  return (await getStoredPasswordHash()) ?? envPassword();
}

export async function isPasswordValid(candidate: string): Promise<boolean> {
  const stored = await getStoredPasswordHash();
  if (stored) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    return safeEqual(await pbkdf2(candidate, fromHex(salt)), hash);
  }
  const password = envPassword();
  if (!password) return false;
  // Compare digests so length differences don't leak.
  const [a, b] = await Promise.all([hmac("check", candidate), hmac("check", password)]);
  return safeEqual(a, b);
}

export async function createSessionToken(): Promise<string | null> {
  const secret = await sessionSecret();
  return secret ? hmac(secret, "atlas-session-v1") : null;
}

export async function isSessionValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken();
  return expected !== null && safeEqual(token, expected);
}
