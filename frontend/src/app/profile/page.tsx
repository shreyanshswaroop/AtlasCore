"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { categories } from "@/components/CategoryFilters";
import {
  getBookmarkLists,
  getCurrentUser,
  updateProfile,
  type AuthUser,
  type BookmarkList,
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
const sections = [
  { id: "general", label: "General" },
  { id: "personalization", label: "Personalization" },
  { id: "lists", label: "Saved lists" },
] as const;
type SectionId = (typeof sections)[number]["id"];

type SavedProfile = {
  fullName: string;
  jobTitle: string;
  topics: string[];
  contentTypes: string[];
};

function formatOption(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

function splitName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

function toggleValue(value: string, values: string[], setValues: (values: string[]) => void) {
  if (values.includes(value)) {
    if (values.length > 1) setValues(values.filter((item) => item !== value));
  } else {
    setValues([...values, value]);
  }
}

const fieldClass =
  "mt-2 h-11 w-full rounded-none border border-[#262626] bg-black px-3.5 font-sans text-sm font-normal normal-case tracking-normal text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30";
const labelClass = "block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const panelClass = "border border-[#242424] bg-[#0e0e0e]";

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState(roleOptions[0]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(["NEWS"]);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [bookmarkLists, setBookmarkLists] = useState<BookmarkList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser();
        if (!isCurrent) return;
        setUser(currentUser);

        if (currentUser) {
          const name = splitName(currentUser.full_name);
          setFirstName(name.firstName);
          setLastName(name.lastName);
          const profile = {
            fullName: currentUser.full_name,
            jobTitle: currentUser.job_title || roleOptions[0],
            topics: currentUser.preferred_topics.length
              ? currentUser.preferred_topics
              : ["AGENTS", "LLMS", "BUSINESS"],
            contentTypes: currentUser.preferred_content_types.length
              ? currentUser.preferred_content_types
              : ["NEWS"],
          };
          setJobTitle(profile.jobTitle);
          setSelectedTopics(profile.topics);
          setSelectedContentTypes(profile.contentTypes);
          setSavedProfile(profile);

          try {
            const listData = await getBookmarkLists();
            if (isCurrent) setBookmarkLists(listData.items);
          } catch (error) {
            console.error(error);
            if (isCurrent) setErrorMessage("Could not load saved lists.");
          }
        }
      } catch (error) {
        console.error(error);
        if (isCurrent) setErrorMessage("Could not load settings.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isCurrent = false;
    };
  }, []);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const isDirty = savedProfile !== null && (
    fullName !== savedProfile.fullName ||
    jobTitle !== savedProfile.jobTitle ||
    JSON.stringify(selectedTopics) !== JSON.stringify(savedProfile.topics) ||
    JSON.stringify(selectedContentTypes) !== JSON.stringify(savedProfile.contentTypes)
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || !firstName.trim()) return;
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await updateProfile(fullName, jobTitle, selectedTopics, selectedContentTypes);
      setUser(response.user);
      const name = splitName(response.user.full_name);
      setFirstName(name.firstName);
      setLastName(name.lastName);
      setSavedProfile({
        fullName: response.user.full_name,
        jobTitle: response.user.job_title || roleOptions[0],
        topics: response.user.preferred_topics,
        contentTypes: response.user.preferred_content_types,
      });
      setMessage("Changes saved");
      window.dispatchEvent(new Event("atlascore-auth-updated"));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <Navbar />
      <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-12 sm:px-8 lg:pt-20">
        <h1 className="mb-9 font-serif text-4xl font-normal tracking-tight sm:mb-11 sm:text-5xl">
          Settings
        </h1>

        {isLoading ? (
          <div role="status" aria-label="Loading settings" className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
            <div className="space-y-3">
              <div className="skeleton-shimmer h-12" />
              <div className="skeleton-shimmer h-12" />
              <div className="skeleton-shimmer h-12" />
            </div>
            <div className="skeleton-shimmer h-[430px]" />
          </div>
        ) : !user ? (
          <div className={`${panelClass} max-w-xl p-8`}>
            <h2 className="text-lg font-semibold">Sign in to manage settings</h2>
            <p className="mt-2 text-sm text-zinc-400">Your account preferences will appear here.</p>
            <Link href="/" className="mt-6 inline-flex border border-[#444444] px-4 py-2 font-mono text-xs uppercase tracking-widest text-zinc-100 hover:bg-[#0e0e0e]">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
            <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:block lg:space-y-1 lg:overflow-visible">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  aria-current={activeSection === section.id ? "page" : undefined}
                  onClick={() => {
                    setActiveSection(section.id);
                    setMessage("");
                    setErrorMessage("");
                  }}
                  className={`min-w-max px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.15em] transition lg:block lg:w-full ${
                    activeSection === section.id
                      ? "bg-[#171717] text-zinc-100"
                      : "text-zinc-500 hover:bg-[#101010] hover:text-zinc-200"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>

            <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
              {activeSection === "general" && (
                <section aria-labelledby="profile-heading" className={`${panelClass} p-5 sm:p-7`}>
                  <h2 id="profile-heading" className="border-b border-[#242424] pb-4 text-base font-medium">Profile</h2>
                  <div className="grid gap-6 border-b border-[#242424] py-6 sm:grid-cols-[108px_minmax(0,1fr)]">
                    <div className="grid h-[108px] w-[108px] place-items-center bg-violet-800 font-serif text-5xl text-white">
                      {firstName.slice(0, 1).toUpperCase() || "A"}
                    </div>
                    <dl className="self-center">
                      <div className="flex items-center justify-between gap-4 border-b border-[#242424] py-2">
                        <dt className={labelClass}>Occupation</dt>
                        <dd className="text-sm text-zinc-300">{formatOption(jobTitle)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-[#242424] py-2">
                        <dt className={labelClass}>Followed topics</dt>
                        <dd className="text-sm text-zinc-300">{selectedTopics.length}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4 py-2">
                        <dt className={labelClass}>Saved lists</dt>
                        <dd className="text-sm text-zinc-300">{bookmarkLists.length}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="grid gap-5 pt-6 sm:grid-cols-2">
                    <label className={labelClass}>
                      First name
                      <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" className={fieldClass} />
                    </label>
                    <label className={labelClass}>
                      Last name
                      <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" className={fieldClass} />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Email address
                      <input value={user.email} readOnly aria-readonly="true" className={`${fieldClass} text-zinc-400`} />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Occupation
                      <select value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className={fieldClass}>
                        {roleOptions.map((role) => <option key={role} value={role}>{formatOption(role)}</option>)}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {activeSection === "personalization" && (
                <section aria-labelledby="personalization-heading" className={`${panelClass} p-5 sm:p-7`}>
                  <h2 id="personalization-heading" className="border-b border-[#242424] pb-4 text-base font-medium">Personalization</h2>
                  <div className="py-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className={labelClass}>Topics you follow</h3>
                      <span className="text-xs text-zinc-600">Select at least one</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topicOptions.map((topic) => {
                        const selected = selectedTopics.includes(topic.label);
                        return (
                          <button key={topic.label} type="button" aria-pressed={selected} onClick={() => toggleValue(topic.label, selectedTopics, setSelectedTopics)} className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition ${selected ? "border-violet-700 bg-violet-900/30 text-zinc-100" : "border-[#292929] bg-black text-zinc-500 hover:border-zinc-500 hover:text-zinc-200"}`}>
                            {formatOption(topic.label)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-[#242424] py-6">
                    <h3 className={labelClass}>Content types</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {contentTypeOptions.map((contentType) => {
                        const selected = selectedContentTypes.includes(contentType);
                        return (
                          <button key={contentType} type="button" aria-pressed={selected} onClick={() => toggleValue(contentType, selectedContentTypes, setSelectedContentTypes)} className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition ${selected ? "border-violet-700 bg-violet-900/30 text-zinc-100" : "border-[#292929] bg-black text-zinc-500 hover:border-zinc-500 hover:text-zinc-200"}`}>
                            {formatOption(contentType)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="border-t border-[#242424] pt-5 text-sm leading-6 text-zinc-500">
                    Your feed prioritizes {selectedTopics.slice(0, 3).map(formatOption).join(", ")}.
                  </p>
                </section>
              )}

              {activeSection === "lists" && (
                <section aria-labelledby="lists-heading" className={`${panelClass} p-5 sm:p-7`}>
                  <div className="flex items-center justify-between gap-4 border-b border-[#242424] pb-4">
                    <h2 id="lists-heading" className="text-base font-medium">Saved lists</h2>
                    <Link href="/bookmarks" className="border border-[#333] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:bg-[#171717]">View bookmarks ↗</Link>
                  </div>
                  {bookmarkLists.length ? (
                    <div className="divide-y divide-[#242424]">
                      {bookmarkLists.map((list) => (
                        <div key={list.id} className="flex items-center justify-between gap-4 py-4">
                          <span className="truncate text-sm text-zinc-200">{list.name}</span>
                          <span className="shrink-0 font-mono text-xs text-zinc-500">{list.item_count ?? 0} stories</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-zinc-500">No lists yet. Create one when saving an article.</p>
                  )}
                </section>
              )}

              {(message || errorMessage) && (
                <div aria-live="polite">
                  {message && <p role="status" className="border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">{message}</p>}
                  {errorMessage && <p role="alert" className="border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{errorMessage}</p>}
                </div>
              )}
              {(activeSection !== "lists" || isDirty) && (
                <div className="flex items-center justify-end gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-600">{isDirty ? "Unsaved changes" : "All changes saved"}</span>
                  <button type="submit" disabled={!isDirty || isSaving || !firstName.trim()} className="border border-zinc-500 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-100 transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:border-[#292929] disabled:text-zinc-600">
                    {isSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
