import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hirebase — India's AI-Powered Job Portal | 300+ Verified Jobs",
  description: "Find verified jobs in India with AI-powered tools. Browse 300+ jobs from top companies, optimize your resume with AI, practice mock interviews, check ATS scores, and get email job alerts — all free on Hirebase.",
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
    description: "300+ verified jobs, AI resume tools, mock interviews, salary insights, company reviews, and email job alerts. Free for job seekers in India.",
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
    description: "300+ verified jobs, AI resume tools, mock interviews, and more. Free for Indian job seekers.",
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
    // Google Search Console verification code.
    // Paste ONLY the code value (not "google-site-verification=...").
    // Get it from https://search.google.com/search-console → Settings → Ownership verification → HTML tag
    // Example value: "google1234567890abcdef.html" or just the alphanumeric code.
    // Set via env var GOOGLE_SITE_VERIFICATION in your hosting dashboard so you don't need to redeploy.
    google: process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    other: {
      // Optional: add Microsoft Clarity / Bing Webmaster verification here
      ...(process.env.MS_SITE_VERIFICATION ? { "msvalidate.01": process.env.MS_SITE_VERIFICATION } : {}),
    },
  },
  category: "jobs",
};

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
  return (
    <html lang="en" suppressHydrationWarning>
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
