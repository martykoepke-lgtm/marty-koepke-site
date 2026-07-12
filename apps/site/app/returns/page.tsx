import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Return Policy | Marty Koepke",
  description:
    "Return and refund policy for services purchased from Practical Informatics LLC.",
  alternates: { canonical: "/returns" },
  openGraph: {
    title: "Return Policy | Marty Koepke",
    description:
      "Return and refund policy for services purchased from Practical Informatics LLC.",
    url: `${SITE.url}/returns`,
  },
};

export default function Page() {
  return (
    <PolicyPage
      title="Return Policy"
      intro="How returns and refunds are handled for services purchased from Practical Informatics LLC."
      gettermsSlug="return"
    />
  );
}
