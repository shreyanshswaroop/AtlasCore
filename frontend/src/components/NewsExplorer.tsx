"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type AuthUser,
  getCompanyLeaderboard,
  getCurrentUser,
  getNews,
  getNewsCounts,
  getTrendingTopics,
} from "@/lib/api";
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
  initialTopic?: string;
  initialTotalCount: number;
  initialView?: ExplorerView;
}

type ExplorerView = "news" | "leaderboard";
type NewsLayout = "grid" | "list";
type NewsRankMode = "latest" | "trending";

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

function formatCompanyAliases(item: CompanyLeaderboardItem) {
  return item.aliases.slice(0, 4).join(" / ");
}

function hasCompanyAliases(item: CompanyLeaderboardItem) {
  return item.aliases.length > 0;
}

function NewsCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex min-h-[410px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white"
    >
      <div className="skeleton-shimmer h-44" />

      <div className="flex flex-1 flex-col px-5 py-6">
        <div className="flex items-center gap-3">
          <span className="skeleton-shimmer h-4 w-4" />
          <span className="skeleton-shimmer h-3.5 w-36" />
        </div>

        <div className="mt-7 space-y-3">
          <div className="skeleton-shimmer h-4 w-[92%]" />
          <div className="skeleton-shimmer h-4 w-[72%]" />
        </div>

        <div className="mt-auto pt-8" />
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-5">
        <div className="skeleton-shimmer h-8 w-24" />
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer h-5 w-4" />
          <div className="skeleton-shimmer h-8 w-12" />
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

      {leaderboardSkeletonRows.map((row, index) => (
        <div
          key={row}
          className="grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center border-b border-zinc-100 px-4 py-3 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]"
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
  initialTopic,
  initialTotalCount,
  initialView = "news",
}: NewsExplorerProps) {
  const [activeView, setActiveView] = useState<ExplorerView>(initialView);
  const [newsLayout, setNewsLayout] = useState<NewsLayout>("grid");
  const [newsRankMode, setNewsRankMode] = useState<NewsRankMode>("latest");
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const [leaderboardItems, setLeaderboardItems] = useState<
    CompanyLeaderboardItem[]
  >([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    ALL: initialTotalCount,
  });
  const [searchedQuery, setSearchedQuery] = useState(
    initialView === "leaderboard" ? "ALL" : initialTopic ?? initialQuery
  );
  const [activeCategory, setActiveCategory] = useState(initialTopic ?? "ALL");
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | undefined>(
    initialTopic || initialQuery === "All news" ? undefined : initialQuery
  );
  const [activeTopic, setActiveTopic] = useState<string | undefined>(
    initialTopic
  );
  const [selectedLeaderboardTopics, setSelectedLeaderboardTopics] = useState<
    string[]
  >([]);
  const [trendingTopic, setTrendingTopic] = useState<string | undefined>();
  const [nextOffset, setNextOffset] = useState(initialItems.length);
  const [hasMoreItems, setHasMoreItems] = useState(
    initialItems.length < initialTotalCount
  );
  const [showLeaderboardSkeleton, setShowLeaderboardSkeleton] = useState(
    initialView === "leaderboard"
  );
  const [hasLoadedLeaderboard, setHasLoadedLeaderboard] = useState(false);
  const [showNewsSkeleton, setShowNewsSkeleton] = useState(
    initialView === "news" && initialItems.length === 0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const blockPersonalizedFeedRef = useRef(false);
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
        getNews(cleanedQuery, itemsPerPage, 0, topic, "latest"),
        wait(minimumSkeletonDuration),
      ]);
      setItems(data.items);
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

  async function loadLeaderboard(topics: string[]) {
    try {
      setActiveView("leaderboard");
      setShowLeaderboardSkeleton(true);
      setError("");

      const [data] = await Promise.all([
        getCompanyLeaderboard(150, true, topics),
        wait(minimumSkeletonDuration),
      ]);

      setLeaderboardItems(data.items);
      setHasLoadedLeaderboard(true);
    } catch (leaderboardError) {
      console.error(leaderboardError);
      setError("Unable to load company leaderboard.");
    } finally {
      setShowLeaderboardSkeleton(false);
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
          activeTopic,
          "latest"
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
    if (!showNewsSkeleton) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowNewsSkeleton(false);
    }, minimumSkeletonDuration);

    return () => window.clearTimeout(timeout);
  }, [showNewsSkeleton]);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();

        if (blockPersonalizedFeedRef.current) {
          return;
        }

        setCurrentUser(user);
      } catch (authError) {
        console.error(authError);
      }
    }

    void loadUser();

    async function resetToAllTopics() {
      blockPersonalizedFeedRef.current = true;
      setCurrentUser(null);
      setActiveCategory("ALL");
      setNewsRankMode("latest");
      setTrendingTopic(undefined);
      await loadNews(undefined, "ALL");
    }

    function handleAuthUpdate(event: Event) {
      if (
        event instanceof CustomEvent &&
        event.detail?.reason === "logout"
      ) {
        void resetToAllTopics();
        return;
      }

      blockPersonalizedFeedRef.current = false;
      void loadUser();
    }

    window.addEventListener("atlascore-auth-updated", handleAuthUpdate);

    return () => {
      window.removeEventListener("atlascore-auth-updated", handleAuthUpdate);
    };
  }, []);

  function handleBookmarkChange(newsId: string, isBookmarked: boolean) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === newsId
          ? {
              ...item,
              is_bookmarked: isBookmarked,
            }
          : item
      )
    );
  }

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
    if (activeView !== "leaderboard" || hasLoadedLeaderboard) {
      return;
    }

    let isMounted = true;

    Promise.all([
      getCompanyLeaderboard(150, true, selectedLeaderboardTopics),
      wait(minimumSkeletonDuration),
    ])
      .then(([data]) => {
        if (!isMounted) {
          return;
        }

        setLeaderboardItems(data.items);
        setHasLoadedLeaderboard(true);
      })
      .catch((leaderboardError) => {
        console.error(leaderboardError);

        if (isMounted) {
          setError("Unable to load company leaderboard.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setShowLeaderboardSkeleton(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeView, hasLoadedLeaderboard, selectedLeaderboardTopics]);

  async function handleCategoryChange(category: CategoryFilter) {
    if (activeView === "leaderboard") {
      const nextTopics =
        category.label === "ALL"
          ? []
          : selectedLeaderboardTopics.includes(category.label)
            ? selectedLeaderboardTopics.filter(
                (topic) => topic !== category.label
              )
            : [...selectedLeaderboardTopics, category.label];

      setSelectedLeaderboardTopics(nextTopics);
      setActiveCategory(nextTopics.length === 0 ? "ALL" : nextTopics[0]);
      await loadLeaderboard(nextTopics);
      return;
    }

    setActiveCategory(category.label);
    setNewsRankMode("latest");
    setTrendingTopic(undefined);

    await loadNews(
      category.label === "ALL" ? undefined : category.query,
      category.label,
      category.label === "ALL" ? undefined : category.label
    );
  }

  async function handleRankModeChange(rankMode: NewsRankMode) {
    if (rankMode === newsRankMode) {
      return;
    }

    setNewsRankMode(rankMode);
    setActiveCategory("ALL");

    if (rankMode === "trending") {
      try {
        setIsLoading(true);
        setError("");
        setSearchedQuery("Trending news");

        const [trendingData] = await Promise.all([
          getTrendingTopics(1),
          wait(minimumSkeletonDuration),
        ]);
        const topTopic = trendingData.topics[0]?.topic;

        if (!topTopic) {
          setItems([]);
          setActiveSearchQuery(undefined);
          setActiveTopic(undefined);
          setTrendingTopic(undefined);
          setNextOffset(0);
          setHasMoreItems(false);
          return;
        }

        setTrendingTopic(topTopic);

        const newsData = await getNews(
          undefined,
          itemsPerPage,
          0,
          topTopic,
          "latest"
        );

        setItems(newsData.items);
        setActiveSearchQuery(undefined);
        setActiveTopic(topTopic);
        setNextOffset(newsData.items.length);
        setHasMoreItems(newsData.items.length < newsData.count);
      } catch (trendingError) {
        console.error(trendingError);
        setError("Unable to load trending news.");
      } finally {
        setIsLoading(false);
      }

      return;
    }

    setTrendingTopic(undefined);

    await loadNews(
      activeSearchQuery,
      initialQuery,
      undefined
    );
  }

  function renderLeaderboard() {
    if (leaderboardItems.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
          <h3 className="text-2xl font-semibold text-zinc-950">No companies found</h3>
          <p className="mt-3 text-sm text-zinc-500">
            {selectedLeaderboardTopics.length > 0
              ? "No companies matched the selected topics."
              : "The company catalog is empty."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {leaderboardItems.map((item) => (
          <Link
            key={item.company}
            href={`/companies/${item.slug}`}
            className="grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center border-b border-zinc-100 px-4 py-3 transition hover:bg-zinc-50 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]"
          >
            <span className="text-sm font-semibold text-zinc-400">
              #{item.rank}
            </span>

            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase text-zinc-700">
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
              <span className="truncate text-base font-semibold text-zinc-950">
                {item.company}
              </span>
            </div>

            <span className="hidden truncate text-sm text-zinc-500 sm:block">
              {hasCompanyAliases(item)
                ? formatCompanyAliases(item)
                : item.domain || "Company"}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <section id="discover" className="mx-auto max-w-[465px] px-5 pb-10 pt-8 sm:max-w-[489px] sm:px-8 sm:pb-16 sm:pt-10 md:max-w-[934px] xl:max-w-[1379px]">
      {error && <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="mb-7">
        <div className={`${activeView === "leaderboard" ? "mb-5" : ""} flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`}>
          <div>
            <h2 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
              {activeView === "leaderboard" ? "Company leaderboard" : "Latest in AI"}
            </h2>
          </div>
        </div>
        {activeView === "leaderboard" && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <CategoryFilters
              activeCategory={activeCategory}
              activeCategories={selectedLeaderboardTopics}
              counts={categoryCounts}
              onCategoryChange={handleCategoryChange}
              disabled={isLoading || showLeaderboardSkeleton}
              loading={isLoading || showNewsSkeleton}
              hideEmpty={false}
              multiSelect
            />
          </div>
        )}
      </div>

      <div className="min-w-0">
          <div id="trending" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              {activeView === "leaderboard" ? (
                <div className="grid grid-cols-[70px_minmax(0,1fr)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:grid-cols-[90px_minmax(0,1fr)_minmax(180px,360px)]">
                  <span>Rank</span>
                  <span>Company</span>
                  <span className="hidden sm:block">Products</span>
                </div>
              ) : searchedQuery === "All news" || searchedQuery === "ALL" || searchedQuery === "Trending news" ? (
                <div className="flex items-center gap-5 text-sm font-semibold">
                  {(["latest", "trending"] as NewsRankMode[]).map((rankMode) => (
                    <button
                      key={rankMode}
                      type="button"
                      disabled={isLoading}
                      onClick={() => void handleRankModeChange(rankMode)}
                      className={`pb-1 transition-colors disabled:cursor-wait ${
                        newsRankMode === rankMode
                          ? "border-b-2 border-zinc-950 text-zinc-950"
                          : "text-zinc-500 hover:text-zinc-950"
                      }`}
                    >
                      {rankMode === "latest" ? "Latest" : "Trending"}
                    </button>
                  ))}
                </div>
              ) : (
                <h2 className="text-sm font-semibold text-zinc-600">
                  Results for “{searchedQuery}”
                </h2>
              )}
            </div>
            {activeView === "news" && (
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-500">
                <span className="text-zinc-600">
                  {newsRankMode === "trending"
                    ? trendingTopic ?? "Trending"
                    : "Last 30 days"}
                </span>
                <div className="flex overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
                  {(["grid", "list"] as NewsLayout[]).map((layout) => (
                    <button
                      key={layout}
                      type="button"
                      aria-label={`Show news as ${layout}`}
                      aria-pressed={newsLayout === layout}
                      onClick={() => setNewsLayout(layout)}
                      className={`grid h-8 w-9 place-items-center transition-colors ${
                        newsLayout === layout
                          ? "bg-zinc-950 text-white"
                          : "text-zinc-500 hover:text-zinc-950"
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
              </div>
            )}
          </div>

          {activeView === "leaderboard" ? (
            showLeaderboardSkeleton ? <LeaderboardSkeleton /> : renderLeaderboard()
          ) : isLoading || showNewsSkeleton ? (
            <div
              role="status"
              aria-label={`Loading news for ${searchedQuery}`}
              className="grid justify-center gap-x-5 gap-y-6 md:grid-cols-[repeat(2,minmax(0,425px))] xl:grid-cols-[repeat(3,minmax(0,425px))]"
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
                    ? "news-layout-enter grid justify-center gap-x-5 gap-y-6 md:grid-cols-[repeat(2,minmax(0,425px))] xl:grid-cols-[repeat(3,minmax(0,425px))]"
                    : "news-layout-enter grid gap-5"
                }
              >
                {items.map((item, index) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    index={index}
                    variant={newsLayout}
                    showBookmarkControl
                    requiresSignIn={currentUser === null}
                    onBookmarkChange={handleBookmarkChange}
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
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "rounded-full border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-zinc-300 hover:text-zinc-950"
                    }`}
                  >
                    {isLoadingMore ? "Loading..." : "Load next 12"}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-zinc-400">
                    End of index
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
              <h3 className="text-2xl font-semibold text-zinc-950">No news found</h3>
              <p className="mt-3 text-sm text-zinc-500">Try a broader topic such as agents, LLMs, or infrastructure.</p>
            </div>
          )}
      </div>
    </section>
  );
}
