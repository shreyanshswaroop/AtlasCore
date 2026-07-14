import Link from "next/link";

import Navbar from "@/components/Navbar";

export default function SignUpPage() {
  return (
    <main className="site-background min-h-screen text-zinc-100">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1500px] items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-xl border border-zinc-800 bg-[#050505] px-6 py-12 text-center sm:px-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Sign up
          </p>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.04em] text-white sm:text-5xl">
            Coming soon
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-500">
            New accounts are not open yet. The signup flow will land here when authentication is ready.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center border border-zinc-700 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Back to news
          </Link>
        </div>
      </section>
    </main>
  );
}
