"use client";

import { useEffect, useState } from "react";

export type ArticleSectionLink = {
  href: string;
  title: string;
  note: string;
  markerHeight: number;
};

interface ArticleSectionRailProps {
  sections: ArticleSectionLink[];
}

export default function ArticleSectionRail({
  sections,
}: ArticleSectionRailProps) {
  const [activeHref, setActiveHref] = useState(sections[0]?.href ?? "");

  useEffect(() => {
    const sectionElements = sections
      .map((section) => document.querySelector(section.href))
      .filter((element): element is Element => element !== null);

    if (!sectionElements.length) {
      return;
    }

    function updateActiveSection() {
      const viewportAnchor = window.innerHeight * 0.34;
      let currentSection = sectionElements[0];

      for (const sectionElement of sectionElements) {
        if (sectionElement.getBoundingClientRect().top <= viewportAnchor) {
          currentSection = sectionElement;
        }
      }

      setActiveHref(`#${currentSection.id}`);
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  if (!sections.length) {
    return null;
  }

  return (
    <aside className="group fixed left-0 top-[32vh] z-30 hidden h-[360px] w-6 overflow-visible lg:block">
      <nav className="space-y-2 py-2 font-mono text-[12px] leading-5">
        {sections.map((section) => {
          const isActive = section.href === activeHref;

          return (
            <a
              key={`${section.href}-${section.title}`}
              href={section.href}
              className={`grid grid-cols-[2px_190px] gap-4 pl-4 transition-colors duration-300 ${
                isActive ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <span
                style={{ height: section.markerHeight }}
                className={`w-[2px] transition-colors duration-300 ${
                  isActive ? "bg-zinc-950/70" : "bg-zinc-950/14"
                }`}
              />
              <span className="-translate-x-2 pt-0.5 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
                <span className={`block ${isActive ? "font-semibold" : ""}`}>
                  {section.title}
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-zinc-400">
                  {section.note}
                </span>
              </span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
