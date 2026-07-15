"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCompanyLeaderboard, getNews } from "@/lib/api";
import type { CompanyLeaderboardItem } from "@/types/company";
import type { NewsItem } from "@/types/news";

import AtlasCoreLogo from "./AtlasCoreLogo";

const navigationItems = [
  { label: "Explore", href: "/" },
  { label: "Leaderboard", href: "/?view=leaderboard" },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(cleanedQuery)})`, "ig"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === cleanedQuery.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="bg-zinc-200 px-0.5 text-black">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [companyResults, setCompanyResults] = useState<CompanyLeaderboardItem[]>([]);
  const [articleResults, setArticleResults] = useState<NewsItem[]>([]);

  function getCompanyDisplayName(company: CompanyLeaderboardItem) {
    const cleanedQuery = query.trim().toLowerCase();
    const matchedAlias = company.aliases.find((alias) =>
      alias.toLowerCase().includes(cleanedQuery)
    );

    return matchedAlias ?? company.company;
  }

  function submitSearch() {
    const cleanedQuery = query.trim();
    const params = new URLSearchParams();

    if (cleanedQuery) {
      params.set("query", cleanedQuery);
    }

    setIsSearchOpen(false);
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}#discover`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch();
  }

  useEffect(() => {
    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      return;
    }

    let isCurrent = true;

    const timeout = window.setTimeout(async () => {
      try {
        const [newsData, companyData] = await Promise.all([
          getNews(cleanedQuery, 5),
          getCompanyLeaderboard(150, false),
        ]);

        if (!isCurrent) {
          return;
        }

        const lowerQuery = cleanedQuery.toLowerCase();
        const companies = companyData.items
          .filter((company) =>
            [
              company.company,
              company.domain ?? "",
              ...company.aliases,
            ].some((value) => value.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 4);

        setCompanyResults(companies.slice(0, 3));
        setArticleResults(newsData.items.slice(0, 4));
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          setCompanyResults([]);
          setArticleResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  return (
    <header className="sticky top-0 z-50 bg-[#070707]/85 backdrop-blur">
      <nav className="flex h-14 w-full items-center gap-4 px-3 sm:px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <AtlasCoreLogo />
            <span className="font-mono text-base font-medium uppercase leading-6 tracking-[0.08em]">
              AtlasCore
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-100 focus-visible:text-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <div
            className="relative hidden lg:block"
            onFocus={() => setIsSearchOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsSearchOpen(false);
              }
            }}
          >
            <form
              onSubmit={handleSearch}
              className="flex h-9 w-[240px] overflow-hidden border border-zinc-800 bg-[#0b0b0b] transition-[width,border-color] duration-300 ease-out hover:w-[500px] hover:border-zinc-600 focus-within:w-[500px] focus-within:border-zinc-500"
            >
              <label htmlFor="navbar-news-search" className="sr-only">
                Search AI news
              </label>
              <span className="grid w-9 shrink-0 place-items-center border-r border-zinc-800 font-mono text-zinc-600">
                ⌕
              </span>
              <input
                id="navbar-news-search"
                type="search"
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setIsSearchOpen(true);

                  if (!nextQuery.trim()) {
                    setCompanyResults([]);
                    setArticleResults([]);
                    setIsSearching(false);
                  } else {
                    setIsSearching(true);
                  }
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="SEARCH NEWS..."
                className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-bold text-zinc-100 outline-none placeholder:font-normal placeholder:uppercase placeholder:tracking-[0.11em] placeholder:text-zinc-600"
              />
              {query.trim() && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setCompanyResults([]);
                    setArticleResults([]);
                  }}
                  className="grid w-9 shrink-0 place-items-center border-l border-zinc-800 font-mono text-lg leading-none text-zinc-500 hover:text-zinc-100"
                >
                  ×
                </button>
              )}
            </form>

            {isSearchOpen && query.trim() && (
              <div className="absolute right-0 top-11 z-50 w-[500px] max-w-[calc(100vw-2rem)] border border-zinc-700 bg-[#030303] p-3.5 shadow-2xl">
                <div className="mb-4 flex items-center gap-3 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-100">
                  <span className="text-zinc-500">⌕</span>
                  <span className="truncate">{query.trim()}</span>
                </div>

                <div>
                  <p className="border-b border-zinc-800 pb-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Companies
                  </p>
                  <div className="py-2">
                    {companyResults.length > 0 ? (
                      companyResults.map((company) => (
                        <Link
                          key={company.slug}
                          href={`/companies/${company.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 py-2 font-mono text-sm font-bold text-zinc-400 hover:text-zinc-100"
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center bg-zinc-900 text-[8px] uppercase text-zinc-300">
                            {company.company.slice(0, 2)}
                          </span>
                          <span className="truncate">
                            <HighlightedText text={getCompanyDisplayName(company)} query={query} />
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-700">
                        {isSearching ? "Searching..." : "No company matches"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="border-b border-zinc-800 pb-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Articles
                  </p>
                  <div className="py-2">
                    {articleResults.length > 0 ? (
                      articleResults.map((article) => (
                        <Link
                          key={article.id}
                          href={`/news/${encodeURIComponent(article.id)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 py-2 font-mono text-sm font-bold text-zinc-500 hover:text-zinc-100"
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center bg-zinc-900 text-[8px] uppercase text-zinc-300">
                            {(article.source_name ?? "AI").slice(0, 2)}
                          </span>
                          <span className="truncate">
                            <HighlightedText text={article.title} query={query} />
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-700">
                        {isSearching ? "Searching..." : "No article matches"}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitSearch}
                  className="mt-3 w-full bg-zinc-100 px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-black hover:bg-white"
                >
                  View all results
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="flex h-9 items-center px-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex h-9 items-center border border-zinc-700/80 bg-white/[0.03] px-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
