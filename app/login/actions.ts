"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, isPasswordValid } from "@/lib/auth/session";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  const token = typeof password === "string" ? await createSessionToken() : null;

  if (typeof password !== "string" || !token || !(await isPasswordValid(password))) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Incorrect password." };
  }

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
