/**
 * Single-password gate. The session cookie holds an HMAC of a fixed label keyed
 * by ATLAS_PASSWORD, so it can't be forged without the password and changing
 * the password signs everyone out. Web Crypto only: runs in proxy and routes.
 */
export const SESSION_COOKIE = "atlas_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
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

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The configured password, or null when unset (the gate then denies everyone). */
function configuredPassword(): string | null {
  const password = process.env.ATLAS_PASSWORD;
  return password ? password : null;
}

export async function isPasswordValid(candidate: string): Promise<boolean> {
  const password = configuredPassword();
  if (!password) return false;
  // Compare digests so length differences don't leak.
  const [a, b] = await Promise.all([hmac("check", candidate), hmac("check", password)]);
  return safeEqual(a, b);
}

export async function createSessionToken(): Promise<string | null> {
  const password = configuredPassword();
  return password ? hmac(password, "atlas-session-v1") : null;
}

export async function isSessionValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken();
  return expected !== null && safeEqual(token, expected);
}
