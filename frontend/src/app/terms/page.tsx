import Link from "next/link";

import EditorialPage from "@/components/EditorialPage";

export default function TermsPage() {
  return (
    <EditorialPage title="Terms of Service">
      <p>
        AtlasCore is an AI news discovery project. It collects links and brief
        descriptions to help readers find coverage from original publishers.
      </p>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">Content and links</h2>
        <p>
          Headlines, summaries, and links are provided for discovery. The linked
          publisher is responsible for its own content. Check the original story
          for full context and current information.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">Your account</h2>
        <p>
          Keep your sign-in details secure. Use the account features for your own
          reading and saved lists, and avoid activity that interferes with the
          service or other readers.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">Availability</h2>
        <p>
          The index and its features may change as the project develops. News
          coverage may be incomplete or delayed.
        </p>
      </section>
      <p className="border-t border-[#242424] pt-8 text-sm">
        <Link href="/contact" className="text-zinc-200 underline decoration-[#555] underline-offset-4 hover:text-white">Contact AtlasCore</Link>
      </p>
    </EditorialPage>
  );
}
