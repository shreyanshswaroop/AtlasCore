import Link from "next/link";

import EditorialPage from "@/components/EditorialPage";

export default function ContactPage() {
  return (
    <EditorialPage title="Contact">
      <p>Questions, corrections, and feedback help make AtlasCore more useful.</p>
      <p>
        Open an issue in the project repository and include the relevant article
        link or a short description of what you noticed.
      </p>
      <p>
        Have a story that belongs in the index? Visit the <Link href="/submit-news" className="text-zinc-200 underline decoration-[#555] underline-offset-4 hover:text-white">Submit News</Link> page.
      </p>
      <div className="border-t border-[#242424] pt-8 text-sm">
        <a href="https://github.com/shreyanshswaroop/AtlasCore/issues/new" target="_blank" rel="noreferrer" className="text-zinc-200 underline decoration-[#555] underline-offset-4 hover:text-white">
          Open a GitHub issue ↗
        </a>
      </div>
    </EditorialPage>
  );
}
