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
const sidebarItems = [
  "General",
  "Feed",
  "Lists",
  "Notifications",
  "Companies",
  "Security",
];
const notificationOptions = [
  "Daily AI digest",
  "Breaking company updates",
  "Weekly leaderboard summary",
  "Saved-list reminders",
];
const securityActions = [
  "Change password",
  "Email verification",
  "Sign out from all sessions",
];
const minimumSkeletonDuration = 700;

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

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

function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading profile settings"
      className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]"
    >
      <span className="sr-only">Loading profile settings</span>

      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-hidden">
        <div className="mb-4 skeleton-shimmer h-3 w-20" />
        <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5 lg:overflow-x-hidden lg:pb-0 lg:pr-1">
          {sidebarItems.map((item, index) => (
            <div
              key={item}
              className={`flex min-w-[150px] items-center gap-3 border px-3 py-2.5 lg:w-full lg:min-w-0 ${
                index === 0 ? "border-zinc-800 bg-zinc-900" : "border-transparent"
              }`}
            >
              <span className="skeleton-shimmer h-1.5 w-1.5" />
              <span
                className="skeleton-shimmer h-3"
                style={{ width: `${Math.max(48, 120 - index * 8)}px` }}
              />
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0 w-full max-w-[750px] space-y-5">
        <div className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="skeleton-shimmer h-3 w-36" />
          <div className="skeleton-shimmer h-3 w-44" />
        </div>

        <section className="border border-zinc-800 bg-[#080808] p-6">
          <div className="mb-7 flex items-center gap-5">
            <div className="skeleton-shimmer h-20 w-20" />
            <div className="space-y-3">
              <div className="skeleton-shimmer h-3 w-20" />
              <div className="skeleton-shimmer h-3 w-64 max-w-[60vw]" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="skeleton-shimmer h-3 w-16" />
              <div className="mt-2 skeleton-shimmer h-11 w-full" />
            </div>
            <div>
              <div className="skeleton-shimmer h-3 w-28" />
              <div className="mt-2 skeleton-shimmer h-11 w-full" />
            </div>
          </div>
        </section>

        <section className="border border-zinc-800 bg-[#080808] p-6">
          <div className="skeleton-shimmer h-3 w-24" />
          <div className="mt-2 skeleton-shimmer h-11 w-full" />
        </section>

        <section className="border border-zinc-800 bg-[#080808] p-6">
          <div className="skeleton-shimmer h-3 w-36" />
          <div className="mt-4 flex flex-wrap gap-2">
            {["one", "two", "three", "four", "five", "six", "seven"].map(
              (item, index) => (
                <div
                  key={item}
                  className="skeleton-shimmer h-9"
                  style={{ width: `${72 + index * 10}px` }}
                />
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState(roleOptions[0]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState(["NEWS"]);
  const [bookmarkLists, setBookmarkLists] = useState<BookmarkList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        const [currentUser] = await Promise.all([
          getCurrentUser(),
          wait(minimumSkeletonDuration),
        ]);

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

          const listData = await getBookmarkLists();

          if (!isCurrent) {
            return;
          }

          setBookmarkLists(listData.items);
        }
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          setErrorMessage("Unable to load profile.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

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

      <section>
        <div className="mx-auto max-w-[1500px] px-5 pb-8 pt-14 sm:px-8 sm:pb-10 sm:pt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                Account
              </p>
              <h1 className="mt-4 text-4xl font-medium tracking-[-0.04em] text-white">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-8">
        {isLoading ? (
          <ProfileSkeleton />
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
          <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
              <p className="mb-4 font-mono text-xs font-normal uppercase tracking-[0.11em] text-zinc-600">
                Settings
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5 lg:overflow-x-hidden lg:pb-0 lg:pr-1">
              {sidebarItems.map((item, index) => (
                <a
                  key={item}
                  href={`#profile-${item.toLowerCase()}`}
                  className={`group flex min-w-max items-center justify-between gap-3 border px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-[0.11em] lg:w-full lg:min-w-0 ${
                    index === 0
                      ? "border-zinc-800 bg-zinc-900 text-white"
                      : "border-transparent text-zinc-600 hover:border-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 border ${
                        index === 0
                          ? "border-[#3b82f6] bg-[#3b82f6]"
                          : "border-zinc-700"
                      }`}
                    />
                    <span className="truncate text-zinc-200 group-hover:text-white">
                      {item}
                    </span>
                  </span>
                </a>
              ))}
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="min-w-0 w-full max-w-[750px] space-y-5">
              <div className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-zinc-300">
                  Profile settings
                </h2>
              </div>

              <section id="profile-general" className="border border-zinc-800 bg-[#080808] p-6">
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

              <section id="profile-feed" className="border border-zinc-800 bg-[#080808] p-6">
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

              <section className="border border-zinc-800 bg-[#080808] p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Feed preview
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Your feed prioritizes {selectedTopics.slice(0, 4).map(formatOption).join(", ") || "your selected topics"}.
                  Content is tuned for {formatOption(jobTitle).toLowerCase()} signals.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {selectedTopics.slice(0, 3).map((topic) => (
                    <div key={topic} className="border border-zinc-800 bg-[#050505] p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#93c5fd]">
                        {formatOption(topic)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        New stories matching this topic will rank higher in your index.
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="profile-lists" className="border border-zinc-800 bg-[#080808] p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      Bookmark lists
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      Manage saved reading groups from one place.
                    </p>
                  </div>
                  <Link
                    href="/bookmarks"
                    className="inline-flex border border-zinc-700 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-300 hover:border-zinc-500 hover:text-white"
                  >
                    Open bookmarks
                  </Link>
                </div>

                <div className="mt-5 space-y-2">
                  {bookmarkLists.length > 0 ? (
                    bookmarkLists.map((bookmarkList) => (
                      <div
                        key={bookmarkList.id}
                        className="flex items-center justify-between gap-4 border border-zinc-800 bg-[#050505] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-zinc-200">
                            {bookmarkList.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600">
                            {bookmarkList.item_count ?? 0} saved stories
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled
                            className="border border-zinc-800 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-700"
                          >
                            Rename soon
                          </button>
                          <button
                            type="button"
                            disabled
                            className="border border-zinc-800 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-700"
                          >
                            Delete soon
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
                      No custom lists yet. Create one from any bookmark menu.
                    </p>
                  )}
                </div>
              </section>

              <section id="profile-notifications" className="border border-zinc-800 bg-[#080808] p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Notifications
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {notificationOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center justify-between gap-4 border border-zinc-800 bg-[#050505] px-4 py-3 text-zinc-600"
                    >
                      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                        {option}
                      </span>
                      <span className="border border-zinc-800 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                        Soon
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section id="profile-companies" className="border border-zinc-800 bg-[#080808] p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Companies you follow
                </h2>
                <div className="mt-4 border border-dashed border-zinc-800 px-4 py-8 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
                    Followed companies coming soon
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    This will track companies from the leaderboard and company pages.
                  </p>
                </div>
              </section>

              <section id="profile-security" className="border border-zinc-800 bg-[#080808] p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Account security
                </h2>
                <div className="mt-4 space-y-2">
                  {securityActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled
                      className="flex w-full items-center justify-between border border-zinc-800 bg-[#050505] px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-700"
                    >
                      {action}
                      <span>Coming soon</span>
                    </button>
                  ))}
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
