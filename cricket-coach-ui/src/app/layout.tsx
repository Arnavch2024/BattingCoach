import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { PwaRegister, PwaInstallPrompt } from "@/components/pwa-register";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "BatCoach AI Pro | Real-Time Batting Biomechanics & Shot AI",
  description: "Olympic-grade cricket batting biomechanics analysis, stroke classification, and real-time audio coaching feedback powered by VideoMAE and MediaPipe.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BatCoach AI",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BatCoach AI" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">
        <PwaRegister />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
