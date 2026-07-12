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
        alt: "A great oak at golden hour — the Marty Koepke brand image.",
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
        alt: "A great oak at golden hour — the Marty Koepke brand image.",
      },
    ],
  },
  robots: "index, follow",
  // App-router auto-discovery: app/icon.png is served as the favicon
  // and its <link rel="icon"> tag is emitted automatically.
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${SITE.url}/#org`,
  name: SITE.name,
  legalName: SITE.legalName,
  alternateName: "Marty Koepke — Applied AI Consultancy",
  description: META.home.description,
  disambiguatingDescription:
    "Practical Informatics LLC at martykoepke.com (no hyphen). Applied AI consultancy founded August 13, 2024 by Marty Koepke (CA Secretary of State entity number 202463415854). Provides tools, assessments, and infrastructure that help organizations adopt AI thoughtfully and improve operational efficiency and AI visibility. Not affiliated with practical-informatics.com (a different, unrelated entity), nor with the terminated entities 'Marty Koepke, LLC' (2017) or 'Practical Solution in Medical Informatics Consulting, LLC' (2005).",
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
    name: "Mokelumne Hill, California",
  },
  image: `${SITE.url}/images/hero-bg.jpg`,
  logo: `${SITE.url}/images/logo-horizontal.png`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mokelumne Hill",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  knowsAbout: [
    "Applied AI consulting",
    "AI visibility",
    "Generative engine optimization",
    "Custom software development",
    "Workflow optimization",
    "Business process improvement",
    "AI adoption strategy",
    "Operational efficiency",
  ],
  founder: {
    "@type": "Person",
    "@id": `${SITE.url}/#marty-koepke`,
    name: "Marty Koepke",
    alternateName: "Marty Koepke, MHA",
    gender: "Female",
    pronouns: "she/her",
    jobTitle: "Applied AI Consultant · Founder, Practical Informatics LLC",
    description:
      "Applied AI consultant with twenty years in enterprise informatics. Founder of Practical Informatics LLC. Author of Between the Clicks. Led enterprise informatics strategy for Abridge and Notable across multiple states and EHR platforms.",
    sameAs: [SOCIAL.linkedin, SOCIAL.facebook, MARTYKOEPKE_URL],
  },
  sameAs: [SOCIAL.linkedin, SOCIAL.facebook, MARTYKOEPKE_URL],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: CONTACT_EMAIL,
    areaServed: "US-CA",
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
