"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signin } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signin(email, password);
      router.push("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="site-background min-h-screen overflow-hidden bg-[#111111] text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-3 text-white"
          aria-label="Back to AtlasCore"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
            AtlasCore
          </span>
        </Link>

        <div className="mb-8 max-w-3xl">
          <h1 className="font-serif text-5xl font-normal leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-7xl">
            Welcome back
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-zinc-400 sm:text-xl">
            Sign in to continue tracking the AI companies, stories, and signals that matter.
          </p>
        </div>

        <div className="w-full max-w-[500px] rounded-3xl border border-zinc-700/70 bg-[#121212]/85 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <label
                htmlFor="signin-email"
                className="sr-only"
              >
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[52px] w-full rounded-2xl border border-transparent bg-[#2b2b2b] px-5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#303030]"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signin-password"
                className="sr-only"
              >
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[52px] w-full rounded-2xl border border-transparent bg-[#2b2b2b] px-5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#303030]"
                placeholder="Enter your password"
              />
            </div>

            {errorMessage && (
              <p className="rounded-2xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-zinc-100 px-5 text-base font-semibold text-black hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {isSubmitting ? "Signing in..." : "Continue with email"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-500">
            New to AtlasCore?{" "}
            <Link href="/signup" className="font-semibold text-zinc-100 hover:text-white">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
