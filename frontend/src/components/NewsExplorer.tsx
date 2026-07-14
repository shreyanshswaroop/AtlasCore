"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getNews, getNewsCounts } from "@/lib/api";
import type { CompanyLeaderboardItem } from "@/types/company";
import type { NewsItem } from "@/types/news";
import CategoryFilters, {
  categories,
  type CategoryFilter,
} from "./CategoryFilters";
import NewsCard from "./NewsCard";

interface NewsExplorerProps {
  initialItems: NewsItem[];
  initialQuery: string;
  initialTotalCount: number;
  initialView?: ExplorerView;
  initialLeaderboardItems: CompanyLeaderboardItem[];
}

type ExplorerView = "news" | "leaderboard";

const skeletonCards = ["a", "b", "c", "d", "e", "f"];
const leaderboardSkeletonRows = [
  "openai",
  "anthropic",
  "google",
  "microsoft",
  "meta",
  "nvidia",
  "github",
  "hugging-face",
  "mistral",
  "xai",
];
const minimumSkeletonDuration = 900;
const minimumLoadMoreDuration = 2500;
const itemsPerPage = 12;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getCompanyInitials(company: string) {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NewsCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex min-h-[510px] flex-col border border-zinc-800 bg-[#050505]"
    >
      <div className="skeleton-shimmer m-5 mb-0 h-48" />

      <div className="flex flex-1 flex-col px-5 py-7">
        <div className="flex items-center gap-3">
          <span className="skeleton-shimmer h-4 w-4" />
          <span className="skeleton-shimmer h-3.5 w-36" />
        </div>

        <div className="mt-7 space-y-3">
          <div className="skeleton-shimmer h-4 w-[92%]" />
          <div className="skeleton-shimmer h-4 w-[72%]" />
        </div>

        <div className="mt-auto flex gap-4 pt-8">
          <div className="skeleton-shimmer h-3.5 w-20" />
          <div className="skeleton-shimmer h-3.5 w-32" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-5">
        <div className="skeleton-shimmer h-8 w-24" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-8 w-12" />
          <div className="skeleton-shimmer h-8 w-8" />
        </div>
      </div>
    </article>
  );
}

function LeaderboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading company leaderboard"
      className="border border-zinc-800"
    >
      <span className="sr-only">Loading company leaderboard</span>

      <div className="grid grid-cols-[70px_minmax(0,1fr)] border-b border-zinc-800 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]">
        <span>Rank</span>
        <span>Company</span>
        <span className="hidden sm:block">Products</span>
      </div>

      {leaderboardSkeletonRows.map((row, index) => (
        <div
          key={row}
          className="grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center border-b border-zinc-900 px-4 py-3 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]"
        >
          <span className="skeleton-shimmer h-4 w-9" />

          <div className="flex min-w-0 items-center gap-3">
            <span className="skeleton-shimmer h-9 w-9 shrink-0" />
            <span
              className="skeleton-shimmer h-4"
              style={{
                width: `${Math.max(120, 220 - index * 8)}px`,
              }}
            />
          </div>

          <span className="skeleton-shimmer hidden h-3 w-[70%] sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function NewsExplorer({
  initialItems,
  initialQuery,
  initialTotalCount,
  initialView = "news",
  initialLeaderboardItems,
}: NewsExplorerProps) {
  const [activeView, setActiveView] = useState<ExplorerView>(initialView);
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const leaderboardItems = initialLeaderboardItems;
  const [totalResultCount, setTotalResultCount] = useState(initialTotalCount);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    ALL: initialTotalCount,
  });
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState(
    initialView === "leaderboard" ? "ALL" : initialQuery
  );
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | undefined>();
  const [activeTopic, setActiveTopic] = useState<string | undefined>();
  const [nextOffset, setNextOffset] = useState(initialItems.length);
  const [hasMoreItems, setHasMoreItems] = useState(
    initialItems.length < initialTotalCount
  );
  const [showLeaderboardSkeleton, setShowLeaderboardSkeleton] = useState(
    initialView === "leaderboard"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadMoreInFlightRef = useRef(false);

  async function loadNews(
    searchQuery: string | undefined,
    displayLabel: string,
    topic?: string
  ) {
    const cleanedQuery = searchQuery?.trim();

    if (cleanedQuery !== undefined && cleanedQuery.length < 2) {
      setError("Enter at least two characters.");
      return;
    }

    try {
      setActiveView("news");
      setIsLoading(true);
      setError("");
      setSearchedQuery(displayLabel);
      const [data] = await Promise.all([
        getNews(cleanedQuery, itemsPerPage, 0, topic),
        wait(minimumSkeletonDuration),
      ]);
      setItems(data.items);
      setTotalResultCount(data.count);
      setActiveSearchQuery(cleanedQuery);
      setActiveTopic(topic);
      setNextOffset(data.items.length);
      setHasMoreItems(data.items.length < data.count);
    } catch (searchError) {
      console.error(searchError);
      setError("Unable to load news. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  const loadNextPage = useCallback(async () => {
    if (
      isLoading ||
      isLoadingMore ||
      !hasMoreItems ||
      loadMoreInFlightRef.current
    ) {
      return;
    }

    try {
      loadMoreInFlightRef.current = true;
      setIsLoadingMore(true);
      setError("");

      const [data] = await Promise.all([
        getNews(
          activeSearchQuery,
          itemsPerPage,
          nextOffset,
          activeTopic
        ),
        wait(minimumLoadMoreDuration),
      ]);

      setItems((currentItems) => {
        const existingIds = new Set(
          currentItems.map((item) => item.id)
        );
        const newItems = data.items.filter(
          (item) => !existingIds.has(item.id)
        );

        return [...currentItems, ...newItems];
      });
      setNextOffset((currentOffset) => currentOffset + data.items.length);
      setHasMoreItems(nextOffset + data.items.length < data.count);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load more news. Make sure the backend is running.");
    } finally {
      setIsLoadingMore(false);
      loadMoreInFlightRef.current = false;
    }
  }, [
    activeSearchQuery,
    activeTopic,
    hasMoreItems,
    isLoading,
    isLoadingMore,
    nextOffset,
  ]);

  useEffect(() => {
    if (!showLeaderboardSkeleton) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowLeaderboardSkeleton(false);
    }, minimumSkeletonDuration);

    return () => window.clearTimeout(timeout);
  }, [showLeaderboardSkeleton]);

  useEffect(() => {
    const topicLabels = categories
      .filter((category) => category.label !== "ALL")
      .map((category) => category.label);

    let isMounted = true;

    getNewsCounts(topicLabels)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const counts: Record<string, number> = {
          ALL: data.all,
        };

        data.queries.forEach((queryCount) => {
          counts[queryCount.query] = queryCount.count;
        });

        setCategoryCounts(counts);
      })
      .catch((countsError) => {
        console.error(countsError);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasMoreItems) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadNextPage();
        }
      },
      {
        rootMargin: "0px",
        threshold: 0.7,
      }
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [hasMoreItems, loadNextPage]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedQuery = query.trim();

    setActiveCategory(cleanedQuery ? "" : "ALL");
    await loadNews(
      cleanedQuery || undefined,
      cleanedQuery || "All news"
    );
  }

  async function handleCategoryChange(category: CategoryFilter) {
    setActiveCategory(category.label);
    setQuery(category.query ?? "");

    await loadNews(
      category.label === "ALL" ? undefined : category.query,
      category.label,
      category.label === "ALL" ? undefined : category.label
    );
  }

  function renderLeaderboard() {
    if (leaderboardItems.length === 0) {
      return (
        <div className="border border-dashed border-zinc-800 px-6 py-20 text-center">
          <h3 className="text-2xl text-white">No companies found</h3>
          <p className="mt-3 text-sm text-zinc-500">The company catalog is empty.</p>
        </div>
      );
    }

    return (
      <div className="border border-zinc-800">
        <div className="grid grid-cols-[70px_minmax(0,1fr)] border-b border-zinc-800 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]">
          <span>Rank</span>
          <span>Company</span>
          <span className="hidden sm:block">Products</span>
        </div>

        {leaderboardItems.map((item) => (
          <Link
            key={item.company}
            href={`/companies/${item.slug}`}
            className="grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center border-b border-zinc-900 px-4 py-3 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]"
          >
            <span className="font-mono text-sm text-zinc-500">
              #{item.rank}
            </span>

            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center border border-zinc-700 bg-zinc-900 font-mono text-[11px] font-bold uppercase text-white">
                {item.logo_url ? (
                  <img
                    src={item.logo_url}
                    alt=""
                    className="h-5 w-5 object-contain"
                  />
                ) : (
                  getCompanyInitials(item.company)
                )}
              </span>
              <span className="truncate text-base font-medium text-zinc-100">
                {item.company}
              </span>
            </div>

            <span className="hidden truncate font-mono text-xs uppercase tracking-[0.08em] text-zinc-500 sm:block">
              {item.aliases.slice(0, 4).join(" / ") || item.domain || "Company"}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <section id="discover" className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14">
      <form onSubmit={handleSearch} className="mb-12 ml-auto flex w-full max-w-xl border border-zinc-800 bg-[#0b0b0b] focus-within:border-zinc-600">
        <label htmlFor="news-search" className="sr-only">Search AI news</label>
        <span className="grid w-14 place-items-center border-r border-zinc-800 font-mono text-zinc-600">⌕</span>
        <input
          id="news-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SEARCH NEWS, COMPANIES, TOPICS..."
          className="min-h-14 min-w-0 flex-1 bg-transparent px-4 font-mono text-xs tracking-[0.12em] text-white outline-none placeholder:text-zinc-700"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="border-l border-[#3b82f6] bg-[#3b82f6] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black hover:bg-white disabled:opacity-50 sm:px-7"
        >
          {isLoading ? "Scanning" : "Search"}
        </button>
      </form>

      {error && <div className="mb-8 border border-red-900 bg-red-950/30 px-5 py-4 font-mono text-xs text-red-300">{error}</div>}

      <div className="grid gap-10 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">Topics / Index</p>
          <CategoryFilters activeCategory={activeCategory} counts={categoryCounts} onCategoryChange={handleCategoryChange} disabled={isLoading} />
          <div className="mt-8 hidden border-t border-zinc-800 pt-5 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-zinc-700 lg:block">
            <p>Source: AI feeds</p>
            <p>Index status: live</p>
          </div>
        </aside>

        <div className="min-w-0">
          <div id="trending" className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b82f6]">
                {activeView === "leaderboard" ? "Leaderboard" : "Last 30 days"}
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">
                {activeView === "leaderboard"
                  ? "Top companies"
                  : searchedQuery === "All news" || searchedQuery === "ALL" ? "All indexed news" : `Results for “${searchedQuery}”`}
              </h2>
            </div>
            <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
              <span>
                {activeView === "leaderboard"
                  ? `${leaderboardItems.length.toString().padStart(2, "0")} companies`
                  : isLoading
                  ? "Scanning index"
                  : `${items.length.toString().padStart(2, "0")} / ${totalResultCount} results`}
              </span>
              <span className="border-b border-[#3b82f6] pb-1 text-zinc-300">
                {activeView === "leaderboard" ? "Catalog" : "Last 30 days"}
              </span>
            </div>
          </div>

          {activeView === "leaderboard" ? (
            showLeaderboardSkeleton ? <LeaderboardSkeleton /> : renderLeaderboard()
          ) : isLoading ? (
            <div
              role="status"
              aria-label={`Loading news for ${searchedQuery}`}
              className="grid md:grid-cols-2 xl:grid-cols-3"
            >
              <span className="sr-only">Loading AI news</span>
              {skeletonCards.map((card) => (
                <NewsCardSkeleton key={card} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3">
                {items.map((item, index) => <NewsCard key={item.id} item={item} index={index} />)}
              </div>

              <div ref={loadMoreRef} className="flex justify-center py-8">
                {hasMoreItems ? (
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={loadNextPage}
                    className={`border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors disabled:cursor-wait ${
                      isLoadingMore
                        ? "border-[#3b82f6] bg-[#2563eb] text-white"
                        : "border-zinc-800 bg-[#0b0b0b] text-zinc-400 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {isLoadingMore ? "Loading..." : "Load next 12"}
                  </button>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-700">
                    End of index
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="border border-dashed border-zinc-800 px-6 py-20 text-center">
              <h3 className="text-2xl text-white">No news found</h3>
              <p className="mt-3 text-sm text-zinc-500">Try a broader topic such as agents, LLMs, or infrastructure.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
