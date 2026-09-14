import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BatCoach AI Pro | Real-Time Batting Biomechanics & Shot AI",
  description: "Elite cricket batting biomechanics analysis, stroke classification, and real-time audio coaching feedback powered by VideoMAE and MediaPipe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">{children}</body>
    </html>
  );
}
