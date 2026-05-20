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
        alt: "A great oak overlooking the rolling Calaveras County foothills at golden hour.",
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
        alt: "A great oak overlooking the rolling Calaveras County foothills at golden hour.",
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
  name: SITE.name,
  legalName: SITE.legalName,
  description: META.home.description,
  url: SITE.url,
  email: CONTACT_EMAIL,
  image: `${SITE.url}/images/hero-bg.jpg`,
  logo: `${SITE.url}/images/logo-horizontal.png`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mokelumne Hill",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: SITE.serviceArea.map((name) => ({
    "@type": "AdministrativeArea",
    name,
  })),
  founder: {
    "@type": "Person",
    name: "Marty Koepke",
    jobTitle: "Informatics Consultant",
    description:
      "Fifteen years in healthcare informatics. Now helping foothills small businesses reclaim their time with AI and smarter process.",
    sameAs: [SOCIAL.linkedin, MARTYKOEPKE_URL],
  },
  sameAs: [SOCIAL.linkedin, SOCIAL.facebook, MARTYKOEPKE_URL],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: CONTACT_EMAIL,
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
