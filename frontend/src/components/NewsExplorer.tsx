"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
type NewsLayout = "grid" | "list";

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
      className=""
    >
      <span className="sr-only">Loading company leaderboard</span>

      <div className="faded-divider grid grid-cols-[70px_minmax(0,1fr)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]">
        <span>Rank</span>
        <span>Company</span>
        <span className="hidden sm:block">Products</span>
      </div>

      {leaderboardSkeletonRows.map((row, index) => (
        <div
          key={row}
          className="faded-divider grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center px-4 py-3 last:after:hidden sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]"
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
  const [newsLayout, setNewsLayout] = useState<NewsLayout>("grid");
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const leaderboardItems = initialLeaderboardItems;
  const [totalResultCount, setTotalResultCount] = useState(initialTotalCount);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    ALL: initialTotalCount,
  });
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
  const [showNewsSkeleton, setShowNewsSkeleton] = useState(
    initialView === "news"
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

    if (cleanedQuery !== undefined && cleanedQuery.length < 1) {
      setError("Enter at least one character.");
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
    if (!showNewsSkeleton) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowNewsSkeleton(false);
    }, minimumSkeletonDuration);

    return () => window.clearTimeout(timeout);
  }, [showNewsSkeleton]);

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

  async function handleCategoryChange(category: CategoryFilter) {
    setActiveCategory(category.label);

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
      <div>
        <div className="faded-divider grid grid-cols-[70px_minmax(0,1fr)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]">
          <span>Rank</span>
          <span>Company</span>
          <span className="hidden sm:block">Products</span>
        </div>

        {leaderboardItems.map((item) => (
          <Link
            key={item.company}
            href={`/companies/${item.slug}`}
            className="faded-divider grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center px-4 py-3 last:after:hidden sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]"
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
    <section id="discover" className="mx-auto max-w-[1500px] px-5 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-8">
      {error && <div className="mb-8 border border-red-900 bg-red-950/30 px-5 py-4 font-mono text-xs text-red-300">{error}</div>}

      <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">Topics</p>
          <CategoryFilters
            activeCategory={activeCategory}
            counts={categoryCounts}
            onCategoryChange={handleCategoryChange}
            disabled={isLoading}
            loading={isLoading || showNewsSkeleton || showLeaderboardSkeleton}
          />
          <div className="mt-8 hidden border-t border-zinc-800 pt-5 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-zinc-700 lg:block">
            <p>Source: AI feeds</p>
            <p>Index status: live</p>
          </div>
        </aside>

        <div className="min-w-0">
          <div id="trending" className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-zinc-300">
                {activeView === "leaderboard"
                  ? "Top companies"
                  : searchedQuery === "All news" || searchedQuery === "ALL" ? "Latest" : `Results for “${searchedQuery}”`}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
              <span>
                {activeView === "leaderboard"
                  ? `${leaderboardItems.length.toString().padStart(2, "0")} companies`
                  : isLoading || showNewsSkeleton
                  ? "Scanning index"
                  : `${items.length.toString().padStart(2, "0")} / ${totalResultCount} results`}
              </span>
              <span className="border-b border-[#3b82f6] pb-1 text-zinc-300">
                {activeView === "leaderboard" ? "Catalog" : "Last 30 days"}
              </span>
              {activeView === "news" && (
                <div className="flex border border-zinc-800 bg-[#0b0b0b]">
                  {(["grid", "list"] as NewsLayout[]).map((layout) => (
                    <button
                      key={layout}
                      type="button"
                      aria-label={`Show news as ${layout}`}
                      aria-pressed={newsLayout === layout}
                      onClick={() => setNewsLayout(layout)}
                      className={`grid h-8 w-9 place-items-center transition-colors ${
                        newsLayout === layout
                          ? "bg-[#101010] text-zinc-200"
                          : "text-zinc-500 hover:text-zinc-100"
                      }`}
                    >
                      {layout === "grid" ? (
                        <span className="grid h-3.5 w-3.5 grid-cols-2 gap-0.5" aria-hidden="true">
                          <span className="border border-current" />
                          <span className="border border-current" />
                          <span className="border border-current" />
                          <span className="border border-current" />
                        </span>
                      ) : (
                        <span className="grid w-4 gap-1" aria-hidden="true">
                          <span className="h-px bg-current" />
                          <span className="h-px bg-current" />
                          <span className="h-px bg-current" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeView === "leaderboard" ? (
            showLeaderboardSkeleton ? <LeaderboardSkeleton /> : renderLeaderboard()
          ) : isLoading || showNewsSkeleton ? (
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
              <div
                key={newsLayout}
                className={
                  newsLayout === "grid"
                    ? "news-layout-enter grid md:grid-cols-2 xl:grid-cols-3"
                    : "news-layout-enter grid gap-3"
                }
              >
                {items.map((item, index) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    index={index}
                    variant={newsLayout}
                  />
                ))}
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
