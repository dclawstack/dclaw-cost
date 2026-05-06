import Link from "next/link";
import { DollarSign } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6">
        <DollarSign className="h-16 w-16 text-brand" />
        <h1 className="text-4xl font-bold text-brand">DClaw Cost</h1>
        <p className="text-lg text-gray-600">Cloud cost optimization</p>
        <Link
          href="/dashboard"
          className="rounded-md bg-brand px-6 py-3 text-white hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
