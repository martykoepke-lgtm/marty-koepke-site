import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy | Practical Informatics",
  description:
    "How Practical Informatics LLC collects, uses, and protects information from visitors and clients.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | Practical Informatics",
    description:
      "How Practical Informatics LLC collects, uses, and protects information from visitors and clients.",
    url: `${SITE.url}/privacy`,
  },
};

export default function Page() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="How we collect, use, and protect information from visitors and clients of practicalinformatics.com."
      gettermsSlug="privacy"
    />
  );
}
