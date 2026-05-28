import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { SITE, META } from "@/lib/content";
import { CONTACT_EMAIL, SOCIAL, MARTYKOEPKE_URL } from "@/lib/links";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RouteTransition from "@/components/motion/RouteTransition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: META.home.title,
    template: "%s",
  },
  description: META.home.description,
  authors: [{ name: "Marty Koepke" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: META.home.title,
    description: META.home.description,
    locale: "en_US",
    images: [
      {
        url: "/images/hero-bg.jpg",
        width: 1914,
        height: 822,
        alt: "A great oak at golden hour — calm, grounded, durable.",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: META.home.title,
    description: META.home.description,
    images: [
      {
        url: "/images/hero-bg.jpg",
        alt: "A great oak at golden hour — calm, grounded, durable.",
      },
    ],
  },
  robots: "index, follow",
  // App-router auto-discovery: app/icon.png is served as the favicon
  // and its <link rel="icon"> tag is emitted automatically.
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE.url}/#org`,
  name: SITE.name,
  legalName: SITE.legalName,
  alternateName: "Practical Informatics — AI Visibility for Small Businesses",
  description: META.home.description,
  disambiguatingDescription:
    "Practical Informatics LLC at practicalinformatics.com (no hyphen). Founded August 13, 2024 by Marty Koepke (California Secretary of State entity number 202463415854). Productized AI visibility audits and informatics consulting for established small professional-service firms across the United States. Not affiliated with practical-informatics.com (a different, unrelated entity), nor with the terminated entities 'Practical Informatics, LLC' (2017) or 'Practical Solution in Medical Informatics Consulting, LLC' (2005).",
  slogan: SITE.tagline,
  url: SITE.url,
  email: CONTACT_EMAIL,
  foundingDate: "2024-08-13",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "California Secretary of State Entity Number",
    value: "202463415854",
  },
  foundingLocation: {
    "@type": "Place",
    name: "California",
  },
  image: `${SITE.url}/images/hero-bg.jpg`,
  logo: `${SITE.url}/images/logo-horizontal.png`,
  address: {
    "@type": "PostalAddress",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: { "@type": "Country", name: "United States" },
  knowsAbout: [
    "AI visibility",
    "Generative engine optimization",
    "Answer engine optimization",
    "AI search optimization",
    "LLM visibility",
    "Schema.org structured data",
    "Business process improvement",
    "Workflow optimization",
    "AI implementation",
    "Lean Six Sigma",
    "Healthcare informatics",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Practical Informatics Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI Visibility Index",
          description:
            "A six-dimension audit of how AI agents (Claude, ChatGPT, Gemini) describe your business, with the top five prioritized fixes.",
        },
        price: "697",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI Visibility Implementation Sprint",
          description:
            "Two-week done-for-you implementation of the top five fixes from the AI Visibility Index, with a 60-day re-scan.",
        },
        price: "3997",
        priceCurrency: "USD",
      },
    ],
  },
  founder: {
    "@type": "Person",
    "@id": `${SITE.url}/#marty-koepke`,
    name: "Marty Koepke",
    alternateName: "Marty Koepke, MHA",
    gender: "Female",
    pronouns: "she/her",
    jobTitle: "Founder, Practical Informatics LLC",
    description:
      "Twenty years in healthcare informatics. Author of Between the Clicks: The Hidden Work of Healthcare Informatics. Combines enterprise informatics experience with hands-on AI implementation for small businesses.",
    sameAs: [SOCIAL.linkedin, SOCIAL.facebook, MARTYKOEPKE_URL],
  },
  sameAs: [SOCIAL.linkedin, SOCIAL.facebook, MARTYKOEPKE_URL],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: CONTACT_EMAIL,
    areaServed: "US",
    availableLanguage: "English",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href={`${SITE.url}/llms.txt`}
          title="LLM-readable site summary"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${lora.variable} font-sans antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-forest focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <Navbar />
        <RouteTransition>
          <main id="main">{children}</main>
        </RouteTransition>
        <Footer />
      </body>
    </html>
  );
}
