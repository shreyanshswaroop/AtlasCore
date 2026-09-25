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
      className="mx-auto max-w-[1120px] space-y-6"
    >
      <span className="sr-only">Loading profile settings</span>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        {sidebarItems.map((item, index) => (
          <div
            key={item}
            className="flex min-w-[120px] items-center justify-center rounded-xl px-4 py-3"
          >
            <span
              className="skeleton-shimmer h-3"
              style={{ width: `${Math.max(48, 112 - index * 8)}px` }}
            />
          </div>
        ))}
      </div>

      <div className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-7 flex items-center gap-5">
            <div className="skeleton-shimmer h-20 w-20 rounded-full" />
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

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="skeleton-shimmer h-3 w-24" />
          <div className="mt-2 skeleton-shimmer h-11 w-full" />
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
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
    <main className="site-background min-h-screen text-zinc-950">
      <Navbar />

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-950">
                Account
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
                Settings
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-500">
                Manage your profile, followed topics, saved lists, and account preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 pb-10 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
        {isLoading ? (
          <ProfileSkeleton />
        ) : !user ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
              Sign in required
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:border-zinc-300 hover:text-zinc-950"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <nav className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              <div className="flex min-w-max gap-1">
              {sidebarItems.map((item, index) => (
                <a
                  key={item}
                  href={`#profile-${item.toLowerCase()}`}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    index === 0
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
                >
                  {item}
                </a>
              ))}
              </div>
            </nav>

            <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
              <section id="profile-general" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-7 flex items-center gap-5">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-zinc-950 via-red-600 to-zinc-950 text-2xl font-bold uppercase text-white shadow-sm">
                    {user.full_name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-950">
                      Profile
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Manage your AtlasCore account and feed signal.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-600">
                      Name
                    </span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 outline-none hover:border-zinc-300 focus:border-zinc-500 focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-600">
                      Email address
                    </span>
                    <input
                      value={user.email}
                      readOnly
                      className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 text-sm font-semibold text-zinc-500 outline-none"
                    />
                  </label>
                </div>
              </section>

              <section id="profile-feed" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <label className="block">
                  <span className="text-sm font-semibold text-zinc-600">
                    Occupation
                  </span>
                  <select
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 outline-none hover:border-zinc-300 focus:border-zinc-500 focus:bg-white"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {formatOption(role)}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Topics you follow
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  These topics appear in your footer categories and help tune future feed signals.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topicOptions.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.label);

                    return (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => toggleValue(topic.label, selectedTopics, setSelectedTopics)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          isSelected
                            ? "border-zinc-950 bg-zinc-950 text-white shadow-sm shadow-zinc-950/20"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-950"
                        }`}
                      >
                        {formatOption(topic.label)}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-zinc-950">
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
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          isSelected
                            ? "border-zinc-950 bg-zinc-950 text-white shadow-sm shadow-zinc-950/20"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-950"
                        }`}
                      >
                        {contentType}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Feed preview
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Your feed prioritizes {selectedTopics.slice(0, 4).map(formatOption).join(", ") || "your selected topics"}.
                  Content is tuned for {formatOption(jobTitle).toLowerCase()} signals.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {selectedTopics.slice(0, 3).map((topic) => (
                    <div key={topic} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-950">
                        {formatOption(topic)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        New stories matching this topic will rank higher in your index.
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="profile-lists" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-950">
                      Bookmark lists
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      Manage saved reading groups from one place.
                    </p>
                  </div>
                  <Link
                    href="/bookmarks"
                    className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 shadow-sm hover:border-zinc-300 hover:text-zinc-950"
                  >
                    Open bookmarks
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {bookmarkLists.length > 0 ? (
                    bookmarkLists.map((bookmarkList) => (
                      <div
                        key={bookmarkList.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {bookmarkList.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-zinc-400">
                            {bookmarkList.item_count ?? 0} saved stories
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled
                            className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-400"
                          >
                            Rename soon
                          </button>
                          <button
                            type="button"
                            disabled
                            className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-400"
                          >
                            Delete soon
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
                      No custom lists yet. Create one from any bookmark menu.
                    </p>
                  )}
                </div>
              </section>

              <section id="profile-notifications" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Notifications
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {notificationOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-500"
                    >
                      <span className="text-sm font-semibold">
                        {option}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-400">
                        Soon
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section id="profile-companies" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Companies you follow
                </h2>
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-zinc-500">
                    Followed companies coming soon
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    This will track companies from the leaderboard and company pages.
                  </p>
                </div>
              </section>

              <section id="profile-security" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Account security
                </h2>
                <div className="mt-4 space-y-3">
                  {securityActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled
                      className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-semibold text-zinc-400"
                    >
                      {action}
                      <span>Coming soon</span>
                    </button>
                  ))}
                </div>
              </section>

              {message && (
                <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
                  {message}
                </p>
              )}
              {errorMessage && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="group flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white shadow-sm hover:bg-zinc-950 disabled:cursor-wait disabled:bg-zinc-200 disabled:text-zinc-400"
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
