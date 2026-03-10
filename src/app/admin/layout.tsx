import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LayoutDashboard, Users, FileText, ShieldCheck } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/")

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-card px-3 py-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            Users & Roles
          </Link>
          <Link
            href="/admin/legal"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Legal Pages
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
