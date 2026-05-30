import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DClaw Cost — AI FinOps OS",
  description:
    "Cut cloud spend by 30%. Multi-cloud billing, AI right-sizing, budget alerts, waste detection, and an AI copilot that reads your live data. 12 FinOps features, production-ready.",
  metadataBase: new URL("https://dclaw-cost.vercel.app"),
  openGraph: {
    title: "DClaw Cost — AI FinOps OS",
    description: "Cut cloud spend by 30%. 12 FinOps features, production-ready, open source.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
