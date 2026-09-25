import Link from "next/link";

import { categories } from "@/components/CategoryFilters";
import Navbar from "@/components/Navbar";
import NewsExplorer from "@/components/NewsExplorer";
import SiteFooter from "@/components/SiteFooter";
import { getNews, getSyncStatus } from "@/lib/api";
import { Newsreader } from "next/font/google";

const headlineSerif = Newsreader({
  subsets: ["latin"],
  weight: ["300", "500"],
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

interface HomeProps {
  searchParams?: Promise<{
    query?: string;
    topic?: string;
    view?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const initialView =
    resolvedSearchParams?.view === "leaderboard" ? "leaderboard" : "news";
  const requestedTopic = resolvedSearchParams?.topic?.trim();
  const initialTopic = categories.find(
    (category) => category.label === requestedTopic
  )?.label;
  const initialQuery =
    resolvedSearchParams?.query?.trim() || initialTopic || "All news";
  const [data, syncStatus] = await Promise.all([
    getNews(
      initialTopic || initialQuery === "All news" ? undefined : initialQuery,
      12,
      0,
      initialTopic
    ),
    getSyncStatus().catch((error) => {
      console.error(error);

      return null;
    }),
  ]);
  const featuredItem = data.items[0];
  const featuredImageUrl =
    featuredItem?.image_url ?? data.items.find((item) => item.image_url)?.image_url;
  return (
    <main className="site-background min-h-screen text-zinc-950">
      <Navbar />

      <section className="border-b border-zinc-200 bg-white">
        <div>
          {featuredItem ? (
            <Link
              href={`/news/${encodeURIComponent(featuredItem.id)}`}
              className="group relative block min-h-[390px] overflow-hidden bg-zinc-950 text-white shadow-sm sm:min-h-[450px] lg:min-h-[500px]"
            >
              {featuredImageUrl ? (
                <img
                  src={featuredImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#52525b,transparent_30%),linear-gradient(135deg,#030712,#18181b_48%,#3f3f46)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/38 to-black/10" />
              <div className="relative mx-auto flex min-h-[390px] max-w-[1540px] flex-col justify-end px-8 pb-10 pt-18 sm:min-h-[450px] sm:px-14 sm:pb-14 lg:min-h-[500px] lg:px-24 lg:pb-16">
                <div className="max-w-4xl">
                  <h1
                    className={`${headlineSerif.className} max-w-4xl text-4xl font-medium leading-[1.12] tracking-normal text-white sm:text-5xl lg:text-[3.8rem]`}
                  >
                    {featuredItem.title}
                  </h1>
                  <p className="mt-7 line-clamp-2 max-w-3xl text-base leading-7 text-white/82 sm:text-lg">
                    {featuredItem.summary}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold text-white/78">
                    <span>{formatDate(featuredItem.published_at)}</span>
                    <span>{featuredItem.source_name ?? "Source"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-20 text-center">
              <h1
                className={`${headlineSerif.className} text-5xl font-medium text-zinc-950`}
              >
                Latest in AI
              </h1>
              <p className="mt-4 text-zinc-600">
                Search, filter, and read the AI news shaping intelligent systems.
              </p>
            </div>
          )}
        </div>
      </section>

      <NewsExplorer
        key={`${initialView}-${initialQuery}`}
        initialItems={data.items}
        initialQuery={initialQuery}
        initialTopic={initialTopic}
        initialTotalCount={data.count}
        initialView={initialView}
      />

      <SiteFooter initialSyncStatus={syncStatus} />
    </main>
  );
}
