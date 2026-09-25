"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCompanyLeaderboard,
  getCurrentUser,
  getNews,
  logout,
  type AuthUser,
} from "@/lib/api";
import type { CompanyLeaderboardItem } from "@/types/company";
import type { NewsItem } from "@/types/news";

import AuthModal from "./AuthModal";

type AuthMode = "signin" | "signup";

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

  async function handleSignOut() {
    setIsSigningOut(true);
    setIsProfileMenuOpen(false);

    try {
      await Promise.all([
        logout(),
        wait(260),
      ]);
      setCurrentUser(null);
      window.dispatchEvent(
        new CustomEvent("atlascore-auth-updated", {
          detail: { reason: "logout" },
        })
      );
      router.replace("/");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSigningOut(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;

    getCurrentUser()
      .then((user) => {
        if (isCurrent) {
          setCurrentUser(user);
        }
      })
      .catch((error) => {
        console.error(error);

        if (isCurrent) {
          setCurrentUser(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

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
    <>
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-[1540px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-zinc-950">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-zinc-950 via-red-600 to-zinc-950 text-sm font-black text-white">
              AC
            </span>
            <span className="text-xl font-bold leading-6">
              AtlasCore
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-zinc-700 hover:text-zinc-950 focus-visible:text-zinc-950"
              >
                {item.label}
              </Link>
            ))}
            {currentUser && (
              <Link
                href="/bookmarks"
                className="text-sm font-semibold text-zinc-700 hover:text-zinc-950 focus-visible:text-zinc-950"
              >
                Bookmarks
              </Link>
            )}
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
              className="flex h-10 w-[260px] overflow-hidden rounded-full border border-zinc-200 bg-zinc-50 transition-[width,border-color,background-color] duration-300 ease-out hover:w-[500px] hover:border-zinc-300 focus-within:w-[500px] focus-within:border-zinc-500 focus-within:bg-white"
            >
              <label htmlFor="navbar-news-search" className="sr-only">
                Search AI news
              </label>
              <span className="grid w-9 shrink-0 place-items-center text-zinc-400">
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
                placeholder="Search news..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-zinc-950 outline-none placeholder:font-semibold placeholder:text-zinc-500"
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
                  className="grid w-9 shrink-0 place-items-center text-lg leading-none text-zinc-400 hover:text-zinc-950"
                >
                  ×
                </button>
              )}
            </form>

            {isSearchOpen && query.trim() && (
              <div className="absolute right-0 top-12 z-50 w-[500px] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xl shadow-zinc-950/10">
                <div className="mb-4 flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-950">
                  <span className="text-zinc-500">⌕</span>
                  <span className="truncate">{query.trim()}</span>
                </div>

                <div>
                  <p className="border-b border-zinc-100 pb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Companies
                  </p>
                  <div className="py-2">
                    {companyResults.length > 0 ? (
                      companyResults.map((company) => (
                        <Link
                          key={company.slug}
                          href={`/companies/${company.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-[8px] uppercase text-zinc-600">
                            {company.company.slice(0, 2)}
                          </span>
                          <span className="truncate">
                            <HighlightedText text={getCompanyDisplayName(company)} query={query} />
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                        {isSearching ? "Searching..." : "No company matches"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="border-b border-zinc-100 pb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Articles
                  </p>
                  <div className="py-2">
                    {articleResults.length > 0 ? (
                      articleResults.map((article) => (
                        <Link
                          key={article.id}
                          href={`/news/${encodeURIComponent(article.id)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-[8px] uppercase text-zinc-600">
                            {(article.source_name ?? "AI").slice(0, 2)}
                          </span>
                          <span className="truncate">
                            <HighlightedText text={article.title} query={query} />
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                        {isSearching ? "Searching..." : "No article matches"}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitSearch}
                  className="mt-3 w-full rounded-xl bg-zinc-950 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-zinc-950"
                >
                  View all results
                </button>
              </div>
            )}
          </div>

          <div
            className={`relative flex h-9 justify-end ${
              currentUser ? "min-w-0" : "min-w-[166px]"
            }`}
          >
            {currentUser ? (
              <div
                className={`flex items-center gap-2 transition-all duration-[240ms] ease-out ${
                  isSigningOut
                    ? "pointer-events-none translate-y-2 scale-[0.98] opacity-0"
                    : "translate-y-0 opacity-100"
                }`}
              >
                <div
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsProfileMenuOpen(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                    className="flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-700 shadow-sm hover:border-zinc-300 hover:text-zinc-950"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-[9px] text-white">
                      {currentUser.full_name.slice(0, 2)}
                    </span>
                    <span className="hidden max-w-28 truncate sm:block">
                      {currentUser.full_name}
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-12 z-[80] w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/10 animate-[auth-form-in_180ms_ease-out_both]"
                    >
                      <div className="flex items-center gap-3 border-b border-zinc-100 p-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-950 text-[11px] font-bold uppercase text-white">
                          {currentUser.full_name.slice(0, 2)}
                        </span>

                        <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-950">
                          {currentUser.full_name.replaceAll(" ", "_")}
                        </p>
                      </div>

                      <div className="border-b border-zinc-100 py-1">
                        <Link
                          href="/profile"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex h-10 items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                        >
                          <span aria-hidden="true" className="w-4 text-base">
                            ⚙
                          </span>
                          Settings
                        </Link>

                        <Link
                          href="/bookmarks"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex h-10 items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                        >
                          <span aria-hidden="true" className="w-4 text-base">
                            ★
                          </span>
                          Bookmarks
                        </Link>

                        <Link
                          href="/about"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex h-10 items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                        >
                          <span aria-hidden="true" className="w-4 text-base">
                            ▤
                          </span>
                          About
                        </Link>
                      </div>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex h-10 w-full items-center gap-3 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-wait disabled:text-zinc-300"
                      >
                        <span aria-hidden="true" className="w-4 text-base">
                          ↪
                        </span>
                        {isSigningOut ? "Leaving" : "Log out"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-[navbar-auth-in_260ms_cubic-bezier(0.22,1,0.36,1)_both]">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className="flex h-10 items-center px-2 text-sm font-semibold text-zinc-600 hover:text-zinc-950"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="flex h-10 items-center rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-950"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>

    {authMode && (
      <AuthModal
        initialMode={authMode}
        onClose={() => setAuthMode(null)}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setAuthMode(null);
          window.dispatchEvent(new Event("atlascore-auth-updated"));
          router.refresh();
        }}
      />
    )}
    </>
  );
}
