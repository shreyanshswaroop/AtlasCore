"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Newsreader } from "next/font/google";

import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import {
  getBookmarkLists,
  getBookmarkedNews,
  getCurrentUser,
  type AuthUser,
  type BookmarkList,
} from "@/lib/api";
import type { NewsItem } from "@/types/news";

const minimumSkeletonDuration = 700;
const headlineSerif = Newsreader({
  subsets: ["latin"],
  weight: ["300"],
});

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function BookmarkSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="grid border border-zinc-800 bg-[#050505] md:grid-cols-[280px_minmax(0,1fr)]"
    >
      <div className="skeleton-shimmer m-4 h-44 md:h-[calc(100%-2rem)]" />
      <div className="flex min-h-[220px] flex-1 flex-col p-5">
        <div className="skeleton-shimmer h-3.5 w-28" />
        <div className="mt-7 space-y-3">
          <div className="skeleton-shimmer h-4 w-[90%]" />
          <div className="skeleton-shimmer h-4 w-[70%]" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-8">
          <div className="skeleton-shimmer h-3 w-20" />
          <div className="skeleton-shimmer h-7 w-24" />
        </div>
      </div>
    </article>
  );
}

function BookmarkListIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M7.5 3.75h9A2.5 2.5 0 0 1 19 6.25v14l-7-4.1-7 4.1v-14a2.5 2.5 0 0 1 2.5-2.5Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function BookmarksPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [bookmarkLists, setBookmarkLists] = useState<BookmarkList[]>([]);
  const [activeListId, setActiveListId] = useState<number | undefined>();
  const [savedCount, setSavedCount] = useState(0);
  const [totalSavedCount, setTotalSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const activeListName = useMemo(() => {
    if (activeListId === undefined) {
      return "All saved";
    }

    return (
      bookmarkLists.find((bookmarkList) => bookmarkList.id === activeListId)
        ?.name ?? "Saved list"
    );
  }, [activeListId, bookmarkLists]);

  useEffect(() => {
    let isCurrent = true;

    async function loadBookmarks() {
      try {
        setIsLoading(true);
        const [currentUser, bookmarkData, listData] = await Promise.all([
          getCurrentUser(),
          getBookmarkedNews(24, 0, activeListId),
          getBookmarkLists(),
          wait(minimumSkeletonDuration),
        ]);

        if (!isCurrent) {
          return;
        }

        setUser(currentUser);
        setItems(bookmarkData.items);
        setSavedCount(bookmarkData.count);
        if (activeListId === undefined) {
          setTotalSavedCount(bookmarkData.count);
        }
        setBookmarkLists(listData.items);
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          setErrorMessage("Unable to load saved news.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadBookmarks();

    return () => {
      isCurrent = false;
    };
  }, [activeListId]);

  function handleBookmarkChange(newsId: string, isBookmarked: boolean) {
    if (isBookmarked) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === newsId
            ? {
                ...item,
                is_bookmarked: true,
              }
            : item
        )
      );
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== newsId)
    );
    setSavedCount((currentCount) => Math.max(currentCount - 1, 0));
    setTotalSavedCount((currentCount) => Math.max(currentCount - 1, 0));
    setBookmarkLists((currentLists) =>
      currentLists.map((bookmarkList) =>
        bookmarkList.id === activeListId
          ? {
              ...bookmarkList,
              item_count: Math.max((bookmarkList.item_count ?? 1) - 1, 0),
            }
          : bookmarkList
      )
    );
  }

  return (
    <main className="site-background min-h-screen text-zinc-100">
      <Navbar />

      <section>
        <div className="mx-auto max-w-[1500px] px-5 pb-8 pt-14 sm:px-8 sm:pb-10 sm:pt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h1
              className={`${headlineSerif.className} max-w-4xl text-4xl font-light leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4.25rem]`}
            >
              Bookmarks
            </h1>

            <p className="max-w-md text-sm leading-6 text-zinc-400 lg:text-right">
              Read your saved AI news by list. Pick a saved list, then continue
              through the stories in the same list view as the main feed.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-8">

        {errorMessage && (
          <div className="mb-8 border border-red-900 bg-red-950/30 px-5 py-4 font-mono text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {!user && !isLoading ? (
          <div className="border border-zinc-800 bg-[#080808] px-6 py-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
              Sign in required
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex border border-zinc-700 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              Back to news
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <p className="mb-4 font-mono text-xs font-normal uppercase tracking-[0.11em] text-zinc-600">
                Lists
              </p>

              <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5 lg:overflow-x-hidden lg:pb-0 lg:pr-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setActiveListId(undefined)}
                  className={`group flex min-w-max items-center justify-between gap-3 border px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-[0.11em] lg:w-full lg:min-w-0 ${
                    activeListId === undefined
                      ? "border-zinc-700 bg-zinc-900 text-white"
                      : "border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-100"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 border ${
                        activeListId === undefined
                          ? "border-[#3b82f6] bg-[#3b82f6]"
                          : "border-zinc-700"
                      }`}
                    />
                    <span className="grid h-5 w-5 shrink-0 place-items-center text-zinc-300 group-hover:text-white">
                      <BookmarkListIcon />
                    </span>
                    <span className="truncate text-zinc-200 group-hover:text-white">
                      All saved
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-zinc-100">
                    <span>{totalSavedCount}</span>
                  </span>
                </button>

                {bookmarkLists.map((bookmarkList) => {
                  const isActive = activeListId === bookmarkList.id;

                  return (
                    <button
                      key={bookmarkList.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setActiveListId(bookmarkList.id)}
                      className={`group flex min-w-max items-center justify-between gap-3 border px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-[0.11em] lg:w-full lg:min-w-0 ${
                        isActive
                          ? "border-zinc-700 bg-zinc-900 text-white"
                          : "border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-100"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`h-1.5 w-1.5 border ${
                            isActive
                              ? "border-[#3b82f6] bg-[#3b82f6]"
                              : "border-zinc-700"
                          }`}
                        />
                        <span className="grid h-5 w-5 shrink-0 place-items-center text-zinc-300 group-hover:text-white">
                          <BookmarkListIcon />
                        </span>
                        <span className="truncate text-zinc-200 group-hover:text-white">
                          {bookmarkList.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-zinc-100">
                        <span>{bookmarkList.item_count ?? 0}</span>
                        <ChevronIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-zinc-300">
                  Saved in &quot;{activeListName}&quot;
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                  {savedCount} {savedCount === 1 ? "story" : "stories"}
                </span>
              </div>

              {isLoading ? (
                <div
                  role="status"
                  aria-label="Loading saved news"
                  className="grid gap-3"
                >
                  <span className="sr-only">Loading saved news</span>
                  {["a", "b", "c"].map((card) => (
                    <BookmarkSkeleton key={card} />
                  ))}
                </div>
              ) : items.length > 0 ? (
                <div className="news-layout-enter grid gap-3">
                  {items.map((item, index) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      index={index}
                      variant="list"
                      showBookmarkControl
                      onBookmarkChange={handleBookmarkChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-zinc-800 px-6 py-20 text-center">
                  <h2 className="text-2xl text-white">No saved news yet</h2>
                  <p className="mt-3 text-sm text-zinc-500">
                    Save stories from the news feed and they will show up here.
                  </p>
                  <Link
                    href="/#discover"
                    className="mt-6 inline-flex border border-[#3b82f6] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#93c5fd] hover:bg-[#3b82f6] hover:text-black"
                  >
                    Browse news
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
