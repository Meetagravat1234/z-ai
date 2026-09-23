import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { getJobCountDisplay } from "@/lib/job-count";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// generateMetadata — uses a STABLE title (no job count) so Google doesn't
// show stale numbers. The job count appears in the meta description instead,
// which Google refreshes more frequently.
export async function generateMetadata(): Promise<Metadata> {
  const jobCount = await getJobCountDisplay() // e.g. "720+"
  return {
    title: {
      default: "Hirebase — India's AI-Powered Job Portal | Verified Jobs, AI Resume Tools & Mock Interviews",
      template: "%s",
    },
    description: `Find ${jobCount} verified jobs in India. Browse jobs from Google, Amazon, Microsoft, Flipkart, TCS + more. Free AI resume optimizer, ATS score checker, mock interviews & job alerts — all free on Hirebase.`,
    applicationName: "Hirebase",
  keywords: [
    "jobs in India",
    "fresher jobs India",
    "internship jobs India",
    "software engineer jobs Bengaluru",
    "IT jobs India",
    "remote jobs India",
    "AI resume optimizer",
    "ATS score checker",
    "mock interview AI",
    "salary predictor India",
    "job alerts India",
    "company reviews India",
    "walk-in jobs India",
    "Naukri alternative",
    "LinkedIn jobs India",
    "Hirebase",
  ],
  authors: [{ name: "Hirebase" }],
  creator: "Hirebase",
  publisher: "Hirebase",
  metadataBase: new URL("https://www.hirebase.in"),
  alternates: {
    canonical: "https://www.hirebase.in",
  },
  openGraph: {
    title: "Hirebase — India's AI-Powered Job Portal",
    description: `${jobCount} verified jobs in India. Free AI resume optimizer, ATS score checker, mock interviews, salary predictor & job alerts. Browse jobs from Google, Amazon, Flipkart, TCS + more.`,
    siteName: "Hirebase",
    type: "website",
    locale: "en_IN",
    url: "https://www.hirebase.in",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Hirebase — India's AI-Powered Job Portal",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hirebase — India's AI-Powered Job Portal",
    description: `${jobCount} verified jobs in India. Free AI resume optimizer, ATS checker, mock interviews & job alerts.`,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    other: {
      ...(process.env.MS_SITE_VERIFICATION ? { "msvalidate.01": process.env.MS_SITE_VERIFICATION } : {}),
    },
  },
  category: "jobs",
  // Favicon configuration — provides all sizes Google + browsers expect.
  // Google Search results use the 32x32 PNG for the small icon next to URLs.
  // The .ico file is a multi-resolution fallback for older browsers.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/favicon-192x192.png', sizes: '192x192' },
    ],
  },
  manifest: '/site.webmanifest',
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // WebSite + Organization structured data — tells Google:
  // 1. The site name is "Hirebase" (shown in search results as the site name)
  // 2. The logo is at /favicon-512x512.png (shown as the site logo in search results)
  // 3. The search URL pattern (enables Google's sitelinks search box)
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hirebase',
    alternateName: 'Hirebase India',
    url: 'https://www.hirebase.in',
    description: `India's AI-powered job portal with verified jobs, AI resume tools, mock interviews, and email job alerts.`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.hirebase.in/jobs?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hirebase',
    url: 'https://www.hirebase.in',
    logo: 'https://www.hirebase.in/favicon-512x512.png',
    description: "India's AI-powered job portal with verified jobs, AI resume tools, mock interviews, salary insights, and company reviews.",
    areaServed: 'IN',
    sameAs: [
      // Add social media URLs here when available — helps Google connect
      // the brand across the web (improves brand entity recognition)
    ],
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        {/* Google Analytics 4 — only loads if NEXT_PUBLIC_GA4_ID is set */}
        {/* Sign up at https://analytics.google.com → Admin → Create Property → get Measurement ID */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster richColors position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
