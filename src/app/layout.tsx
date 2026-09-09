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
  title: "CareerNest | Jobs, Companies & AI-Powered Career Tools",
  description:
    "Career intelligence platform: verified jobs, company insights, AI resume optimizer, AI cover letter generator, AI mock interview, salary predictor, and application tracker — built for Indian freshers and professionals.",
  keywords: [
    "jobs",
    "freshers",
    "internships",
    "AI resume optimizer",
    "mock interview",
    "salary predictor",
    "career",
    "India",
    "hiring",
  ],
  authors: [{ name: "CareerNest" }],
  openGraph: {
    title: "CareerNest — Career Intelligence Platform",
    description:
      "Verified jobs, AI resume tools, AI mock interviews, salary predictor, and an application tracker — all in one place.",
    siteName: "CareerNest",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerNest",
    description: "Verified jobs, AI career tools, application tracker.",
  },
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
