import Link from "next/link";

import Navbar from "@/components/Navbar";
import NewsExplorer from "@/components/NewsExplorer";
import { getNews, getSyncStatus } from "@/lib/api";
import { Newsreader } from "next/font/google";

const headlineSerif = Newsreader({
  subsets: ["latin"],
  weight: ["300"],
});

interface HomeProps {
  searchParams?: Promise<{
    query?: string;
    view?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const initialView =
    resolvedSearchParams?.view === "leaderboard" ? "leaderboard" : "news";
  const initialQuery = resolvedSearchParams?.query?.trim() || "All news";
  const [data, syncStatus] = await Promise.all([
    getNews(initialQuery === "All news" ? undefined : initialQuery, 12),
    getSyncStatus().catch((error) => {
      console.error(error);

      return null;
    }),
  ]);

  return (
    <main className="site-background min-h-screen text-zinc-100">
      <Navbar />

      <section>
        <div className="mx-auto max-w-[1500px] px-5 pb-8 pt-14 sm:px-8 sm:pb-10 sm:pt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`${headlineSerif.className} max-w-4xl text-4xl font-light leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4.25rem]`}>
                Latest in AI
              </h1>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-400 lg:text-right">
              Search, filter, and read the AI news shaping intelligent systems.
              Updated from leading labs, builders, and infrastructure teams.
            </p>
          </div>
        </div>
      </section>

      <NewsExplorer
        key={`${initialView}-${initialQuery}`}
        initialItems={data.items}
        initialQuery={initialQuery}
        initialTotalCount={data.count}
        initialView={initialView}
        initialSyncStatus={syncStatus}
      />

      <footer id="about" className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-8 font-mono text-xs uppercase tracking-[0.12em] text-zinc-600 sm:flex-row sm:justify-between sm:px-8">
          <p>© 2026 AtlasCore AI</p>
          <div className="flex flex-wrap gap-4 sm:justify-end">
            <Link href="/about" className="hover:text-zinc-300">
              About
            </Link>
            <p>Research signals, without the noise.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
