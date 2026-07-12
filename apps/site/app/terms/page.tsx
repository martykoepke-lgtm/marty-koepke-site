import type { Metadata } from "next";
import PolicyPage from "@/components/layout/PolicyPage";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms of Service | Marty Koepke",
  description:
    "Terms governing use of martykoepke.com and services offered by Practical Informatics LLC.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | Marty Koepke",
    description:
      "Terms governing use of martykoepke.com and services offered by Practical Informatics LLC.",
    url: `${SITE.url}/terms`,
  },
};

export default function Page() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro="The terms under which you use this site and the services offered by Practical Informatics LLC."
      gettermsSlug="terms-of-service"
    />
  );
}
