import Link from "next/link";

import Navbar from "@/components/Navbar";

const features = [
  {
    label: "Live AI News",
    text: "Browse recent AI stories from labs, product teams, developer platforms, and infrastructure companies.",
  },
  {
    label: "Topic Index",
    text: "Filter coverage by signals like agents, APIs, benchmarks, development, infrastructure, open source, and LLMs.",
  },
  {
    label: "Company Leaderboard",
    text: "Track which AI companies and products are showing up most often across the indexed news feed.",
  },
  {
    label: "Fast Search",
    text: "Search articles and companies from the navbar with live suggestions and direct result navigation.",
  },
];

export default function AboutPage() {
  return (
    <main className="site-background min-h-screen text-zinc-100">
      <Navbar />

      <section className="news-layout-enter mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-20">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          About AtlasCore
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-medium leading-none tracking-[-0.05em] text-white sm:text-6xl">
          An AI news index built for scanning the signal.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400">
          AtlasCore helps you follow the fast-moving AI ecosystem without
          digging through scattered feeds. It organizes recent AI news by topic,
          company, and product so you can see what is changing, who is shipping,
          and where attention is moving.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center border border-zinc-700 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Explore news
          </Link>
          <Link
            href="/?view=leaderboard"
            className="inline-flex h-10 items-center border border-zinc-700 bg-white/[0.03] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            View leaderboard
          </Link>
        </div>

        <div className="mt-12 w-full border border-zinc-800 bg-[#050505] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Current focus
          </p>
          <div className="mt-5 grid gap-3 font-mono text-[11px] uppercase leading-6 tracking-[0.12em] text-zinc-500 sm:grid-cols-2">
            <p>Window: Last 30 days</p>
            <p>Sources: AI feeds</p>
            <p>Views: News / Leaderboard / Company pages</p>
            <p>Status: Live index</p>
          </div>
        </div>

        <div className="mt-12 grid w-full border-t border-zinc-900 pt-8 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.label}
              className="faded-divider px-0 py-6 md:px-5"
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                {feature.label}
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-500">
                {feature.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
