import EditorialPage from "@/components/EditorialPage";

export default function SubmitNewsPage() {
  return (
    <EditorialPage title="Submit News">
      <p>
        Found an AI story that should appear on AtlasCore? Share the original
        publisher link and a short note about why it matters.
      </p>
      <p>
        Research releases, product announcements, open source projects, and
        company updates are all welcome. A link to the primary source is most
        helpful.
      </p>
      <div className="border-t border-[#242424] pt-8 text-sm">
        <a href="https://github.com/shreyanshswaroop/AtlasCore/issues/new?title=News%20submission%3A%20" target="_blank" rel="noreferrer" className="text-zinc-200 underline decoration-[#555] underline-offset-4 hover:text-white">
          Submit a story on GitHub ↗
        </a>
      </div>
    </EditorialPage>
  );
}
