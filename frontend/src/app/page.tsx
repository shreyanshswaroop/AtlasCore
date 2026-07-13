import Navbar from "@/components/Navbar";
import PapersExplorer from "@/components/PapersExplorer";
import { getPapers } from "@/lib/api";

export default async function Home() {
  const initialQuery = "artificial intelligence";
  const data = await getPapers(initialQuery, 12);

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
                Latest in artificial intelligence.
              </h1>
            </div>
            <p className="max-w-md border-l border-zinc-700 pl-5 text-sm leading-6 text-zinc-400">
              Search, filter, and read the research shaping intelligent systems.
              Updated directly from arXiv for builders and curious minds.
            </p>
          </div>
        </div>
      </section>

      <PapersExplorer initialPapers={data.papers} initialQuery={data.query} />

      <footer id="about" className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-8 font-mono text-xs uppercase tracking-[0.12em] text-zinc-600 sm:flex-row sm:justify-between sm:px-8">
          <p>© 2026 AtlasCore AI</p>
          <p>Research signals, without the noise.</p>
        </div>
      </footer>
    </main>
  );
}
