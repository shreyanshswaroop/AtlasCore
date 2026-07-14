import Navbar from "@/components/Navbar";

const skeletonRows = ["one", "two", "three", "four", "five"];
const skeletonPills = ["product-a", "product-b", "product-c"];
const skeletonTopics = ["topic-a", "topic-b", "topic-c", "topic-d"];

function SkeletonPill({ width }: { width: string }) {
  return <span className={`skeleton-shimmer h-9 ${width}`} />;
}

function SkeletonNewsRow({ index }: { index: number }) {
  return (
    <article className="grid gap-4 border-b border-zinc-900 py-7 last:border-b-0 md:grid-cols-[72px_minmax(0,1fr)_220px] md:items-center">
      <div className="hidden md:block">
        <div className="skeleton-shimmer h-[70px] w-[70px]" />
      </div>

      <div className="min-w-0">
        <div
          className="skeleton-shimmer h-5"
          style={{ width: `${Math.max(58, 92 - index * 7)}%` }}
        />
        <div className="mt-3 flex gap-2">
          <span className="skeleton-shimmer h-3 w-20" />
          <span className="skeleton-shimmer h-3 w-24" />
          <span className="skeleton-shimmer h-3 w-16" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton-shimmer h-3 w-[86%]" />
          <div className="skeleton-shimmer h-3 w-[64%]" />
        </div>
      </div>

      <div className="skeleton-shimmer h-28 border border-zinc-800 md:h-24" />
    </article>
  );
}

export default function CompanyLoading() {
  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <Navbar />

      <section
        aria-label="Loading company profile"
        className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14"
      >
        <div className="mb-10 flex items-center gap-3">
          <span className="skeleton-shimmer h-3 w-24" />
          <span className="h-1 w-1 bg-zinc-800" />
          <span className="skeleton-shimmer h-3 w-28" />
        </div>

        <div className="grid gap-7 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="border border-zinc-800 bg-[#121212] p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="skeleton-shimmer h-16 w-16" />
                <span className="skeleton-shimmer h-9 w-28 border border-zinc-800" />
              </div>

              <div className="mt-12">
                <span className="skeleton-shimmer block h-3 w-36" />
                <span className="skeleton-shimmer mt-5 block h-10 w-56" />
              </div>

              <div className="mt-8 space-y-4">
                <span className="skeleton-shimmer block h-4 w-[94%]" />
                <span className="skeleton-shimmer block h-4 w-[88%]" />
                <span className="skeleton-shimmer block h-4 w-[76%]" />
                <span className="skeleton-shimmer block h-4 w-[64%]" />
              </div>

              <div className="mt-8 border-t border-zinc-800 pt-6">
                <span className="skeleton-shimmer mb-4 block h-3 w-24" />
                <div className="flex flex-wrap gap-2">
                  {skeletonPills.map((pill, index) => (
                    <SkeletonPill
                      key={pill}
                      width={index === 1 ? "w-32" : "w-24"}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <span className="skeleton-shimmer mb-4 block h-3 w-20" />
                <div className="flex flex-wrap gap-2">
                  {skeletonTopics.map((topic, index) => (
                    <SkeletonPill
                      key={topic}
                      width={index % 2 === 0 ? "w-28" : "w-36"}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-zinc-800 pt-6">
                <span className="skeleton-shimmer mb-4 block h-3 w-16" />
                <div className="flex gap-3">
                  <span className="skeleton-shimmer h-10 w-28" />
                  <span className="skeleton-shimmer h-10 w-32" />
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <header className="border-b border-zinc-800 pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="skeleton-shimmer block h-3 w-20" />
                  <span className="skeleton-shimmer mt-4 block h-8 w-72 max-w-full" />
                </div>

                <div className="flex gap-4">
                  <span className="skeleton-shimmer h-3 w-16" />
                  <span className="skeleton-shimmer h-3 w-24" />
                </div>
              </div>
            </header>

            <div className="grid gap-6 border-b border-zinc-900 py-7 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
              <div className="flex min-w-0 gap-4">
                <span className="skeleton-shimmer h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="skeleton-shimmer block h-3 w-32" />
                  <span className="skeleton-shimmer mt-4 block h-7 w-[88%]" />
                  <div className="mt-5 space-y-2">
                    <span className="skeleton-shimmer block h-3 w-[82%]" />
                    <span className="skeleton-shimmer block h-3 w-[62%]" />
                  </div>
                </div>
              </div>

              <span className="skeleton-shimmer h-44 border border-zinc-800" />
            </div>

            <div role="status" aria-label="Loading company stories">
              <span className="sr-only">Loading company stories</span>
              {skeletonRows.map((row, index) => (
                <SkeletonNewsRow key={row} index={index} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
