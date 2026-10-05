"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function BookmarkSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="grid overflow-hidden border-b border-[#242424] md:grid-cols-[240px_minmax(0,1fr)]"
    >
      <div className="skeleton-shimmer h-40" />
      <div className="flex min-h-[160px] flex-1 flex-col p-5">
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

      <section className="mx-auto max-w-[1500px] px-5 pb-10 pt-9 sm:px-8 sm:pb-16 sm:pt-12">
        <div className="mb-9 border-b border-[#242424] pb-6">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-zinc-100">
            Bookmarks
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your saved stories, organized by list.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-8 rounded-none border border-red-900 bg-red-950/40 px-5 py-4 text-sm font-semibold text-red-300">
            {errorMessage}
          </div>
        )}

        {!user && !isLoading ? (
          <div className="rounded-none border border-[#292929] bg-[#0e0e0e] px-6 py-16 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
              Sign in required
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-none border border-[#292929] bg-[#0e0e0e] px-5 py-3 text-sm font-semibold text-zinc-400 shadow-sm hover:border-[#444444] hover:text-zinc-100"
            >
              Back to news
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-100">
                Lists
              </p>

              <nav aria-label="Bookmark lists" className="flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-x-hidden">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setActiveListId(undefined)}
                  className={`group flex min-w-max items-center justify-between gap-3 border-l-2 px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] lg:w-full lg:min-w-0 ${
                    activeListId === undefined
                      ? "border-violet-500 bg-[#111111] text-white"
                      : "border-transparent text-zinc-400 hover:bg-[#0e0e0e] hover:text-zinc-100"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={activeListId === undefined ? "grid h-5 w-5 shrink-0 place-items-center text-white" : "grid h-5 w-5 shrink-0 place-items-center text-zinc-400 group-hover:text-zinc-100"}>
                      <BookmarkListIcon />
                    </span>
                    <span className="truncate">
                      All saved
                    </span>
                  </span>
                  <span className={activeListId === undefined ? "flex shrink-0 items-center gap-2 text-sm font-bold text-white/90" : "flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-zinc-300"}>
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
                      className={`group flex min-w-max items-center justify-between gap-3 border-l-2 px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] lg:w-full lg:min-w-0 ${
                        isActive
                          ? "border-violet-500 bg-[#111111] text-white"
                          : "border-transparent text-zinc-400 hover:bg-[#0e0e0e] hover:text-zinc-100"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className={isActive ? "grid h-5 w-5 shrink-0 place-items-center text-white" : "grid h-5 w-5 shrink-0 place-items-center text-zinc-400 group-hover:text-zinc-100"}>
                          <BookmarkListIcon />
                        </span>
                        <span className="truncate">
                          {bookmarkList.name}
                        </span>
                      </span>
                      <span className={isActive ? "flex shrink-0 items-center gap-2 text-sm font-bold text-white/90" : "flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-zinc-300"}>
                        <span>{bookmarkList.item_count ?? 0}</span>
                        <ChevronIcon />
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-sm font-semibold text-zinc-400">
                  Saved in &quot;{activeListName}&quot;
                </h2>
                <span className="text-sm font-semibold text-zinc-400">
                  {savedCount} {savedCount === 1 ? "story" : "stories"}
                </span>
              </div>

              {isLoading ? (
                <div
                  role="status"
                  aria-label="Loading saved news"
                  className="grid gap-4"
                >
                  <span className="sr-only">Loading saved news</span>
                  {["a", "b", "c"].map((card) => (
                    <BookmarkSkeleton key={card} />
                  ))}
                </div>
              ) : items.length > 0 ? (
                <div className="news-layout-enter grid gap-4">
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
                <div className="rounded-none border border-dashed border-[#444444] bg-[#0e0e0e] px-6 py-20 text-center">
                  <h2 className="text-2xl font-semibold text-zinc-100">No saved news yet</h2>
                  <p className="mt-3 text-sm text-zinc-400">
                    Save stories from the news feed and they will show up here.
                  </p>
                  <Link
                    href="/#discover"
                    className="mt-6 inline-flex rounded-none bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-950"
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
