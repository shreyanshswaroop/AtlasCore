import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
import { getNewsById } from "@/lib/api";

interface NewsPageProps {
  params: Promise<{
    newsId: string;
  }>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { newsId } = await params;

  let data;

  try {
    data = await getNewsById(newsId);
  } catch {
    notFound();
  }

  const item = data.item;
  const primaryTopic = item.primary_topic ?? item.categories[0] ?? "News";

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <Navbar />

      <article className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <Link href="/#discover" className="hover:text-white">
            Back to news
          </Link>
          <span>/</span>
          <span>{item.source_name ?? "Source"}</span>
          <span>/</span>
          <span>{formatDate(item.published_at)}</span>
        </div>

        <header className="border-b border-zinc-800 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b82f6]">
            {primaryTopic}
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
            {item.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {(item.categories.length ? item.categories : [primaryTopic]).map(
              (category) => (
                <span
                  key={category}
                  className="border border-zinc-800 px-2 py-1"
                >
                  {category}
                </span>
              )
            )}
          </div>
        </header>

        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="news-preview mb-8 overflow-hidden border border-zinc-800 bg-[#e9e8e3] p-4 text-zinc-950">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt=""
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="min-h-72 p-8">
                  <div className="mb-8 flex items-center justify-between border-b border-zinc-400 pb-3 font-mono text-[9px] uppercase tracking-wider">
                    <span>AtlasCore</span>
                    <span>{primaryTopic}</span>
                  </div>
                  <p className="max-w-2xl font-serif text-4xl font-bold leading-tight">
                    {item.title}
                  </p>
                </div>
              )}
            </div>

            <section className="border border-zinc-800 bg-[#0a0a0a] p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                Summary
              </p>
              <p className="mt-4 text-lg leading-8 text-zinc-300">
                {item.summary || "No summary was available for this story."}
              </p>
            </section>

            {item.topic_reason && (
              <section className="mt-6 border border-zinc-800 bg-[#0a0a0a] p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                  Why AtlasCore tagged it this way
                </p>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {item.topic_reason}
                </p>
              </section>
            )}
          </div>

          <aside className="h-fit border border-zinc-800 bg-[#0a0a0a] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
              Source
            </p>
            <p className="mt-3 text-lg font-medium text-white">
              {item.source_name ?? "Unknown source"}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600">
              Published {formatDate(item.published_at)}
            </p>

            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block border border-[#3b82f6] px-4 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#93c5fd] hover:bg-[#3b82f6] hover:text-black"
              >
                Open original ↗
              </a>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}
