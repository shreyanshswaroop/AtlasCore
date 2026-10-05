import Link from "next/link";

import EditorialPage from "@/components/EditorialPage";

export default function PrivacyPage() {
  return (
    <EditorialPage title="Privacy Policy">
      <p>
        This page explains how the current AtlasCore application handles
        information when you use it.
      </p>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">Account information</h2>
        <p>
          If you create an account, AtlasCore stores your name, email address,
          password hash, occupation, topic and content preferences, and saved
          articles and lists. These details support your account and personalize
          your reading experience.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">Sign-in data</h2>
        <p>
          AtlasCore uses an authentication token to keep you signed in. The
          application sets a sign-in cookie and may also store a token in your
          browser. Signing out clears the current browser session.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">News sources</h2>
        <p>
          Article links take you to third-party publishers. Their websites have
          their own privacy practices, which AtlasCore does not control.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-medium text-zinc-100">Questions</h2>
        <p>For questions about information in your account, use the contact link below.</p>
      </section>
      <p className="border-t border-[#242424] pt-8 text-sm">
        <Link href="/contact" className="text-zinc-200 underline decoration-[#555] underline-offset-4 hover:text-white">Contact AtlasCore</Link>
      </p>
    </EditorialPage>
  );
}
