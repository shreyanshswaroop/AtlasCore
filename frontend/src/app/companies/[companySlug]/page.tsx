import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
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
      className={`grid ${dimensionClass} shrink-0 place-items-center border border-zinc-700 bg-zinc-900 font-mono text-xs font-bold uppercase text-white`}
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
    <article className="grid gap-4 border-b border-zinc-900 py-7 last:border-b-0 md:grid-cols-[72px_minmax(0,1fr)_220px] md:items-center">
      <div className="hidden md:block">
        <div className="grid h-[70px] w-[70px] place-items-center border border-zinc-800 bg-[#1c1c1c] font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-400">
          <span className="text-zinc-500">△</span>
          <span>{String(index + 1).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="min-w-0">
        <Link
          href={detailUrl}
          className="text-lg font-medium leading-snug text-zinc-100 decoration-[#3b82f6] underline-offset-4 hover:underline"
        >
          {item.title}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
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
        className="news-preview block h-28 overflow-hidden border border-zinc-800 bg-[#e9e8e3] p-2 text-zinc-950 md:h-24"
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#dfddd5] font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
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
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <Navbar />

      <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <Link href="/?view=leaderboard#discover" className="hover:text-white">
            Leaderboard
          </Link>
          <span>/</span>
          <span>{company.company}</span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="border border-zinc-800 bg-[#121212] p-6">
              <div className="flex items-start justify-between gap-4">
                <CompanyLogo
                  company={company.company}
                  logoUrl={company.logo_url}
                />

                <span className="border border-[#3b82f6]/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#3b82f6]">
                  {data.count} stories
                </span>
              </div>

              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3b82f6]">
                  About company
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {company.company}
                </h1>
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-400">
                {profileCopy}
              </p>

              <div className="mt-7 border-t border-zinc-800 pt-5">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Products
                </p>

                <div className="flex flex-wrap gap-2">
                  {(company.aliases.length > 0
                    ? company.aliases.slice(0, 8)
                    : [company.domain ?? "Company"]
                  ).map((alias) => (
                    <span
                      key={alias}
                      className="bg-zinc-800 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-300"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Topics
                </p>

                {topTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topTopics.map((topic) => (
                      <span
                        key={topic}
                        className="border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-300"
                      >
                        {topicLabels[topic] ?? topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">No topic signals yet.</p>
                )}
              </div>

              <div className="mt-7 border-t border-zinc-800 pt-5">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Links
                </p>

                <div className="flex flex-wrap gap-2">
                  {company.domain && (
                    <a
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-zinc-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300 hover:border-[#3b82f6] hover:text-white"
                    >
                      Website ↗
                    </a>
                  )}
                  <Link
                    href={`/?view=news#discover`}
                    className="border border-zinc-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300 hover:border-[#3b82f6] hover:text-white"
                  >
                    News index
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <header className="border-b border-zinc-800 pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b82f6]">
                    News
                  </p>
                  <h2 className="mt-2 text-2xl font-medium tracking-tight text-white">
                    Latest {company.company} stories
                  </h2>
                </div>

                <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
                  <span>Latest</span>
                  <span className="border-b border-[#3b82f6] pb-1 text-zinc-300">
                    Last 30 days
                  </span>
                </div>
              </div>
            </header>

            {latestStory && (
              <div className="grid gap-6 border-b border-zinc-900 py-7 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
                <div className="flex min-w-0 gap-4">
                  <CompanyLogo
                    company={company.company}
                    logoUrl={company.logo_url}
                    size="small"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Featured latest
                    </p>
                    <Link
                      href={`/news/${encodeURIComponent(latestStory.id)}`}
                      className="mt-2 block text-2xl font-medium leading-tight text-white decoration-[#3b82f6] underline-offset-4 hover:underline"
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
                  className="news-preview h-44 overflow-hidden border border-zinc-800 bg-[#e9e8e3] p-3"
                >
                  {latestStory.image_url ? (
                    <img
                      src={latestStory.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#dfddd5] font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
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
              <div className="border border-dashed border-zinc-800 px-6 py-20 text-center">
                <h2 className="text-2xl text-white">No indexed news found</h2>
                <p className="mt-3 text-sm text-zinc-500">
                  This company is in the leaderboard catalog, but no matching news
                  is currently stored in AtlasCore.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
