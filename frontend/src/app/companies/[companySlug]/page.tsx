import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { getCompanyNews } from "@/lib/api";
import type { NewsItem } from "@/types/news";

interface CompanyPageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

const topicLabels: Record<string, string> = {
  AGENTS: "Agents",
  API: "API",
  AUDIO: "Audio",
  BENCHMARKS: "Benchmarks",
  BUSINESS: "Business",
  DATA: "Data",
  DEVELOPMENT: "Development",
  GOVERNMENT: "Government",
  GPUS: "GPUs",
  IMAGE: "Image",
  INFRA: "Infra",
  LLMS: "LLMs",
  OPEN_SOURCE: "Open source",
  REASONING: "Reasoning",
  ROBOTICS: "Robotics",
  VIBE_CODING: "Vibe coding",
  VIDEO: "Video",
};

const companyDescriptions: Record<string, string> = {
  Anthropic:
    "Anthropic is an AI safety and research company best known for Claude, a family of large language models used for writing, coding, analysis, and agentic workflows. Its work focuses on building reliable AI systems, long-context assistants, developer tools, and enterprise-grade model access.",
  OpenAI:
    "OpenAI is an AI research and product company best known for ChatGPT, GPT models, Sora, and developer APIs. Its products span conversational assistants, multimodal generation, coding tools, agents, and enterprise AI infrastructure.",
  Google:
    "Google builds AI products across search, productivity, cloud, Android, and consumer applications. Its Gemini models power assistants, developer APIs, multimodal tools, and AI features across Google's product ecosystem.",
  "Google DeepMind":
    "Google DeepMind is an AI research lab focused on frontier models, scientific discovery, and advanced reasoning systems. Its work includes Gemini research, AlphaFold, robotics, reinforcement learning, and long-running efforts in general-purpose AI.",
  Microsoft:
    "Microsoft builds AI products across Windows, Microsoft 365, Azure, GitHub, and enterprise software. Its Copilot products and Azure AI services bring language models, agents, and developer tools into workplace and cloud workflows.",
  Meta:
    "Meta develops AI systems for social platforms, open models, ads, creator tools, and mixed reality products. Its Llama models, recommendation systems, and generative AI tools support research, consumer experiences, and developer adoption.",
  NVIDIA:
    "NVIDIA designs GPUs, accelerated computing platforms, and AI software used to train and serve modern models. Its CUDA ecosystem, data center chips, and model tooling make it a central infrastructure company for AI workloads.",
};

function getCompanyInitials(company: string) {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getTopTopics(items: NewsItem[]) {
  const topicCounts = new Map<string, number>();

  items.forEach((item) => {
    const topics = item.categories.length > 0
      ? item.categories
      : item.primary_topic
      ? [item.primary_topic]
      : [];

    topics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    });
  });

  return Array.from(topicCounts.entries())
    .sort((first, second) => second[1] - first[1])
    .slice(0, 6)
    .map(([topic]) => topic);
}

function getCompanyDescription(
  company: string,
  aliases: string[],
  domain?: string | null
) {
  const knownDescription = companyDescriptions[company];

  if (knownDescription) {
    return knownDescription;
  }

  if (aliases.length > 0) {
    return `${company} develops AI products and services associated with ${aliases
      .slice(0, 5)
      .join(", ")}. The company appears in coverage around product launches, research updates, partnerships, infrastructure, and market activity across the AI ecosystem.`;
  }

  return `${company} is an AI-related company${
    domain ? ` associated with ${domain}` : ""
  }. The company appears in coverage around product updates, research, partnerships, infrastructure, and market activity across the AI ecosystem.`;
}

function CompanyLogo({
  company,
  logoUrl,
  size = "large",
}: {
  company: string;
  logoUrl?: string | null;
  size?: "small" | "large";
}) {
  const dimensionClass = size === "large" ? "h-16 w-16" : "h-10 w-10";
  const imageClass = size === "large" ? "h-10 w-10" : "h-6 w-6";

  return (
    <span
      className={`grid ${dimensionClass} shrink-0 place-items-center rounded-2xl border border-zinc-200 bg-white font-mono text-xs font-bold uppercase text-zinc-950 shadow-sm`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={`${imageClass} object-contain`}
        />
      ) : (
        getCompanyInitials(company)
      )}
    </span>
  );
}

function NewsRow({
  item,
  index,
}: {
  item: NewsItem;
  index: number;
}) {
  const topic = item.primary_topic ?? item.categories[0] ?? "NEWS";
  const sourceName = item.source_name ?? item.authors[0] ?? "Source";
  const detailUrl = `/news/${encodeURIComponent(item.id)}`;

  return (
    <article className="grid gap-5 border-b border-zinc-100 py-6 last:border-b-0 md:grid-cols-[56px_minmax(0,1fr)_220px] md:items-center">
      <div className="hidden md:block">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
          <span>{String(index + 1).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="min-w-0">
        <Link
          href={detailUrl}
          className="text-lg font-semibold leading-snug text-zinc-950 decoration-zinc-950 underline-offset-4 hover:underline"
        >
          {item.title}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          <span>{sourceName}</span>
          <span>·</span>
          <span>{topicLabels[topic] ?? topic}</span>
          <span>·</span>
          <span>{formatDate(item.published_at)}</span>
        </div>

        <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-zinc-500">
          {item.summary}
        </p>
      </div>

      <Link
        href={detailUrl}
        aria-label={`Open ${item.title}`}
        className="block h-28 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-950 md:h-24"
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="news-preview flex h-full items-center justify-center bg-[#eef1f6] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            AtlasCore
          </div>
        )}
      </Link>
    </article>
  );
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { companySlug } = await params;

  let data;

  try {
    data = await getCompanyNews(companySlug, 48);
  } catch {
    notFound();
  }

  const company = data.company;
  const topTopics = getTopTopics(data.items);
  const latestStory = data.items[0];
  const profileCopy = getCompanyDescription(
    company.company,
    company.aliases,
    company.domain
  );

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <Navbar />

      <section className="news-layout-enter mx-auto max-w-[1379px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">
          <Link href="/?view=leaderboard#discover" className="hover:text-zinc-950">
            Leaderboard
          </Link>
          <span>/</span>
          <span>{company.company}</span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <CompanyLogo
                  company={company.company}
                  logoUrl={company.logo_url}
                />

                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                  {data.count} stories
                </span>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  About company
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                  {company.company}
                </h1>
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-500">
                {profileCopy}
              </p>

              <div className="mt-7 border-t border-zinc-100 pt-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Products
                </p>

                <div className="flex flex-wrap gap-2">
                  {(company.aliases.length > 0
                    ? company.aliases.slice(0, 8)
                    : [company.domain ?? "Company"]
                  ).map((alias) => (
                    <span
                      key={alias}
                      className="rounded-full bg-zinc-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Topics
                </p>

                {topTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600"
                      >
                        {topicLabels[topic] ?? topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No topic signals yet.</p>
                )}
              </div>

              <div className="mt-7 border-t border-zinc-100 pt-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Links
                </p>

                <div className="flex flex-wrap gap-2">
                  {company.domain && (
                    <a
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600 hover:border-zinc-400 hover:text-zinc-950"
                    >
                      Website ↗
                    </a>
                  )}
                  <Link
                    href={`/?view=news#discover`}
                    className="rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600 hover:border-zinc-400 hover:text-zinc-950"
                  >
                    News index
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <header className="border-b border-zinc-200 pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    News
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                    Latest {company.company} stories
                  </h2>
                </div>

                <div className="flex items-center gap-5 text-sm font-semibold text-zinc-500">
                  <span>Latest</span>
                  <span className="border-b-2 border-zinc-950 pb-1 text-zinc-950">
                    Last 30 days
                  </span>
                </div>
              </div>
            </header>

            {latestStory && (
              <div className="grid gap-6 border-b border-zinc-100 py-7 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
                <div className="flex min-w-0 gap-4">
                  <CompanyLogo
                    company={company.company}
                    logoUrl={company.logo_url}
                    size="small"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                      Featured latest
                    </p>
                    <Link
                      href={`/news/${encodeURIComponent(latestStory.id)}`}
                      className="mt-2 block text-2xl font-semibold leading-tight text-zinc-950 decoration-zinc-950 underline-offset-4 hover:underline"
                    >
                      {latestStory.title}
                    </Link>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-500">
                      {latestStory.summary}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/news/${encodeURIComponent(latestStory.id)}`}
                  className="h-44 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                >
                  {latestStory.image_url ? (
                    <img
                      src={latestStory.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="news-preview flex h-full items-center justify-center bg-[#eef1f6] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      AtlasCore
                    </div>
                  )}
                </Link>
              </div>
            )}

            {data.items.length > 0 ? (
              <div>
                {data.items.slice(1).map((item, index) => (
                  <NewsRow key={item.id} item={item} index={index + 1} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-20 text-center">
                <h2 className="text-2xl font-semibold text-zinc-950">No indexed news found</h2>
                <p className="mt-3 text-sm text-zinc-500">
                  This company is in the leaderboard catalog, but no matching news
                  is currently stored in AtlasCore.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
