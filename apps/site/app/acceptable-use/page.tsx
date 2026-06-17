import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Practical Informatics",
  description:
    "Rules governing acceptable use of practicalinformatics.com and services from Practical Informatics LLC.",
  alternates: { canonical: "/acceptable-use" },
  openGraph: {
    title: "Acceptable Use Policy | Practical Informatics",
    description:
      "Rules governing acceptable use of practicalinformatics.com and services from Practical Informatics LLC.",
    url: `${SITE.url}/acceptable-use`,
  },
};

export default function Page() {
  return (
    <PolicyPage
      title="Acceptable Use Policy"
      intro="What's acceptable — and what isn't — when using this site and the services it describes."
      gettermsSlug="acceptable-use"
    />
  );
}
