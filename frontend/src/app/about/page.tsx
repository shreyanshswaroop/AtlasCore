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
    <main className="min-h-screen bg-white text-zinc-950">
      <Navbar />

      <section className="news-layout-enter mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          About AtlasCore
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-none text-zinc-950 sm:text-6xl">
          An AI news index built for scanning the signal.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-500">
          AtlasCore helps you follow the fast-moving AI ecosystem without
          digging through scattered feeds. It organizes recent AI news by topic,
          company, and product so you can see what is changing, who is shipping,
          and where attention is moving.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full bg-zinc-950 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-zinc-800"
          >
            Explore news
          </Link>
          <Link
            href="/?view=leaderboard"
            className="inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
          >
            View leaderboard
          </Link>
        </div>

        <div className="mt-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Current focus
          </p>
          <div className="mt-5 grid gap-3 text-[11px] font-bold uppercase leading-6 tracking-[0.12em] text-zinc-500 sm:grid-cols-2">
            <p>Window: Last 30 days</p>
            <p>Sources: AI feeds</p>
            <p>Views: News / Leaderboard / Company pages</p>
            <p>Status: Live index</p>
          </div>
        </div>

        <div className="mt-12 grid w-full border-t border-zinc-200 pt-8 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.label}
              className="faded-divider px-0 py-6 md:px-5"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
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
