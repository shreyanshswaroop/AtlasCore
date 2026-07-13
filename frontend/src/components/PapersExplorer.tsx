"use client";

import { FormEvent, useState } from "react";
import { getPapers } from "@/lib/api";
import type { Paper } from "@/types/paper";
import CategoryFilters from "./CategoryFilters";
import PaperCard from "./PaperCard";

interface PapersExplorerProps {
  initialPapers: Paper[];
  initialQuery: string;
}

const skeletonCards = ["a", "b", "c", "d", "e", "f"];
const minimumSkeletonDuration = 900;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function PaperCardSkeleton() {
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

export default function PapersExplorer({ initialPapers, initialQuery }: PapersExplorerProps) {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("Artificial Intelligence");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchPapers(searchQuery: string) {
    const cleanedQuery = searchQuery.trim();
    if (cleanedQuery.length < 2) {
      setError("Enter at least two characters.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSearchedQuery(cleanedQuery);
      const [data] = await Promise.all([
        getPapers(cleanedQuery, 12),
        wait(minimumSkeletonDuration),
      ]);
      setPapers(data.papers);
    } catch (searchError) {
      console.error(searchError);
      setError("Unable to load papers. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await searchPapers(query);
  }

  async function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setQuery(category);
    await searchPapers(category);
  }

  return (
    <section id="discover" className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14">
      <form onSubmit={handleSearch} className="mb-12 flex border border-zinc-800 bg-[#0b0b0b] focus-within:border-zinc-600">
        <label htmlFor="paper-search" className="sr-only">Search research papers</label>
        <span className="grid w-14 place-items-center border-r border-zinc-800 font-mono text-zinc-600">⌕</span>
        <input
          id="paper-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SEARCH PAPERS, METHODS, AUTHORS..."
          className="min-h-14 min-w-0 flex-1 bg-transparent px-4 font-mono text-xs tracking-[0.12em] text-white outline-none placeholder:text-zinc-700"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="border-l border-[#3b82f6] bg-[#3b82f6] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-black hover:bg-white disabled:opacity-50 sm:px-8"
        >
          {isLoading ? "Scanning" : "Search"}
        </button>
      </form>

      {error && <div className="mb-8 border border-red-900 bg-red-950/30 px-5 py-4 font-mono text-xs text-red-300">{error}</div>}

      <div className="grid gap-10 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">Topics / Index</p>
          <CategoryFilters activeCategory={activeCategory} onCategoryChange={handleCategoryChange} disabled={isLoading} />
          <div className="mt-8 hidden border-t border-zinc-800 pt-5 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-zinc-700 lg:block">
            <p>Source: arXiv API</p>
            <p>Index status: live</p>
          </div>
        </aside>

        <div className="min-w-0">
          <div id="trending" className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b82f6]">Latest research</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">Results for “{searchedQuery}”</h2>
            </div>
            <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
              <span>{isLoading ? "Scanning index" : `${papers.length.toString().padStart(2, "0")} results`}</span>
              <span className="border-b border-[#3b82f6] pb-1 text-zinc-300">Latest</span>
            </div>
          </div>

          {isLoading ? (
            <div
              role="status"
              aria-label={`Loading papers for ${searchedQuery}`}
              className="grid md:grid-cols-2 xl:grid-cols-3"
            >
              <span className="sr-only">Loading research papers</span>
              {skeletonCards.map((card) => (
                <PaperCardSkeleton key={card} />
              ))}
            </div>
          ) : papers.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3">
              {papers.map((paper, index) => <PaperCard key={paper.id} paper={paper} index={index} />)}
            </div>
          ) : (
            <div className="border border-dashed border-zinc-800 px-6 py-20 text-center">
              <h3 className="text-2xl text-white">No papers found</h3>
              <p className="mt-3 text-sm text-zinc-500">Try a broader topic such as machine learning or computer vision.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
