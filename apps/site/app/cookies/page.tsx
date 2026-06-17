import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Cookie Policy | Practical Informatics",
  description:
    "How Practical Informatics LLC uses cookies and similar technologies on practicalinformatics.com.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Cookie Policy | Practical Informatics",
    description:
      "How Practical Informatics LLC uses cookies and similar technologies on practicalinformatics.com.",
    url: `${SITE.url}/cookies`,
  },
};

export default function Page() {
  return (
    <PolicyPage
      title="Cookie Policy"
      intro="What cookies and similar technologies this site uses, and why."
      gettermsSlug="cookies"
    />
  );
}
