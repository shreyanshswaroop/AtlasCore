"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { categories } from "@/components/CategoryFilters";
import {
  getCurrentUser,
  updateProfile,
  type AuthUser,
} from "@/lib/api";

const roleOptions = [
  "RESEARCHER",
  "SOFTWARE_DEVELOPER",
  "DATA_SCIENTIST",
  "ML_ENGINEER",
  "STUDENT",
  "FOUNDER",
];
const contentTypeOptions = ["NEWS", "PAPERS", "MODELS", "REPOS"];
const topicOptions = categories.filter((category) => category.label !== "ALL");

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}

function toggleValue(
  value: string,
  selectedValues: string[],
  setSelectedValues: (values: string[]) => void
) {
  if (selectedValues.includes(value)) {
    if (selectedValues.length > 1) {
      setSelectedValues(
        selectedValues.filter((selectedValue) => selectedValue !== value)
      );
    }

    return;
  }

  setSelectedValues([...selectedValues, value]);
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState(roleOptions[0]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState(["NEWS"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!isCurrent) {
          return;
        }

        setUser(currentUser);

        if (currentUser) {
          setFullName(currentUser.full_name);
          setJobTitle(currentUser.job_title || roleOptions[0]);
          setSelectedTopics(
            currentUser.preferred_topics.length > 0
              ? currentUser.preferred_topics
              : ["AGENTS", "LLMS", "BUSINESS"]
          );
          setSelectedContentTypes(
            currentUser.preferred_content_types.length > 0
              ? currentUser.preferred_content_types
              : ["NEWS"]
          );
        }
      })
      .catch((error) => {
        console.error(error);

        if (isCurrent) {
          setErrorMessage("Unable to load profile.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await updateProfile(
        fullName,
        jobTitle,
        selectedTopics,
        selectedContentTypes
      );

      setUser(response.user);
      setMessage("Profile saved");
      window.dispatchEvent(new Event("atlascore-auth-updated"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save profile"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="site-background min-h-screen text-zinc-100">
      <Navbar />

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="mb-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">
            Account
          </p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.04em] text-white">
            Settings
          </h1>
        </div>

        {isLoading ? (
          <div className="border border-zinc-800 bg-[#080808] px-6 py-16 text-center font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            Loading profile...
          </div>
        ) : !user ? (
          <div className="border border-zinc-800 bg-[#080808] px-6 py-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
              Sign in required
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex border border-zinc-700 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
              <div className="border border-zinc-800 bg-zinc-900 px-4 py-4 text-white">
                <span className="mr-2 text-[#3b82f6]">■</span>
                General
              </div>
              <div className="border border-transparent px-4 py-4 text-zinc-600">
                <span className="mr-2">□</span>
                Preferences
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="border border-zinc-800 bg-[#080808] p-6">
                <div className="mb-7 flex items-center gap-5">
                  <div className="grid h-20 w-20 place-items-center border border-zinc-700 bg-zinc-900 font-mono text-2xl font-bold uppercase text-white">
                    {user.full_name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                      Profile
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Manage your AtlasCore account and feed signal.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      Name
                    </span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="mt-2 h-11 w-full border border-zinc-800 bg-[#0b0b0b] px-4 font-mono text-sm font-bold text-white outline-none hover:border-zinc-600 focus:border-zinc-500"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      Email address
                    </span>
                    <input
                      value={user.email}
                      readOnly
                      className="mt-2 h-11 w-full border border-zinc-800 bg-[#050505] px-4 font-mono text-sm font-bold text-zinc-500 outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="border border-zinc-800 bg-[#080808] p-6">
                <label className="block">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Occupation
                  </span>
                  <select
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    className="mt-2 h-11 w-full border border-zinc-800 bg-[#0b0b0b] px-4 font-mono text-sm font-bold uppercase text-white outline-none hover:border-zinc-600 focus:border-zinc-500"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {formatOption(role)}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="border border-zinc-800 bg-[#080808] p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Topics you follow
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topicOptions.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.label);

                    return (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => toggleValue(topic.label, selectedTopics, setSelectedTopics)}
                        className={`border px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                          isSelected
                            ? "border-[#3b82f6]/70 bg-blue-950/30 text-blue-300"
                            : "border-zinc-800 bg-[#0b0b0b] text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="border border-zinc-800 bg-[#080808] p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Content types
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {contentTypeOptions.map((contentType) => {
                    const isSelected = selectedContentTypes.includes(contentType);

                    return (
                      <button
                        key={contentType}
                        type="button"
                        onClick={() => toggleValue(contentType, selectedContentTypes, setSelectedContentTypes)}
                        className={`border px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                          isSelected
                            ? "border-[#3b82f6]/70 bg-blue-950/30 text-blue-300"
                            : "border-zinc-800 bg-[#0b0b0b] text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {contentType}
                      </button>
                    );
                  })}
                </div>
              </section>

              {message && (
                <p className="border border-emerald-900/80 bg-emerald-950/30 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                  {message}
                </p>
              )}
              {errorMessage && (
                <p className="border border-red-900/80 bg-red-950/40 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-red-200">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="group flex h-12 w-full items-center justify-center bg-[#3b82f6] px-5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#60a5fa] disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
