"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signup } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signup(fullName, email, password);
      router.push("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create account"
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
            Build your signal map
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-zinc-400 sm:text-xl">
            Create an account to follow AI companies, research, launches, and market moves.
          </p>
        </div>

        <div className="w-full max-w-[500px] rounded-3xl border border-zinc-700/70 bg-[#121212]/85 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="signup-name"
                className="sr-only"
              >
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-[52px] w-full rounded-2xl border border-transparent bg-[#2b2b2b] px-5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#303030]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="sr-only"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-[52px] w-full rounded-2xl border border-transparent bg-[#2b2b2b] px-5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#303030]"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="sr-only"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[52px] w-full rounded-2xl border border-transparent bg-[#2b2b2b] px-5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#303030]"
                placeholder="At least 8 characters"
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
              {isSubmitting ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-zinc-100 hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
