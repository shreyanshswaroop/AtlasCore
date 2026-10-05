import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";

interface EditorialPageProps {
  title: string;
  children: ReactNode;
}

export default function EditorialPage({ title, children }: EditorialPageProps) {
  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <Navbar />
      <article className="news-layout-enter mx-auto w-full max-w-[880px] px-6 pb-28 pt-14 sm:px-8 sm:pt-24">
        <h1 className="mb-16 text-center font-serif text-[2.5rem] font-normal leading-tight tracking-tight sm:mb-20 sm:text-5xl">
          {title}
        </h1>
        <div className="space-y-8 text-base leading-[1.85] text-zinc-400 sm:text-[18px]">
          {children}
        </div>
      </article>
    </main>
  );
}
