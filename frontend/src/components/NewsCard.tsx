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
  const category = primaryCategory?.replaceAll("_", " ") ?? "AI";

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
              ? "cursor-not-allowed text-zinc-300 hover:text-zinc-400"
              : isBookmarked
              ? "cursor-pointer text-zinc-950"
              : "cursor-pointer text-zinc-400"
          }`}
        >
          {justSaved && (
            <span
              aria-hidden="true"
              className="absolute h-8 w-8 rounded-full border border-zinc-300/50 bg-zinc-300/15 blur-[1px] animate-ping"
            />
          )}
          <span className="relative z-10">
            <BookmarkIcon />
          </span>
        </button>

        {isSignInPromptOpen && (
          <div className="absolute bottom-10 right-0 z-[80] w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-950/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Sign in required
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Sign in to save stories to your bookmark lists.
            </p>
          </div>
        )}

        {isSavePanelOpen && (
          <div className="absolute bottom-10 right-0 z-[80] w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-950/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Save to list
            </p>

            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
              <button
                type="button"
                disabled={isBookmarking}
                onClick={() => void saveBookmark()}
                className="flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 px-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-wait"
              >
                Saved news
                <span className="text-zinc-950">+</span>
              </button>

              {isLoadingLists ? (
                <p className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
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
                    className="flex h-9 w-full items-center justify-between rounded-lg px-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-wait"
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
              className="mt-3 flex h-10 w-full items-center justify-between rounded-lg border border-zinc-200 px-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800 disabled:cursor-wait"
            >
              Create new list
              <span className="text-zinc-950">+</span>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 px-4 py-6 backdrop-blur-[3px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsCreateListModalOpen(false);
              }
            }}
          >
            <div className="relative w-full max-w-[440px] rounded-2xl border border-zinc-200 bg-white px-8 py-8 text-zinc-950 shadow-2xl shadow-zinc-950/20 sm:px-10">
              <button
                type="button"
                aria-label="Close create list dialog"
                onClick={() => setIsCreateListModalOpen(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-2xl leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
              >
                ×
              </button>

              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Bookmark list
              </p>
              <h2
                id={`create-bookmark-list-${item.id}`}
                className="pr-8 text-2xl font-semibold text-zinc-950 sm:text-3xl"
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
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:bg-white"
                />

                {bookmarkError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-red-700">
                    {bookmarkError}
                  </p>
                )}

                {isCreateListSuccess && (
                  <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-800 animate-[auth-success-pop_420ms_ease-out_both]">
                    List created and story saved
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isBookmarking || isCreateListSuccess}
                  className="group flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 px-5 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-zinc-950 focus-visible:bg-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
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
      className={`group w-full overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow duration-300 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-950/10 ${
        isList
          ? "grid md:grid-cols-[280px_minmax(0,1fr)]"
          : "flex h-[342px] max-w-[425px] flex-col justify-self-center"
      }`}
    >
      <Link
        href={detailUrl}
        aria-label={`Open ${item.title}`}
        className={`news-preview relative block h-[168px] shrink-0 overflow-hidden bg-[#eef1f6] text-zinc-950 ${
          isList ? "md:h-full" : ""
        }`}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="h-full p-4 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-300 pb-2 text-[7px] font-bold uppercase tracking-wider">
              <span>
                AtlasCore / {String(index + 1).padStart(2, "0")}
              </span>

              <span>{sourceName}</span>
            </div>

            <p className="line-clamp-2 max-w-[90%] font-serif text-base font-bold leading-tight">
              {item.title}
            </p>

            <div
              className="mt-6 flex h-10 items-end gap-1"
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
        <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-zinc-950/95 px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm">
          {category}
        </span>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
        {bookmarkError && (
          <p className="-mt-2 mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-red-600">
            {bookmarkError}
          </p>
        )}

        <h3
          className={`relative pr-8 font-semibold leading-snug text-zinc-950 decoration-zinc-950 underline-offset-4 ${
            isList ? "line-clamp-2 text-lg" : "line-clamp-2 text-lg"
          }`}
        >
          <Link href={detailUrl} className="hover:underline focus-visible:underline">
            {item.title}
          </Link>

          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 translate-y-0.5 text-2xl leading-none text-zinc-950 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            ↗
          </span>
        </h3>

        <p
          className={`mt-2 text-sm leading-5 text-zinc-500 ${
            isList ? "line-clamp-2" : "line-clamp-2"
          }`}
        >
          {item.summary}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>{publishedDate}</span>

            <div className="flex items-center gap-3">
              {renderBookmarkControl()}

              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
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
