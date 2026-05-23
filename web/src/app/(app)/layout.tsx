import Sidebar from "@/components/Sidebar";
import CopilotWidget from "@/components/CopilotWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <CopilotWidget />
    </div>
  );
}
