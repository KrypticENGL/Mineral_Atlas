"use server";

import { cookies } from "next/headers";
import { MIN_PASSWORD_LENGTH } from "./constants";
import { saveStoredPasswordHash } from "@/lib/auth/password-store";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, hashPassword, isPasswordValid } from "@/lib/auth/session";

export type PasswordState = { error: string | null; done: boolean };

const fail = (error: string): PasswordState => ({ error, done: false });

/**
 * Replaces the site password. The current password is required again, and the
 * caller's session is re-issued so they stay signed in while every other
 * session (keyed by the old credential) stops working.
 */
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = formData.get("current");
  const next = formData.get("next");
  const confirm = formData.get("confirm");
  if (typeof current !== "string" || typeof next !== "string" || typeof confirm !== "string") {
    return fail("Fill in every field.");
  }

  if (!(await isPasswordValid(current))) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fail("Current password is incorrect.");
  }
  if (next.length < MIN_PASSWORD_LENGTH) return fail(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (next !== confirm) return fail("The new passwords don't match.");
  if (next === current) return fail("Choose a password different from the current one.");

  try {
    await saveStoredPasswordHash(await hashPassword(next));
  } catch {
    return fail("Couldn't save the password. Run the database migration (npm run db:deploy) and try again.");
  }

  const token = await createSessionToken();
  if (token) {
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }
  return { error: null, done: true };
}
