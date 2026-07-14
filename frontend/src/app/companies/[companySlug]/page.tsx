import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import { getCompanyNews } from "@/lib/api";

interface CompanyPageProps {
  params: Promise<{
    companySlug: string;
  }>;
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

  return (
    <main className="min-h-screen bg-[#080808] text-zinc-100">
      <Navbar />

      <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <Link href="/?view=leaderboard#discover" className="hover:text-white">
            Back to leaderboard
          </Link>
          <span>/</span>
          <span>{company.company}</span>
        </div>

        <header className="mb-10 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center border border-zinc-700 bg-zinc-900">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <span className="font-mono text-xs font-bold uppercase">
                  {company.company.slice(0, 2)}
                </span>
              )}
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#3b82f6]">
                Company news
              </p>
              <h1 className="mt-1 text-4xl font-medium tracking-tight text-white sm:text-6xl">
                {company.company}
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-500">
            Latest indexed stories matching {company.company}
            {company.aliases.length > 0
              ? ` and products such as ${company.aliases.slice(0, 4).join(", ")}.`
              : "."}
          </p>
        </header>

        <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {data.count} stories
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
            Latest first
          </p>
        </div>

        {data.items.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} />
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
    </main>
  );
}
