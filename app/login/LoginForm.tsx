"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });

  return (
    <form action={action} className="mt-8 space-y-3 text-left">
      <label htmlFor="password" className="sr-only">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        autoFocus
        required
        className="w-full border border-line-strong bg-transparent px-4 py-2.5 text-sm text-cream placeholder:text-dim focus:border-cream focus:outline-none"
      />
      {state.error && (
        <p role="alert" className="text-xs text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full border border-line-strong px-4 py-2.5 text-sm text-cream transition-colors hover:bg-cream hover:text-ink disabled:opacity-50"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
