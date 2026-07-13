interface CategoryFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  disabled?: boolean;
}

const categories = [
  { label: "Artificial Intelligence", code: "AI", count: "ALL" },
  { label: "AI Agents", code: "AG", count: "01" },
  { label: "Large Language Models", code: "LM", count: "02" },
  { label: "RAG", code: "RG", count: "03" },
  { label: "Computer Vision", code: "CV", count: "04" },
  { label: "Robotics", code: "RO", count: "05" },
];

export default function CategoryFilters({
  activeCategory,
  onCategoryChange,
  disabled = false,
}: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
      {categories.map((category) => {
        const isActive = activeCategory === category.label;

        return (
          <button
            key={category.label}
            type="button"
            disabled={disabled}
            onClick={() => onCategoryChange(category.label)}
            className={`group flex min-w-max items-center justify-between gap-4 border px-4 py-3 text-left font-mono text-xs uppercase tracking-[0.1em] lg:w-full lg:min-w-0 ${
              isActive
                ? "border-zinc-700 bg-zinc-900 text-white"
                : "border-transparent text-zinc-500 hover:border-zinc-800 hover:text-zinc-200"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`h-2 w-2 border ${isActive ? "border-[#3b82f6] bg-[#3b82f6]" : "border-zinc-700"}`} />
              <span className="shrink-0 text-zinc-600">{category.code}</span>
              <span className="truncate">{category.label}</span>
            </span>
            <span className="shrink-0 text-zinc-700 group-hover:text-zinc-500">{category.count}</span>
          </button>
        );
      })}
    </div>
  );
}
