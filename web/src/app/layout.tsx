import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DClaw Cost — AI-Powered Cloud Cost Optimization",
  description:
    "Cut cloud spend by 30%. Unified multi-cloud billing, AI-driven recommendations, budget alerts, and carbon reporting — all powered by your live cost data.",
  metadataBase: new URL("https://dclaw-cost.vercel.app"),
  openGraph: {
    title: "DClaw Cost — AI-Powered Cloud Cost Optimization",
    description: "Cut cloud spend by 30% with AI-powered FinOps.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
