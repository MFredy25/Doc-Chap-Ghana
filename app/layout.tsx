import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gh.doc-chap.com"),

  title: {
    default:
      "Doc Chap Ghana — Book Doctors, Clinics and Healthcare Appointments Online",
    template: "%s | Doc Chap Ghana",
  },

  description:
    "Find doctors, clinics, pharmacies, nurses and midwives in Ghana. Book healthcare appointments online, access teleconsultations and manage your care journey with Doc Chap Ghana.",

  applicationName: "Doc Chap Ghana",

  keywords: [
    "Doc Chap Ghana",
    "doctor Ghana",
    "doctor Accra",
    "book doctor appointment Ghana",
    "medical appointment Ghana",
    "online doctor appointment Ghana",
    "teleconsultation Ghana",
    "online consultation Ghana",
    "clinic Ghana",
    "clinics Accra",
    "find a clinic Ghana",
    "healthcare Ghana",
    "pharmacy Ghana",
    "find pharmacy Ghana",
    "nurse Ghana",
    "home nursing Ghana",
    "midwife Ghana",
    "midwife Accra",
    "pregnancy care Ghana",
    "maternity care Ghana",
    "digital health Ghana",
    "medical records Ghana",
  ],

  authors: [{ name: "Doc Chap Ghana" }],
  creator: "Doc Chap Ghana",
  publisher: "Doc Chap Ghana",
  category: "healthcare",

  alternates: {
    canonical: "https://gh.doc-chap.com",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    title:
      "Doc Chap Ghana — Find Doctors, Clinics and Healthcare Services Online",
    description:
      "Book appointments with doctors and clinics, find pharmacies, nurses and midwives, and access healthcare services more easily with Doc Chap Ghana.",
    url: "https://gh.doc-chap.com",
    siteName: "Doc Chap Ghana",
    locale: "en_GH",
    type: "website",
    countryName: "Ghana",
    images: [
      {
        url: "https://gh.doc-chap.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Doc Chap Ghana — Digital healthcare platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Doc Chap Ghana — Book Doctors, Clinics and Healthcare Appointments Online",
    description:
      "Find healthcare professionals, book appointments online and access healthcare services more easily with Doc Chap Ghana.",
    images: ["https://gh.doc-chap.com/og-image.png"],
  },

  other: {
    "theme-color": "#0d9488",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  name: "Doc Chap Ghana",
  url: "https://gh.doc-chap.com",
  logo: "https://gh.doc-chap.com/logo.png",
  description:
    "A digital healthcare platform in Ghana for booking appointments with doctors and clinics, finding pharmacies, nurses and midwives, and accessing teleconsultation services.",
  email: "contact@doc-chap.com",
  address: {
    "@type": "PostalAddress",
    addressCountry: "GH",
  },
  areaServed: {
    "@type": "Country",
    name: "Ghana",
  },
  medicalSpecialty: [
    "PrimaryCare",
    "Cardiovascular",
    "Gynecologic",
    "Obstetric",
    "Nursing",
    "Pharmacy",
    "MentalHealth",
  ],
  availableService: [
    {
      "@type": "MedicalProcedure",
      name: "Online medical appointment booking",
    },
    {
      "@type": "MedicalProcedure",
      name: "Teleconsultation",
    },
    {
      "@type": "MedicalProcedure",
      name: "Midwife consultation",
    },
    {
      "@type": "MedicalProcedure",
      name: "Home nursing care",
    },
    {
      "@type": "MedicalProcedure",
      name: "Pharmacy search",
    },
    {
      "@type": "MedicalProcedure",
      name: "Patient healthcare journey management",
    },
  ],
  availableLanguage: ["en"],
  sameAs: [
    "https://www.facebook.com/profile.php?id=61585620164450",
    "https://www.instagram.com/doc_chap/",
    "https://www.linkedin.com/company/doc-chap/",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Doc Chap Ghana",
  url: "https://gh.doc-chap.com",
  inLanguage: "en",
  description:
    "A healthcare platform in Ghana to find doctors, clinics, pharmacies, nurses and midwives, and book appointments online.",
  publisher: {
    "@type": "Organization",
    name: "Doc Chap Ghana",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://gh.doc-chap.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GH"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />

            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag("js", new Date());
                gtag("config", "${GA_MEASUREMENT_ID}", {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />

        {children}
      </body>
    </html>
  );
}