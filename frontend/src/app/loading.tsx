const topicSkeletons = ["all", "llms", "agents", "research", "infra", "tools"];
const cardSkeletons = ["one", "two", "three", "four", "five", "six"];

function LoadingCard() {
  return (
    <article className="flex min-h-[510px] flex-col border border-zinc-800 bg-[#050505]">
      <div className="skeleton-shimmer m-5 mb-0 h-48" />

      <div className="flex flex-1 flex-col px-5 py-7">
        <div className="flex items-center gap-3">
          <span className="skeleton-shimmer h-4 w-4" />
          <span className="skeleton-shimmer h-3.5 w-32" />
        </div>

        <div className="mt-7 space-y-3">
          <div className="skeleton-shimmer h-4 w-[92%]" />
          <div className="skeleton-shimmer h-4 w-[74%]" />
          <div className="skeleton-shimmer h-4 w-[58%]" />
        </div>

        <div className="mt-auto flex gap-4 pt-8">
          <div className="skeleton-shimmer h-3.5 w-20" />
          <div className="skeleton-shimmer h-3.5 w-28" />
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

export default function Loading() {
  return (
    <main className="site-background min-h-screen text-zinc-100">
      <header className="sticky top-0 z-50 bg-[#070707]/85 backdrop-blur">
        <nav className="flex h-14 w-full items-center gap-4 px-3 sm:px-4">
          <div className="flex items-center gap-8">
            <span className="font-mono text-base font-medium uppercase leading-6 tracking-[0.08em] text-white">
              AtlasCore
            </span>
            <div className="hidden items-center gap-6 md:flex">
              <span className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Explore
              </span>
              <span className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Leaderboard
              </span>
            </div>
          </div>

          <div className="ml-auto hidden h-9 w-[240px] border border-zinc-800 bg-[#0b0b0b] lg:block" />
          <div className="skeleton-shimmer ml-auto h-8 w-20 lg:ml-0" />
        </nav>
      </header>

      <section>
        <div className="mx-auto max-w-[1500px] px-5 pb-8 pt-14 sm:px-8 sm:pb-10 sm:pt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-light leading-[0.95] text-white sm:text-5xl lg:text-[4.25rem]">
                Latest in AI
              </h1>
              <div className="mt-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                <span className="skeleton-shimmer h-2.5 w-2.5" />
                <span>Waking the news engine</span>
              </div>
            </div>

            <div className="max-w-md space-y-2 lg:text-right">
              <div className="skeleton-shimmer h-3 w-full" />
              <div className="skeleton-shimmer ml-auto h-3 w-[82%]" />
              <div className="skeleton-shimmer ml-auto h-3 w-[64%]" />
            </div>
          </div>
        </div>
      </section>

      <section
        id="discover"
        role="status"
        aria-label="Loading AtlasCore news"
        className="mx-auto max-w-[1500px] px-5 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-8"
      >
        <span className="sr-only">Loading AtlasCore news</span>

        <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
            <p className="mb-4 font-mono text-xs font-normal uppercase tracking-[0.11em] text-zinc-600">
              Topics
            </p>
            <div className="grid gap-2">
              {topicSkeletons.map((topic) => (
                <div
                  key={topic}
                  className="flex h-11 items-center justify-between border border-zinc-900 bg-[#080808] px-3"
                >
                  <div className="skeleton-shimmer h-3 w-24" />
                  <div className="skeleton-shimmer h-3 w-8" />
                </div>
              ))}
            </div>
            <div className="mt-8 hidden border-t border-zinc-800 pt-5 lg:block">
              <div className="skeleton-shimmer h-3 w-44" />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="skeleton-shimmer h-3 w-16" />
                <div className="skeleton-shimmer h-3 w-28" />
              </div>
              <div className="flex items-center gap-4">
                <div className="skeleton-shimmer h-3 w-24" />
                <div className="skeleton-shimmer h-8 w-[74px]" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3">
              {cardSkeletons.map((card) => (
                <LoadingCard key={card} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
