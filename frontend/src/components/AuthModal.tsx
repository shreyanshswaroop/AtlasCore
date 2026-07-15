"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import {
  completeOnboarding,
  signin,
  signup,
  type AuthUser,
} from "@/lib/api";
import { categories } from "./CategoryFilters";

type AuthMode = "signin" | "signup";

type AuthModalProps = {
  initialMode: AuthMode;
  onAuthenticated: (user: AuthUser) => void;
  onClose: () => void;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

const topicOptions = categories.filter((category) => category.label !== "ALL");
const roleOptions = [
  "RESEARCHER",
  "SOFTWARE_DEVELOPER",
  "DATA_SCIENTIST",
  "ML_ENGINEER",
  "STUDENT",
  "FOUNDER",
];
const contentTypeOptions = ["NEWS", "PAPERS", "MODELS", "REPOS"];

export default function AuthModal({
  initialMode,
  onAuthenticated,
  onClose,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedUser, setConfirmedUser] = useState<AuthUser | null>(null);
  const [pendingSignupUser, setPendingSignupUser] = useState<AuthUser | null>(null);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [selectedTopics, setSelectedTopics] = useState(["AGENTS", "LLMS", "BUSINESS"]);
  const [selectedContentTypes, setSelectedContentTypes] = useState(["NEWS"]);
  const successTimeoutRef = useRef<number | null>(null);

  const isSignup = mode === "signup";
  const isAuthConfirmed = confirmedUser !== null;
  const isOnboarding = pendingSignupUser !== null && !isAuthConfirmed;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, [onClose]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage("");
    setConfirmedUser(null);
    setPendingSignupUser(null);
  }

  function toggleValue(value: string, selectedValues: string[], setSelectedValues: (values: string[]) => void) {
    if (selectedValues.includes(value)) {
      if (selectedValues.length > 1) {
        setSelectedValues(selectedValues.filter((selectedValue) => selectedValue !== value));
      }

      return;
    }

    setSelectedValues([...selectedValues, value]);
  }

  async function handleOnboardingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const [response] = await Promise.all([
        completeOnboarding(selectedRole, selectedTopics, selectedContentTypes),
        wait(1800),
      ]);

      setConfirmedUser(response.user);
      successTimeoutRef.current = window.setTimeout(() => {
        onAuthenticated(response.user);
      }, 2200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save preferences"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const [response] = await Promise.all([
          signup(fullName, email, password),
          wait(2000),
        ]);

        setPendingSignupUser(response.user);

        return;
      }

      const [response] = await Promise.all([
        signin(email, password),
        wait(2000),
      ]);

      setConfirmedUser(response.user);
      successTimeoutRef.current = window.setTimeout(() => {
        onAuthenticated(response.user);
      }, 2200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to continue"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[440px] rounded-2xl border border-zinc-800 bg-[#070707] px-8 py-8 text-zinc-100 shadow-2xl shadow-black/60 sm:px-10">
        <button
          type="button"
          aria-label="Close authentication dialog"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full font-mono text-2xl leading-none text-zinc-500 hover:bg-zinc-900 hover:text-white"
        >
          ×
        </button>

        {isAuthConfirmed ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-full border border-zinc-700 bg-[#0b0b0b]">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-full border-2 border-zinc-200 font-mono text-lg text-white animate-[auth-success-pop_420ms_ease-out_both]"
              >
                ✓
              </span>
            </div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">
              {isSignup ? "Account created" : "Signed in"}
            </p>
            <h2
              id="auth-modal-title"
              className="mt-4 text-3xl font-medium tracking-[-0.035em] text-white"
            >
              {isSignup ? "Welcome to AtlasCore" : "Welcome back"}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
              {isSignup
                ? "Your account is ready. Opening your intelligence feed now."
                : "Opening your intelligence feed now."}
            </p>
          </div>
        ) : isOnboarding ? (
          <div className="animate-[auth-form-in_220ms_ease-out_both]">
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">
              Tune your feed
            </p>
            <h2
              id="auth-modal-title"
              className="pr-8 text-2xl font-medium tracking-[-0.035em] text-white sm:text-3xl"
            >
              What do you want to read?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Pick a role and a few topics. AtlasCore will start your feed there.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="mt-7 space-y-5">
              <div>
                <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Role
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((role) => {
                    const isSelected = selectedRole === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`h-10 border px-3 text-left font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                          isSelected
                            ? "border-[#3b82f6] bg-blue-950/30 text-white"
                            : "border-zinc-800 bg-[#0b0b0b] text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {role.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Topics
                </p>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                  {topicOptions.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.label);

                    return (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => toggleValue(topic.label, selectedTopics, setSelectedTopics)}
                        className={`border px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                          isSelected
                            ? "border-[#3b82f6] bg-blue-950/30 text-white"
                            : "border-zinc-800 bg-[#0b0b0b] text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Content
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {contentTypeOptions.map((contentType) => {
                    const isSelected = selectedContentTypes.includes(contentType);

                    return (
                      <button
                        key={contentType}
                        type="button"
                        onClick={() => toggleValue(contentType, selectedContentTypes, setSelectedContentTypes)}
                        className={`h-10 border px-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                          isSelected
                            ? "border-[#3b82f6] bg-blue-950/30 text-white"
                            : "border-zinc-800 bg-[#0b0b0b] text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {contentType}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMessage && (
                <p className="border border-red-900/80 bg-red-950/50 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-red-100">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center rounded-md bg-zinc-100 px-5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-black hover:bg-white disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isSubmitting ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="mr-3 h-4 w-4 rounded-full border-2 border-zinc-500 border-t-black animate-spin"
                    />
                    <span>Building feed...</span>
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-[auth-form-in_220ms_ease-out_both]">
            <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">
              {isSignup ? "Create account" : "Account access"}
            </p>
            <h2
              id="auth-modal-title"
              className="pr-8 text-2xl font-medium tracking-[-0.035em] text-white sm:text-3xl"
            >
              {isSignup ? "Start with AtlasCore" : "Sign in to AtlasCore"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {isSignup
                ? "Follow AI companies, launches, and research signals from one workspace."
                : "Continue tracking your AI news and company intelligence feed."}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {isSignup && (
                <div>
                  <label htmlFor="auth-name" className="sr-only">
                    Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 w-full rounded-md border border-zinc-800 bg-[#0b0b0b] px-4 font-mono text-sm text-white outline-none placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.11em] placeholder:text-zinc-700 hover:border-zinc-600 hover:bg-[#101010] hover:placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#101010]"
                    placeholder="Name"
                  />
                </div>
              )}

            <div>
              <label htmlFor="auth-email" className="sr-only">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-md border border-zinc-800 bg-[#0b0b0b] px-4 font-mono text-sm text-white outline-none placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.11em] placeholder:text-zinc-700 hover:border-zinc-600 hover:bg-[#101010] hover:placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#101010]"
                placeholder="Email"
              />
            </div>

              <div>
                <label htmlFor="auth-password" className="sr-only">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={isSignup ? 8 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-md border border-zinc-800 bg-[#0b0b0b] px-4 font-mono text-sm text-white outline-none placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.11em] placeholder:text-zinc-700 hover:border-zinc-600 hover:bg-[#101010] hover:placeholder:text-zinc-500 focus:border-zinc-500 focus:bg-[#101010]"
                  placeholder="Password"
                />
              </div>

              {errorMessage && (
                <p className="border border-red-900/80 bg-red-950/50 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-red-100">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-zinc-100 px-5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-black hover:bg-white focus-visible:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isSubmitting ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="mr-3 h-4 w-4 rounded-full border-2 border-zinc-500 border-t-black animate-spin"
                    />
                    <span>{isSignup ? "Creating..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span className="transition-transform duration-200 group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
                      {isSignup ? "Create account" : "Sign in"}
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-2 translate-x-[-6px] font-mono text-lg leading-none opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                    >
                      ↗
                    </span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-600">
              {isSignup ? "Already have an account?" : "New to AtlasCore?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? "signin" : "signup")}
                className="group inline-flex items-center font-bold text-zinc-200 hover:text-white"
              >
                <span className="underline-offset-4 group-hover:underline">
                  {isSignup ? "Sign in" : "Create an account"}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-1 translate-x-[-3px] font-mono text-sm opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                >
                  ↗
                </span>
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
