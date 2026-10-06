import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { PwaRegister, PwaInstallPrompt } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { DatadogRum } from "@/components/DatadogRum";
import { TelemetryFloatingWidget } from "@/components/TelemetryFloatingWidget";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://batting-coach.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BatCoach AI Pro | Real-Time Cricket Batting Biomechanics & Shot AI",
    template: "%s | BatCoach AI Pro",
  },
  description:
    "Olympic-grade cricket batting biomechanics analysis, 3D kinematic angle estimation, and real-time audio coaching feedback powered by VideoMAE and MediaPipe.",
  keywords: [
    "cricket batting coach",
    "AI cricket coach",
    "batting biomechanics",
    "cricket shot analysis",
    "cricket stroke classification",
    "MediaPipe cricket pose estimation",
    "YOLO bat tracking",
    "cover drive biomechanics",
    "virtual batting coach",
    "cricket academy drills",
    "ECB coaching biomechanics",
    "cricket coach ai",
    "Batcoach ai",
    "Cricket Coach AI",
    "Cricket Coach",
    "AI Cricket Coach"
    
  ],
  authors: [{ name: "BatCoach AI Team", url: "https://github.com/Arnavch2024/BattingCoach" }],
  creator: "Arnav Chaudhary",
  publisher: "BatCoach AI Pro",
  category: "Sports Technology",
  applicationName: "BatCoach AI Pro",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BatCoach AI",
  },
  openGraph: {
    title: "BatCoach AI Pro | Real-Time Cricket Batting Biomechanics & Shot AI",
    description:
      "Olympic-grade cricket batting biomechanics analysis, stroke classification, and real-time audio coaching feedback.",
    url: BASE_URL,
    siteName: "BatCoach AI Pro",
    images: [
      {
        url: "/images/front-elbow-alignment.jpg",
        width: 1200,
        height: 630,
        alt: "BatCoach AI Pro - Real-Time Cricket Biomechanics Laboratory",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BatCoach AI Pro | Real-Time Cricket Batting Biomechanics & Shot AI",
    description:
      "Olympic-grade cricket batting biomechanics analysis, stroke classification, and real-time audio coaching feedback.",
    images: ["/images/front-elbow-alignment.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "r5izVX48E9a6OtIX0p-Pe_HEbDzzgY9LyLV3vaM5-K0",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BatCoach AI Pro",
  url: BASE_URL,
  description:
    "Real-time cricket batting biomechanics, dual-mode YOLOv8 bat tracking, and neural stroke analytics.",
  applicationCategory: "SportsApplication",
  operatingSystem: "All modern web browsers (Chrome, Edge, Safari, Firefox)",
  offers: {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  author: {
    "@type": "Organization",
    name: "BatCoach AI",
    url: "https://github.com/Arnavch2024/BattingCoach",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="r5izVX48E9a6OtIX0p-Pe_HEbDzzgY9LyLV3vaM5-K0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BatCoach AI" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Anti-FOUC Theme Detection Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('batcoach_theme');
                  var isDark = false;
                  if (stored === 'dark') {
                    isDark = true;
                  } else if (stored === 'light') {
                    isDark = false;
                  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    isDark = true;
                  }
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        <ThemeProvider>
          <PwaRegister />
          {children}
          <DatadogRum />
          <TelemetryFloatingWidget />
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
