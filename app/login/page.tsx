import type { Metadata } from "next";
import { BrandMark } from "@/components/dashboard/Header";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Mineral Atlas" };

export default function LoginPage() {
  return (
    <main className="grid h-dvh place-items-center bg-ink px-6">
      <div className="w-full max-w-xs text-center">
        <BrandMark className="mx-auto size-10 text-cream" />
        <p className="eyebrow mt-4">Mineral Atlas</p>
        <h1 className="mt-2 font-serif text-5xl leading-none text-cream">Sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
