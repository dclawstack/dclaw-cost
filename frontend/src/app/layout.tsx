import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import CopilotWidget from "@/components/CopilotWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DClaw Cost — Cloud Cost Optimization",
  description: "AI-powered FinOps platform for multi-cloud cost management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <CopilotWidget />
        </div>
      </body>
    </html>
  );
}
