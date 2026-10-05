"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/api";
import type { NewsSyncStatus } from "@/types/news";
import { categories, type CategoryFilter } from "./CategoryFilters";

const footerLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Submit News", href: "/submit-news" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface SiteFooterProps {
  initialSyncStatus?: NewsSyncStatus | null;
}

function formatLastSyncAt(syncStatus: NewsSyncStatus | null | undefined) {
  const syncTime =
    syncStatus?.last_sync?.finished_at ?? syncStatus?.last_sync?.started_at;

  if (!syncTime) {
    return "";
  }

  const date = new Date(syncTime);
  const indiaTime = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const day = String(indiaTime.getUTCDate()).padStart(2, "0");
  const month = monthLabels[indiaTime.getUTCMonth()];
  const hour24 = indiaTime.getUTCHours();
  const hour12 = hour24 % 12 || 12;
  const minutes = String(indiaTime.getUTCMinutes()).padStart(2, "0");
  const meridiem = hour24 >= 12 ? "PM" : "AM";

  return `${day} ${month}, ${hour12}:${minutes} ${meridiem}`;
}

function getSyncStatusLabel(syncStatus: NewsSyncStatus | null | undefined) {
  const formattedLastSyncAt = formatLastSyncAt(syncStatus);

  if (syncStatus?.is_running || syncStatus?.status === "running") {
    return "Sync running";
  }

  if (syncStatus?.last_sync?.status === "failed") {
    return formattedLastSyncAt
      ? `Last sync failed: ${formattedLastSyncAt}`
      : "Last sync failed";
  }

  if (formattedLastSyncAt) {
    return `Last updated: ${formattedLastSyncAt}`;
  }

  if (syncStatus === null) {
    return "Last updated unavailable";
  }

  return "Last updated: not synced this session";
}

function getFollowedCategories(preferredTopics: string[]) {
  const preferredSet = new Set(preferredTopics);

  return categories.filter(
    (category) => category.label !== "ALL" && preferredSet.has(category.label)
  );
}

function categoryHref(category: CategoryFilter) {
  return `/?topic=${encodeURIComponent(category.label)}#discover`;
}

export default function SiteFooter({ initialSyncStatus }: SiteFooterProps) {
  const syncStatusLabel = getSyncStatusLabel(initialSyncStatus);
  const [followedCategories, setFollowedCategories] = useState<
    CategoryFilter[]
  >([]);
  const [hasLoadedUser, setHasLoadedUser] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadFollowedTopics() {
      try {
        const user = await getCurrentUser();

        if (!isCurrent) {
          return;
        }

        setFollowedCategories(
          user ? getFollowedCategories(user.preferred_topics) : []
        );
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          setFollowedCategories([]);
        }
      } finally {
        if (isCurrent) {
          setHasLoadedUser(true);
        }
      }
    }

    void loadFollowedTopics();

    function handleAuthUpdate() {
      void loadFollowedTopics();
    }

    window.addEventListener("atlascore-auth-updated", handleAuthUpdate);

    return () => {
      isCurrent = false;
      window.removeEventListener("atlascore-auth-updated", handleAuthUpdate);
    };
  }, []);

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <footer id="about" className="border-t border-[#292929] bg-zinc-950">
      <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.25fr]">
          <div>
            <Link href="/" className="inline-flex items-center text-zinc-100">
              <span className="text-xl font-bold">AtlasCore</span>
            </Link>
            <p className="mt-6 max-w-sm text-sm font-medium leading-6 text-zinc-400">
              Your focused destination for AI news, company signals, agents,
              models, infrastructure, and developer updates.
            </p>
            <div className="mt-7 flex gap-5 text-sm font-bold text-zinc-400">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-zinc-100">
                X
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="hover:text-zinc-100">
                in
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-zinc-100">
                GH
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Categories
            </h2>
            <div className="mt-5 grid gap-3">
              {followedCategories.length > 0 ? (
                followedCategories.map((category) => (
                  <Link
                    key={category.label}
                    href={categoryHref(category)}
                    className="text-sm font-medium text-zinc-400 hover:text-zinc-100"
                  >
                    {category.label.replaceAll("_", " ")}
                  </Link>
                ))
              ) : (
                <Link
                  href="/profile"
                  className="text-sm font-medium text-zinc-400 hover:text-zinc-100"
                >
                  {hasLoadedUser ? "Choose topics" : "Loading topics..."}
                </Link>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-zinc-100">About</h2>
            <div className="mt-5 grid gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-zinc-400 hover:text-zinc-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Stay Updated
            </h2>
            <p className="mt-5 max-w-sm text-sm font-medium leading-6 text-zinc-400">
              Get the latest AI news and research signals delivered to your
              inbox.
            </p>
            <form className="mt-5 space-y-3" onSubmit={handleSubscribe}>
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                className="h-11 w-full rounded-none border border-transparent bg-[#0e0e0e] px-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              />
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center rounded-none bg-zinc-950 px-4 text-sm font-bold text-white hover:bg-zinc-950"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 text-sm font-medium text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AtlasCore. All rights reserved.</p>
          <p>{syncStatusLabel}</p>
        </div>
      </div>
    </footer>
  );
}
