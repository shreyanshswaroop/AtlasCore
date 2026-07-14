import Navbar from "@/components/Navbar";
import NewsExplorer from "@/components/NewsExplorer";
import { getCompanyLeaderboard, getNews } from "@/lib/api";

interface HomeProps {
  searchParams?: Promise<{
    view?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const initialView =
    resolvedSearchParams?.view === "leaderboard" ? "leaderboard" : "news";
  const initialQuery = "All news";
  const [data, leaderboard] = await Promise.all([
    getNews(undefined, 12),
    getCompanyLeaderboard(150),
  ]);

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <Navbar />

      <section className="noise-grid border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-[#3b82f6]">
                Independent AI research index
              </p>
              <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
                Latest in AI.
              </h1>
            </div>
            <p className="max-w-md border-l border-zinc-700 pl-5 text-sm leading-6 text-zinc-400">
              Search, filter, and read the AI news shaping intelligent systems.
              Updated from leading labs, builders, and infrastructure teams.
            </p>
          </div>
        </div>
      </section>

      <NewsExplorer
        key={initialView}
        initialItems={data.items}
        initialQuery={initialQuery}
        initialTotalCount={data.count}
        initialView={initialView}
        initialLeaderboardItems={leaderboard.items}
      />

      <footer id="about" className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-8 font-mono text-xs uppercase tracking-[0.12em] text-zinc-600 sm:flex-row sm:justify-between sm:px-8">
          <p>© 2026 AtlasCore AI</p>
          <p>Research signals, without the noise.</p>
        </div>
      </footer>
    </main>
  );
}
