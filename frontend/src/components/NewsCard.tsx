"use client";

import type { NewsItem } from "@/types/news";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getBookmarkLists,
  removeNewsBookmark,
  saveNewsBookmark,
  type BookmarkList,
} from "@/lib/api";

interface NewsCardProps {
  item: NewsItem;
  index?: number;
  variant?: "grid" | "list";
  showBookmarkControl?: boolean;
  requiresSignIn?: boolean;
  onBookmarkChange?: (newsId: string, isBookmarked: boolean) => void;
}

const labels: Record<string, string> = {};

function BookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d="M7.5 3.75h9A2.5 2.5 0 0 1 19 6.25v14l-7-4.1-7 4.1v-14a2.5 2.5 0 0 1 2.5-2.5Z" />
    </svg>
  );
}

export default function NewsCard({
  item,
  index = 0,
  variant = "grid",
  showBookmarkControl = false,
  requiresSignIn = false,
  onBookmarkChange,
}: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(Boolean(item.is_bookmarked));
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [bookmarkError, setBookmarkError] = useState("");
  const [isSavePanelOpen, setIsSavePanelOpen] = useState(false);
  const [isSignInPromptOpen, setIsSignInPromptOpen] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isCreateListSuccess, setIsCreateListSuccess] = useState(false);
  const [bookmarkLists, setBookmarkLists] = useState<BookmarkList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const publishedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(item.published_at));

  const primaryCategory = item.primary_topic ?? item.categories[0];

  const category =
    labels[primaryCategory] ?? primaryCategory ?? "Research";

  const accentColors = [
    "#3b82f6",
    "#22d3ee",
    "#818cf8",
    "#60a5fa",
  ];

  const accent = accentColors[index % accentColors.length];

  const detailUrl = `/news/${encodeURIComponent(item.id)}`;
  const sourceUrl = item.source_url ?? "#";
  const sourceName = item.source_name ?? "Source";
  const isList = variant === "list";

  useEffect(() => {
    if (!isCreateListModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateListModalOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateListModalOpen]);

  async function loadBookmarkLists() {
    if (bookmarkLists.length > 0 || isLoadingLists) {
      return;
    }

    try {
      setIsLoadingLists(true);
      const data = await getBookmarkLists();
      setBookmarkLists(data.items);
    } catch (error) {
      console.error(error);
      setBookmarkError("Unable to load lists");
    } finally {
      setIsLoadingLists(false);
    }
  }

  function showSavedAnimation() {
    setJustSaved(true);
    window.setTimeout(() => {
      setJustSaved(false);
    }, 650);
  }

  function wait(milliseconds: number) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  async function saveBookmark(options?: {
    listId?: number;
    listName?: string;
  }) {
    if (isBookmarking) {
      return;
    }

    setIsBookmarking(true);
    setBookmarkError("");

    try {
      await saveNewsBookmark(item.id, options);
      setIsBookmarked(true);
      onBookmarkChange?.(item.id, true);
      showSavedAnimation();

      if (options?.listName) {
        setBookmarkLists([]);
        setIsCreateListSuccess(true);
        await wait(1300);
        setIsCreateListModalOpen(false);
        setIsCreateListSuccess(false);
      } else {
        setIsSavePanelOpen(false);
      }

      setNewListName("");
    } catch (error) {
      console.error(error);
      setBookmarkError("Unable to update saved news");
      setIsCreateListSuccess(false);
    } finally {
      setIsBookmarking(false);
    }
  }

  async function removeBookmark() {
    if (isBookmarking) {
      return;
    }

    setIsBookmarking(true);
    setBookmarkError("");

    try {
      await removeNewsBookmark(item.id);
      setIsBookmarked(false);
      onBookmarkChange?.(item.id, false);
    } catch (error) {
      console.error(error);
      setBookmarkError("Unable to update saved news");
    } finally {
      setIsBookmarking(false);
    }
  }

  function handleBookmarkClick() {
    if (requiresSignIn) {
      setIsSignInPromptOpen((isOpen) => !isOpen);
      setIsSavePanelOpen(false);
      return;
    }

    if (isBookmarked) {
      void removeBookmark();
      return;
    }

    setIsSavePanelOpen((isOpen) => !isOpen);
    void loadBookmarkLists();
  }

  function renderBookmarkControl() {
    if (!showBookmarkControl) {
      return null;
    }

    return (
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsSavePanelOpen(false);
            setIsSignInPromptOpen(false);
          }
        }}
      >
        <button
          type="button"
          aria-label={
            requiresSignIn
              ? "Sign in to save news"
              : isBookmarked
                ? "Remove saved news"
                : "Save news"
          }
          aria-pressed={isBookmarked}
          aria-disabled={requiresSignIn}
          disabled={isBookmarking}
          onClick={handleBookmarkClick}
          className={`relative grid h-8 w-8 shrink-0 place-items-center font-mono text-base leading-none transition-transform duration-200 ease-out hover:scale-150 active:scale-95 disabled:cursor-wait ${
            requiresSignIn
              ? "cursor-not-allowed text-zinc-700 hover:text-zinc-500"
              : isBookmarked
              ? "cursor-pointer text-[#93c5fd]"
              : "cursor-pointer text-zinc-400"
          }`}
        >
          {justSaved && (
            <span
              aria-hidden="true"
              className="absolute h-8 w-8 rounded-full border border-sky-300/50 bg-sky-300/15 blur-[1px] animate-ping"
            />
          )}
          <span className="relative z-10">
            <BookmarkIcon />
          </span>
        </button>

        {isSignInPromptOpen && (
          <div className="absolute bottom-10 right-0 z-[80] w-64 border border-zinc-700 bg-[#050505] p-3 shadow-2xl shadow-black/70">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Sign in required
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Sign in to save stories to your bookmark lists.
            </p>
          </div>
        )}

        {isSavePanelOpen && (
          <div className="absolute bottom-10 right-0 z-[80] w-72 border border-zinc-700 bg-[#050505] p-3 shadow-2xl shadow-black/70">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Save to list
            </p>

            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
              <button
                type="button"
                disabled={isBookmarking}
                onClick={() => void saveBookmark()}
                className="flex h-9 w-full items-center justify-between border border-zinc-800 px-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-300 hover:border-sky-400/60 hover:bg-sky-400/10 disabled:cursor-wait"
              >
                Saved news
                <span className="text-sky-300">+</span>
              </button>

              {isLoadingLists ? (
                <p className="px-1 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600">
                  Loading lists...
                </p>
              ) : (
                bookmarkLists.map((bookmarkList) => (
                  <button
                    key={bookmarkList.id}
                    type="button"
                    disabled={isBookmarking}
                    onClick={() =>
                      void saveBookmark({
                        listId: bookmarkList.id,
                      })
                    }
                    className="flex h-9 w-full items-center justify-between px-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-wait"
                  >
                    <span className="truncate">{bookmarkList.name}</span>
                    <span className="text-zinc-700">
                      {bookmarkList.item_count ?? 0}
                    </span>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={isBookmarking}
              onClick={() => {
                setBookmarkError("");
                setNewListName("");
                setIsCreateListSuccess(false);
                setIsSavePanelOpen(false);
                setIsCreateListModalOpen(true);
              }}
              className="mt-3 flex h-10 w-full items-center justify-between border border-zinc-800 px-3 text-left font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400 hover:border-sky-400/60 hover:bg-sky-400/10 hover:text-sky-200 disabled:cursor-wait"
            >
              Create new list
              <span className="text-sky-300">+</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const createListModal =
    isCreateListModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            aria-modal="true"
            role="dialog"
            aria-labelledby={`create-bookmark-list-${item.id}`}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-[3px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsCreateListModalOpen(false);
              }
            }}
          >
            <div className="relative w-full max-w-[440px] rounded-2xl border border-zinc-800 bg-[#070707] px-8 py-8 text-zinc-100 shadow-2xl shadow-black/60 sm:px-10">
              <button
                type="button"
                aria-label="Close create list dialog"
                onClick={() => setIsCreateListModalOpen(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full font-mono text-2xl leading-none text-zinc-500 hover:bg-zinc-900 hover:text-white"
              >
                ×
              </button>

              <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                Bookmark list
              </p>
              <h2
                id={`create-bookmark-list-${item.id}`}
                className="pr-8 text-2xl font-medium tracking-[-0.035em] text-white sm:text-3xl"
              >
                Create new list
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Name the list, then this story will be saved there.
              </p>

              <form
                className="mt-7 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const listName = newListName.trim();

                  if (!listName) {
                    setBookmarkError("Name the list first");
                    return;
                  }

                  void saveBookmark({
                    listName,
                  });
                }}
              >
                <label className="sr-only" htmlFor={`bookmark-list-${item.id}`}>
                  New list name
                </label>
                <input
                  id={`bookmark-list-${item.id}`}
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder="LIST NAME"
                  className="h-14 w-full rounded-md border border-zinc-800 bg-[#0b0b0b] px-4 font-mono text-[12px] uppercase tracking-[0.12em] text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-zinc-500"
                />

                {bookmarkError && (
                  <p className="border border-red-900/80 bg-red-950/50 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-red-100">
                    {bookmarkError}
                  </p>
                )}

                {isCreateListSuccess && (
                  <p className="border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-sky-100 animate-[auth-success-pop_420ms_ease-out_both]">
                    List created and story saved
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isBookmarking || isCreateListSuccess}
                  className="group flex h-12 w-full items-center justify-center overflow-hidden rounded-md bg-zinc-100 px-5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-black hover:bg-white focus-visible:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  {isCreateListSuccess ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="mr-3 grid h-5 w-5 place-items-center rounded-full border-2 border-zinc-400 text-[11px] leading-none text-zinc-200"
                      >
                        ✓
                      </span>
                      <span>Saved</span>
                    </>
                  ) : isBookmarking ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="mr-3 h-4 w-4 rounded-full border-2 border-zinc-500 border-t-black animate-spin"
                      />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span className="transition-transform duration-200 group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
                        Create and save
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
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
    <article
      className={`group border border-zinc-800 bg-[#0a0a0a] transition hover:relative hover:z-10 hover:border-zinc-600 ${
        isList
          ? "grid md:grid-cols-[280px_minmax(0,1fr)]"
          : "flex min-h-[510px] flex-col"
      }`}
    >
      <Link
        href={detailUrl}
        aria-label={`Open ${item.title}`}
        className={`news-preview block h-44 overflow-hidden border border-zinc-700 bg-[#e9e8e3] p-4 text-zinc-950 transition group-hover:border-zinc-500 ${
          isList ? "m-4 md:h-[calc(100%-2rem)]" : "m-4 mb-0"
        }`}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full p-4">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-400 pb-2 font-mono text-[7px] uppercase tracking-wider">
              <span>
                AtlasCore / {String(index + 1).padStart(2, "0")}
              </span>

              <span>{primaryCategory ?? "News"}</span>
            </div>

            <p className="line-clamp-2 max-w-[90%] font-serif text-base font-bold leading-tight">
              {item.title}
            </p>

            <div
              className="mt-5 flex h-12 items-end gap-1"
              aria-hidden="true"
            >
              {[38, 64, 48, 82, 56, 70, 44, 76, 52, 68, 34, 58].map(
                (height, barIndex) => (
                  <span
                    key={barIndex}
                    className="flex-1"
                    style={{
                      height: `${height}%`,
                      backgroundColor:
                        barIndex % 3 === 0 ? accent : "#202020",
                    }}
                  />
                )
              )}
            </div>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex min-h-4 items-start">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            <span style={{ color: accent }}>■</span>
            <span className="ml-2">{category}</span>
          </p>
        </div>

        {bookmarkError && (
          <p className="-mt-2 mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-red-300">
            {bookmarkError}
          </p>
        )}

        <h3
          className={`relative pr-8 font-medium leading-snug tracking-[-0.02em] text-zinc-100 decoration-[#3b82f6] underline-offset-4 ${
            isList ? "line-clamp-2 text-xl" : "line-clamp-3 text-lg"
          }`}
        >
          <Link href={detailUrl} className="hover:underline focus-visible:underline">
            {item.title}
          </Link>

          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 translate-y-0.5 font-mono text-2xl leading-none text-zinc-100 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            ↗
          </span>
        </h3>

        <p
          className={`mt-3 text-xs leading-5 text-zinc-500 ${
            isList ? "line-clamp-2" : "line-clamp-3"
          }`}
        >
          {item.summary}
        </p>

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">
            <span>{publishedDate}</span>

            <div className="flex items-center gap-3">
              {renderBookmarkControl()}

              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-zinc-700 px-2 py-1 hover:border-[#3b82f6] hover:text-white"
              >
                {sourceName} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>

    {createListModal}
    </>
  );
}
