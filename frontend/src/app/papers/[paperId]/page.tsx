import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
import { getPaperById } from "@/lib/api";

interface PaperPageProps {
  params: Promise<{
    paperId: string;
  }>;
}

interface AnalysisListProps {
  title: string;
  items: string[];
  accentClass: string;
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M4 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AnalysisList({ title, items, accentClass }: AnalysisListProps) {
  return (
    <section className="border-t border-zinc-800/80 py-9 sm:py-10">
      <div className={`mb-3 h-px w-8 bg-current opacity-70 ${accentClass}`} />
      <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-200">
        {title}
      </h3>

      <ol className="mt-5 max-w-3xl space-y-4">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="grid grid-cols-[24px_1fr] gap-3 text-[15px] leading-7 text-zinc-400"
          >
            <span className="pt-0.5 font-mono text-[10px] text-zinc-700">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { paperId } = await params;
  let data;

  try {
    data = await getPaperById(
      decodeURIComponent(paperId)
    );
  } catch {
    notFound();
  }

  const { paper, analysis } = data;

  return (
      <main className="min-h-screen overflow-hidden bg-[#080808] text-zinc-100">
        <Navbar />

        <section className="noise-grid border-b border-white/10">
          <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
            <Link
              href="/#discover"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-200"
            >
              <ArrowIcon className="h-3.5 w-3.5 rotate-180" />
              Back to research library
            </Link>

            <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8 lg:grid-cols-4 lg:gap-14">
              <div className="min-w-0 md:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#3b82f6]">
                    Research paper / {paper.categories[0] ?? "Index"}
                  </span>
                  {analysis && (
                    <span className="border border-emerald-500/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-400">
                      AI analysis ready
                    </span>
                  )}
                </div>

                <h1 className="mt-5 max-w-5xl font-serif text-[clamp(1.9rem,2.6vw,2.75rem)] leading-[1.08] tracking-[-0.025em] text-white">
                  {paper.title}
                </h1>

                <p className="mt-7 max-w-3xl border-l border-zinc-700 pl-5 text-sm leading-6 text-zinc-400">
                  {paper.authors.join(", ")}
                </p>
              </div>

              <aside className="self-start border border-zinc-800 bg-[#0a0a0a] p-5">
                <dl className="space-y-5">
                  <div className="flex items-baseline justify-between gap-4 md:block">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                      Published
                    </dt>
                    <dd className="mt-1.5 text-sm text-zinc-300">
                      {formatDate(paper.published_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                      Categories
                    </dt>
                    <dd className="mt-2.5 flex flex-wrap gap-1.5">
                      {paper.categories.map((category) => (
                        <span
                          key={category}
                          className="border border-zinc-800 px-2 py-1 font-mono text-[10px] uppercase text-zinc-500"
                        >
                          {category}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-1">
                  <a
                    href={paper.arxiv_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 border border-[#3b82f6] bg-[#3b82f6] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black hover:bg-white"
                  >
                    Open on arXiv
                    <ArrowIcon className="h-3.5 w-3.5 -rotate-45" />
                  </a>

                  {paper.pdf_url && (
                    <a
                      href={paper.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center border border-zinc-700 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300 hover:border-[#3b82f6] hover:text-white"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 sm:py-16">
          <section className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">
                Paper overview
              </p>
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
                Abstract
              </h2>

              <details className="group mt-5 border border-zinc-800 bg-[#0a0a0a] open:border-zinc-700">
                <summary className="cursor-pointer list-none p-5 marker:hidden sm:p-6 [&::-webkit-details-marker]:hidden">
                  <p className="line-clamp-4 text-[16px] leading-8 text-zinc-300 group-open:hidden sm:text-[17px]">
                    {paper.summary}
                  </p>
                  <p className="hidden text-[16px] leading-8 text-zinc-300 group-open:block sm:text-[17px]">
                    {paper.summary}
                  </p>

                  <span className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-400">
                    <span className="group-open:hidden">Read full abstract</span>
                    <span className="hidden group-open:inline">Collapse abstract</span>
                    <span className="text-base transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
              </details>
            </div>
          </section>

          <section className="mt-16 grid gap-6 border-t border-zinc-800 pt-12 sm:mt-20 sm:pt-16 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-400">
                AtlasCore AI
              </p>
              <p className="mt-3 max-w-[160px] text-xs leading-5 text-zinc-600">
                {analysis
                  ? "A structured reading companion generated from the abstract."
                  : "Structured analysis status for this paper."}
              </p>
            </div>

            <div className="min-w-0 max-w-4xl">
              {analysis ? (
                <div>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b82f6]">
                        Research intelligence / Briefing
                      </p>
                      <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-white sm:text-3xl">
                        Understand this paper faster
                      </h2>
                    </div>

                    <div className="flex gap-2">
                      <span className="border border-zinc-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                        {analysis.difficulty}
                      </span>
                      <span className="border border-zinc-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                        {analysis.reading_time_minutes} min read
                      </span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <section className="paper-preview border border-zinc-700 bg-[#e9e8e3] p-6 text-zinc-950 sm:p-8">
                      <div className="flex items-center justify-between border-b border-zinc-400 pb-3 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                        <span>AtlasCore / Executive summary</span>
                        <span>{paper.categories[0] ?? "Research"}</span>
                      </div>
                      <p className="mt-6 max-w-4xl font-serif text-xl font-bold leading-8 sm:text-2xl">
                        {analysis.executive_summary}
                      </p>
                    </section>

                    <section className="py-10 sm:py-12">
                      <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-200">
                        Why it matters
                      </h3>
                      <p className="mt-4 max-w-3xl text-[15px] leading-7 text-zinc-400">
                        {analysis.why_it_matters}
                      </p>
                    </section>
                  </div>

                  <div>
                    <AnalysisList
                      title="Key contributions"
                      items={analysis.key_contributions}
                      accentClass="text-blue-400"
                    />
                    <AnalysisList
                      title="Limitations"
                      items={analysis.limitations}
                      accentClass="text-amber-400"
                    />
                    <AnalysisList
                      title="Use cases"
                      items={analysis.use_cases}
                      accentClass="text-cyan-400"
                    />
                    <AnalysisList
                      title="Prerequisites"
                      items={analysis.prerequisites}
                      accentClass="text-violet-400"
                    />
                  </div>

                  <section className="border-t border-zinc-800/80 py-9 sm:py-10">
                    <h3 className="text-xl font-medium tracking-[-0.02em] text-zinc-200">
                      Recommended for
                    </h3>
                    <div className="mt-5 flex flex-wrap gap-2">
                          {analysis.target_roles.map((role) => (
                            <span
                              key={role}
                              className="border border-zinc-800 bg-[#0d0d0d] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-zinc-400"
                            >
                              {role}
                            </span>
                          ))}
                    </div>
                    <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                      Generated with {analysis.model_name}
                    </p>
                  </section>
                </div>
              ) : (
                <section className="border border-zinc-800 bg-[#0a0a0a] px-6 py-7 sm:px-8 sm:py-9">
                  <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-xl">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                        AtlasCore intelligence / Pending
                      </p>
                      <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em] text-zinc-100">
                        Analysis is being prepared
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        The paper and abstract are ready to read. Its structured summary, contributions, limitations, and prerequisites have not been generated yet.
                      </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 border border-amber-500/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-amber-400/80">
                      <span className="h-1.5 w-1.5 bg-amber-400/80" />
                      Awaiting analysis
                    </span>
                  </div>

                  <div className="mt-7 flex flex-col gap-2 border-t border-zinc-800 pt-5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>Paper record available</span>
                    <span>AI fields pending</span>
                  </div>
                </section>
              )}
            </div>
          </section>

          <footer className="mt-16 flex flex-col gap-4 border-t border-zinc-800 py-8 font-mono text-[10px] uppercase tracking-[0.12em] sm:mt-20 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-zinc-600">
              © 2026 AtlasCore AI
            </p>
            <Link
              href="/#discover"
              className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Explore more papers
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </footer>
        </div>
      </main>
  );
}
