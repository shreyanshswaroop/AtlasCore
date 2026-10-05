import Link from "next/link";

import EditorialPage from "@/components/EditorialPage";

export default function AboutPage() {
  return (
    <EditorialPage title="About AtlasCore">
      <p>
        AI moves quickly. New research, models, products, and ideas arrive every
        day. Keeping up should feel clear and focused.
      </p>
      <p>
        AtlasCore brings recent AI news into one place. Browse the latest stories,
        follow the topics that matter to you, and see which companies are shaping
        the conversation.
      </p>
      <p>
        The index is designed for reading and discovery. Topic filters help you
        narrow the feed, search helps you find a story or company, and bookmarks
        keep useful articles close at hand.
      </p>
      <p>
        AtlasCore is an independent project by Shreyansh Swaroop. It links to
        original publishers so you can read the full story at its source.
      </p>
      <div className="border-t border-[#242424] pt-8 text-sm">
        <Link href="/" className="text-zinc-200 underline decoration-[#555] underline-offset-4 hover:text-white">
          Explore the news index
        </Link>
      </div>
    </EditorialPage>
  );
}
