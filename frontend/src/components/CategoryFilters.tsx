interface CategoryFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: CategoryFilter) => void;
  counts?: Record<string, number>;
  disabled?: boolean;
  loading?: boolean;
  hideEmpty?: boolean;
  visibleLabels?: string[];
}

export type CategoryFilter = {
  label: string;
  icon: IconName;
  count: string;
  query?: string;
};

type IconName =
  | "all"
  | "agents"
  | "api"
  | "audio"
  | "benchmarks"
  | "business"
  | "data"
  | "development"
  | "government"
  | "gpus"
  | "image"
  | "infra"
  | "llms"
  | "openSource"
  | "postTraining"
  | "reasoning"
  | "retrieval"
  | "robotics"
  | "security"
  | "trainingInfra"
  | "vibeCoding"
  | "video";

export const categories: CategoryFilter[] = [
  { label: "ALL", icon: "all", count: "343" },
  { label: "AGENTS", icon: "agents", count: "67", query: "agent|multi-agent|autonomous agent|tool use" },
  { label: "API", icon: "api", count: "58", query: "API|tool calling|function calling|interface" },
  { label: "AUDIO", icon: "audio", count: "21", query: "audio|speech|voice|music|speaker|sound" },
  { label: "BENCHMARKS", icon: "benchmarks", count: "52", query: "benchmark|evaluation|leaderboard|eval|assessment" },
  { label: "BUSINESS", icon: "business", count: "39", query: "business|enterprise|market|finance|industry" },
  { label: "DATA", icon: "data", count: "10", query: "dataset|data|corpus|synthetic data|data curation" },
  { label: "DEVELOPMENT", icon: "development", count: "120", query: "coding|code|software|developer|programming" },
  { label: "GOVERNMENT", icon: "government", count: "5", query: "government|policy|regulation|public sector|governance" },
  { label: "GPUS", icon: "gpus", count: "22", query: "GPU|CUDA|accelerator|hardware|inference speed" },
  { label: "IMAGE", icon: "image", count: "25", query: "image|vision|diffusion|visual|multimodal" },
  { label: "INFRA", icon: "infra", count: "26", query: "infrastructure|serving|deployment|systems|distributed" },
  { label: "LLMS", icon: "llms", count: "83", query: "large language model|LLM|language model|transformer" },
  { label: "OPEN_SOURCE", icon: "openSource", count: "40", query: "open source|open-source|open model|open weights" },
  { label: "POST_TRAINING", icon: "postTraining", count: "12", query: "post-training|post training|fine-tuning|alignment|RLHF" },
  { label: "REASONING", icon: "reasoning", count: "7", query: "reasoning|chain-of-thought|planning|math|logic" },
  { label: "RETRIEVAL", icon: "retrieval", count: "8", query: "retrieval|RAG|search|information retrieval" },
  { label: "ROBOTICS", icon: "robotics", count: "11", query: "robot|robotics|embodied|manipulation|navigation" },
  { label: "SECURITY", icon: "security", count: "12", query: "security|safety|jailbreak|adversarial|privacy" },
  { label: "TRAINING_INFRA", icon: "trainingInfra", count: "11", query: "training infrastructure|distributed training|parallel training|scaling" },
  { label: "VIBE_CODING", icon: "vibeCoding", count: "30", query: "coding agent|code assistant|AI coding|software agent" },
  { label: "VIDEO", icon: "video", count: "27", query: "video|text-to-video|video generation|video diffusion" },
];

function CategoryIcon({ icon }: { icon: IconName }) {
  const sharedProps = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  switch (icon) {
    case "all":
      return (
        <svg {...sharedProps} fill="currentColor" stroke="none">
          <path d="m12 2 2.4 6.9 7.3.2-5.8 4.4 2.1 7-6-4.1-6 4.1 2.1-7-5.8-4.4 7.3-.2L12 2Z" />
        </svg>
      );
    case "agents":
      return (
        <svg {...sharedProps}>
          <path d="M7 10V8a5 5 0 0 1 10 0v2" />
          <path d="M5 10h14v8H5z" />
          <path d="M9 14h.01M15 14h.01M12 18v3" />
        </svg>
      );
    case "api":
      return (
        <svg {...sharedProps}>
          <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />
        </svg>
      );
    case "audio":
      return (
        <svg {...sharedProps}>
          <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
        </svg>
      );
    case "benchmarks":
      return (
        <svg {...sharedProps}>
          <path d="M5 20V10M12 20V4M19 20v-7" />
        </svg>
      );
    case "business":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M15 9.5c-.8-.9-4.5-1-4.5.9 0 2.4 5 1.1 5 3.6 0 2.1-3.8 2-5.2.8M12 6.5v11" />
        </svg>
      );
    case "data":
      return (
        <svg {...sharedProps}>
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
          <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
        </svg>
      );
    case "development":
      return (
        <svg {...sharedProps}>
          <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
        </svg>
      );
    case "government":
      return (
        <svg {...sharedProps}>
          <path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M4 20h16M12 3l8 5H4l8-5Z" />
        </svg>
      );
    case "gpus":
      return (
        <svg {...sharedProps}>
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </svg>
      );
    case "image":
      return (
        <svg {...sharedProps}>
          <rect x="4" y="5" width="16" height="14" rx="1" />
          <path d="m4 16 4-4 3 3 2-2 7 6M8 9h.01" />
        </svg>
      );
    case "infra":
      return (
        <svg {...sharedProps}>
          <rect x="4" y="5" width="16" height="5" rx="1" />
          <rect x="4" y="14" width="16" height="5" rx="1" />
          <path d="M8 7.5h.01M8 16.5h.01" />
        </svg>
      );
    case "llms":
      return (
        <svg {...sharedProps}>
          <path d="M8 4h8a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H9l-5 5V8a4 4 0 0 1 4-4Z" />
          <path d="M8 8h8M8 12h5" />
        </svg>
      );
    case "openSource":
      return (
        <svg {...sharedProps}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      );
    case "postTraining":
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );
    case "reasoning":
      return (
        <svg {...sharedProps}>
          <path d="M9 4a5 5 0 0 0-3 9v2a3 3 0 0 0 3 3h1M15 4a5 5 0 0 1 3 9v2a3 3 0 0 1-3 3h-1M12 4v16" />
        </svg>
      );
    case "retrieval":
      return (
        <svg {...sharedProps}>
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 5 5" />
        </svg>
      );
    case "robotics":
      return (
        <svg {...sharedProps}>
          <path d="M7 11h10v7H7zM9 8h6M12 4v4M8 18l-2 3M16 18l2 3" />
          <path d="M10 14h.01M14 14h.01" />
        </svg>
      );
    case "security":
      return (
        <svg {...sharedProps}>
          <rect x="6" y="10" width="12" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
        </svg>
      );
    case "trainingInfra":
      return (
        <svg {...sharedProps}>
          <rect x="8" y="4" width="8" height="16" rx="2" />
          <path d="M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4" />
        </svg>
      );
    case "vibeCoding":
      return (
        <svg {...sharedProps}>
          <path d="M8 13 5 10l3-3M16 7l3 3-3 3M14 5l-4 14" />
          <path d="M7 19h10" />
        </svg>
      );
    case "video":
      return (
        <svg {...sharedProps}>
          <rect x="4" y="7" width="12" height="10" rx="1" />
          <path d="m16 11 5-3v8l-5-3" />
        </svg>
      );
  }
}

function ChevronIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

const skeletonRows = [
  "all",
  "agents",
  "api",
  "audio",
  "benchmarks",
  "business",
  "data",
  "development",
  "government",
  "gpus",
  "image",
  "infra",
];

function CategoryFiltersSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading topics"
      className="flex gap-2 overflow-x-auto pb-2 lg:block lg:max-h-[620px] lg:space-y-0.5 lg:overflow-y-hidden lg:overflow-x-hidden lg:pb-0 lg:pr-1"
    >
      <span className="sr-only">Loading topics</span>
      {skeletonRows.map((row, index) => (
        <div
          key={row}
          className="flex min-w-[150px] items-center justify-between gap-3 border border-transparent px-3 py-2.5 lg:w-full lg:min-w-0"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="skeleton-shimmer h-1.5 w-1.5" />
            <span className="skeleton-shimmer h-5 w-5 shrink-0" />
            <span
              className="skeleton-shimmer h-3"
              style={{ width: `${Math.max(52, 96 - index * 3)}px` }}
            />
          </span>
          <span className="skeleton-shimmer h-3 w-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function CategoryFilters({
  activeCategory,
  onCategoryChange,
  counts,
  disabled = false,
  loading = false,
  hideEmpty = false,
  visibleLabels,
}: CategoryFiltersProps) {
  if (loading) {
    return <CategoryFiltersSkeleton />;
  }

  const filteredCategories = visibleLabels && visibleLabels.length > 0
    ? categories.filter((category) =>
        category.label === "ALL" || visibleLabels.includes(category.label)
      )
    : categories;

  const visibleCategories = hideEmpty
    ? filteredCategories.filter((category) => {
        const count = counts?.[category.label];

        return category.label === "ALL" || count === undefined || count > 0;
      })
    : filteredCategories;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:max-h-[620px] lg:space-y-0.5 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1">
      {visibleCategories.map((category) => {
        const isActive = activeCategory === category.label;
        const count = counts?.[category.label];

        return (
          <button
            key={category.label}
            type="button"
            disabled={disabled}
            onClick={() => onCategoryChange(category)}
            className={`group flex min-w-max items-center justify-between gap-3 border px-3 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-[0.11em] lg:w-full lg:min-w-0 ${
              isActive
                ? "border-zinc-700 bg-zinc-900 text-white"
                : "border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-100"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={`h-1.5 w-1.5 border ${isActive ? "border-[#3b82f6] bg-[#3b82f6]" : "border-zinc-700"}`} />
              <span className={`grid h-5 w-5 shrink-0 place-items-center ${isActive ? "text-white" : "text-zinc-300 group-hover:text-white"}`}>
                <CategoryIcon icon={category.icon} />
              </span>
              <span className="truncate text-zinc-200 group-hover:text-white">{category.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-zinc-100">
              <span>{count ?? category.count}</span>
              {category.label !== "ALL" && <ChevronIcon />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
