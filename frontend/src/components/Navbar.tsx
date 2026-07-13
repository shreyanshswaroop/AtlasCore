import Link from "next/link";

import AtlasCoreLogo from "./AtlasCoreLogo";

const navigationItems = [
  { label: "Explore", href: "/#discover" },
  { label: "Latest", href: "/#trending" },
  { label: "About", href: "/#about" },
];

export default function Navbar() {
  return (
    <header className="border-b border-white/10 bg-[#080808]">
      <nav className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <AtlasCoreLogo />
            <span className="font-mono text-base font-medium uppercase leading-6 tracking-[0.08em]">
              AtlasCore
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/#discover"
          className="border border-zinc-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300 hover:border-[#3b82f6] hover:text-white"
        >
          Browse papers
        </Link>
      </nav>
    </header>
  );
}
