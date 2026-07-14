import type { NewsItem } from "@/types/news";
import Link from "next/link";

interface NewsCardProps {
  item: NewsItem;
  index?: number;
}

const labels: Record<string, string> = {};

export default function NewsCard({
  item,
  index = 0,
}: NewsCardProps) {
  const publishedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(item.published_at));

  const primaryCategory = item.primary_topic ?? item.categories[0];

  const category =
    labels[primaryCategory] ?? primaryCategory ?? "Research";

  const accentColors = [
    "#3b82f6",
    "#22d3ee",
    "#818cf8",
    "#60a5fa",
  ];

  const accent = accentColors[index % accentColors.length];

  const detailUrl = `/news/${encodeURIComponent(item.id)}`;
  const sourceUrl = item.source_url ?? "#";
  const sourceName = item.source_name ?? "Source";

  return (
    <article className="group flex min-h-[510px] flex-col border border-zinc-800 bg-[#0a0a0a] transition hover:relative hover:z-10 hover:border-zinc-600">
      <Link
        href={detailUrl}
        aria-label={`Open ${item.title}`}
        className="news-preview m-4 mb-0 block h-44 overflow-hidden border border-zinc-700 bg-[#e9e8e3] p-4 text-zinc-950 transition group-hover:border-zinc-500"
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full p-4">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-400 pb-2 font-mono text-[7px] uppercase tracking-wider">
              <span>
                AtlasCore / {String(index + 1).padStart(2, "0")}
              </span>

              <span>{primaryCategory ?? "News"}</span>
            </div>

            <p className="line-clamp-2 max-w-[90%] font-serif text-base font-bold leading-tight">
              {item.title}
            </p>

            <div
              className="mt-5 flex h-12 items-end gap-1"
              aria-hidden="true"
            >
              {[38, 64, 48, 82, 56, 70, 44, 76, 52, 68, 34, 58].map(
                (height, barIndex) => (
                  <span
                    key={barIndex}
                    className="flex-1"
                    style={{
                      height: `${height}%`,
                      backgroundColor:
                        barIndex % 3 === 0 ? accent : "#202020",
                    }}
                  />
                )
              )}
            </div>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
          <span style={{ color: accent }}>■</span>
          <span className="ml-2">{category}</span>
        </p>

        <h3 className="line-clamp-3 text-lg font-medium leading-snug tracking-[-0.02em] text-zinc-100 decoration-[#3b82f6] underline-offset-4 group-hover:underline">
          <Link href={detailUrl}>
            {item.title}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 text-xs leading-5 text-zinc-500">
          {item.summary}
        </p>

        <div className="mt-auto pt-6">
          <p className="line-clamp-1 font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-600">
            {item.authors.slice(0, 2).join(" · ") || "Unknown source"}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">
            <span>{publishedDate}</span>

            <div className="flex gap-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-zinc-700 px-2 py-1 hover:border-[#3b82f6] hover:text-white"
              >
                {sourceName} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
