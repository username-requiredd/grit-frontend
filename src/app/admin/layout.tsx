import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Guard will now properly read session.user.role
  if (!session || session.user.role !== "ADMIN") {
    redirect("/board"); // Changed from /dashboard
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Grit Admin</h2>
        <nav className="space-y-2">
          <Link href="/admin" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            Overview
          </Link>
          <Link href="/admin/users" className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            Users
          </Link>
          {/* Changed link target from /dashboard to /board */}
          <Link href="/board" className="block p-2 mt-8 text-blue-600 hover:underline">
            ← Back to App
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}