import Link from "next/link";
import { notFound } from "next/navigation";
import { Newsreader } from "next/font/google";

import ArticleSectionRail from "@/components/ArticleSectionRail";
import Navbar from "@/components/Navbar";
import { getNewsById } from "@/lib/api";

const headlineSerif = Newsreader({
  subsets: ["latin"],
  weight: ["300", "500"],
});

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

function getArticleParagraphs(value?: string) {
  return (value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatTopic(value: string) {
  return value.replaceAll("_", " ");
}

function getReadingMinutes(paragraphs: string[]) {
  const wordCount = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 220));
}

function getTakeaways(paragraphs: string[], summary: string) {
  const candidates = paragraphs.length ? paragraphs : [summary];

  return candidates
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 80)
    .slice(0, 5)
    .map((paragraph) => {
      if (paragraph.length <= 220) {
        return paragraph;
      }

      return `${paragraph.slice(0, 217).trim()}...`;
    });
}

function getShortText(value: string, wordLimit: number) {
  const words = value
    .replace(/\s+/g, " ")
    .replace(/[.?!,:;]+$/g, "")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= wordLimit) {
    return words.join(" ");
  }

  return `${words.slice(0, wordLimit).join(" ")}...`;
}

function getSectionTitle(value: string, fallback: string) {
  const firstSentence = value.split(/[.!?]/)[0]?.trim();
  const source = firstSentence || value || fallback;

  return getShortText(source, 4) || fallback;
}

function getSectionNote(value: string, fallback: string) {
  return getShortText(value || fallback, 8);
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
  const articleParagraphs = getArticleParagraphs(item.content);
  const hasFullArticle =
    articleParagraphs.length > 0 &&
    articleParagraphs.join(" ") !== item.summary.trim();
  const bodyParagraphs = hasFullArticle ? articleParagraphs : [];
  const sourceName = item.source_name ?? "Source";
  const publishedDate = formatDate(item.published_at);
  const readingMinutes = getReadingMinutes(bodyParagraphs);
  const takeaways = getTakeaways(bodyParagraphs, item.summary);
  const topics = item.categories.length ? item.categories : [primaryTopic];
  const sectionLinks = [
    {
      href: "#introduction",
      title: formatTopic(primaryTopic),
      note: getSectionNote(item.title, "Article introduction"),
      isEmphasized: true,
      markerHeight: 32,
    },
    ...(takeaways.length
      ? [
          {
            href: "#takeaways",
            title: getSectionTitle(takeaways[0], "Key points"),
            note: getSectionNote(takeaways[0], "Main points"),
            isEmphasized: true,
            markerHeight: 64,
          },
        ]
      : []),
    ...(bodyParagraphs.length
      ? [
          {
            href: "#full-story",
            title: getSectionTitle(bodyParagraphs[0], "Full story"),
            note: getSectionNote(
              bodyParagraphs[1] ?? bodyParagraphs[0],
              "Complete read"
            ),
            isEmphasized: false,
            markerHeight: 56,
          },
        ]
      : []),
    ...(item.topic_reason
      ? [
          {
            href: "#atlascore-signal",
            title: getSectionTitle(item.topic_reason, "AtlasCore signal"),
            note: getSectionNote(item.topic_reason, "Why this topic was tagged"),
            isEmphasized: false,
            markerHeight: 56,
          },
        ]
      : []),
  ].slice(0, 4);

  return (
    <main className="site-background min-h-screen text-zinc-950">
      <Navbar />

      <article className="bg-[#fbfbfa]">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-[920px] px-5 py-7 sm:px-8 sm:py-9">
            <h1
              className={`${headlineSerif.className} mx-auto max-w-3xl text-center text-3xl font-medium leading-[1.08] text-zinc-950 sm:text-4xl lg:text-[3rem]`}
            >
              {item.title}
            </h1>

            {item.summary ? (
              <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-zinc-600 sm:text-lg">
                {item.summary}
              </p>
            ) : null}

            <div className="mt-7 overflow-hidden border border-zinc-200 bg-zinc-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt=""
                  className="h-[200px] w-full object-cover sm:h-[280px] lg:h-[360px]"
                />
              ) : (
                <div className="news-preview min-h-[240px] bg-zinc-100 p-8">
                  <div className="border-t border-zinc-300 pt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                      AtlasCore
                    </p>
                    <p
                      className={`${headlineSerif.className} mt-10 max-w-3xl text-3xl font-medium leading-none text-zinc-950`}
                    >
                      {item.title}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Image credits: {sourceName}
            </p>
          </div>
        </header>

        <ArticleSectionRail sections={sectionLinks} />

        <div className="mx-auto max-w-[760px] px-5 py-10 sm:px-8 lg:py-14">

          <div className="min-w-0">
            <section id="introduction" className="scroll-mt-28">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Introduction
              </p>
              <p className="mt-4 text-lg font-semibold leading-7 text-zinc-800 sm:text-xl sm:leading-8">
                {item.summary ||
                  "A closer look at the latest development moving through the AI ecosystem."}
              </p>
            </section>

            {takeaways.length ? (
              <section
                id="takeaways"
                className="mt-9 scroll-mt-28 border border-zinc-200 bg-white p-6 sm:p-7"
              >
                <div className="flex items-center justify-between gap-6 border-b border-zinc-200 pb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Takeaways
                  </p>
                  <span className="text-xl text-zinc-400">-</span>
                </div>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-700 sm:text-base sm:leading-7">
                  {takeaways.map((takeaway, index) => (
                    <li key={`${takeaway.slice(0, 32)}-${index}`} className="flex gap-4">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 bg-[#078b35]" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {bodyParagraphs.length ? (
              <section
                id="full-story"
                className="mt-10 scroll-mt-28 space-y-5 text-base font-medium leading-7 text-zinc-800 sm:text-[1.05rem] sm:leading-8"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  Full story
                </p>
                {bodyParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph.slice(0, 32)}-${index}`}>
                    {paragraph}
                  </p>
                ))}
              </section>
            ) : (
              <p
                id="full-story"
                className="mt-10 scroll-mt-28 text-base font-medium leading-7 text-zinc-800 sm:text-[1.05rem] sm:leading-8"
              >
                The full story is not available in the feed yet. Open the
                original source for the complete report.
              </p>
            )}

            {item.topic_reason && (
              <section
                id="atlascore-signal"
                className="mt-10 scroll-mt-28 border-t border-zinc-200 pt-7"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                  AtlasCore signal
                </p>
                <p className="mt-4 text-base leading-7 text-zinc-600">
                  {item.topic_reason}
                </p>
              </section>
            )}

            <div
              id="article-topics"
              className="mt-10 scroll-mt-28 border-t border-zinc-200 pt-6"
            >
              <p className="text-sm font-semibold text-zinc-700">
                Topics:
                {topics.map((category) => (
                  <span key={category} className="ml-4 text-[#078b35]">
                    {formatTopic(category)}
                  </span>
                ))}
              </p>
            </div>
            <footer className="mt-12 border-t border-zinc-200 pt-7">
              <div className="grid gap-6 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Source
                  </p>
                  <p className="mt-2 font-bold text-zinc-950">{sourceName}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    {publishedDate}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Article info
                  </p>
                  <p className="mt-2 font-semibold text-zinc-700">
                    {readingMinutes} min read
                  </p>
                  <p className="mt-1 font-semibold text-zinc-700">
                    {formatTopic(primaryTopic)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Next reads
                  </p>
                  <div className="mt-2 grid gap-2 font-semibold text-zinc-700">
                    <Link href="/#discover" className="hover:text-[#078b35]">
                      Latest stories
                    </Link>
                    <Link
                      href={`/?topic=${encodeURIComponent(primaryTopic)}#discover`}
                      className="hover:text-[#078b35]"
                    >
                      More in {formatTopic(primaryTopic)}
                    </Link>
                    <Link
                      href="/?view=leaderboard#discover"
                      className="hover:text-[#078b35]"
                    >
                      Leaderboard
                    </Link>
                  </div>
                </div>
              </div>

              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-[#078b35]"
                >
                  Open original ↗
                </a>
              )}
            </footer>
          </div>
        </div>
      </article>
    </main>
  );
}
