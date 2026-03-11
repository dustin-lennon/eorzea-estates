import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LayoutDashboard, Users, FileText, ShieldCheck, Flag, SlidersHorizontal } from "lucide-react"
import { AdminNavLink } from "./admin-nav-link"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role
  if (!role || !["ADMIN", "MODERATOR"].includes(role)) redirect("/")

  const isAdmin = role === "ADMIN"

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r px-3 py-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{isAdmin ? "Admin Panel" : "Mod Panel"}</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {isAdmin && (
            <>
              <AdminNavLink href="/admin">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </AdminNavLink>
              <AdminNavLink href="/admin/users">
                <Users className="h-4 w-4" />
                Users & Roles
              </AdminNavLink>
            </>
          )}
          <AdminNavLink href="/admin/moderation">
            <Flag className="h-4 w-4" />
            Moderation
          </AdminNavLink>
          {isAdmin && (
            <>
              <AdminNavLink href="/admin/legal">
                <FileText className="h-4 w-4" />
                Legal Pages
              </AdminNavLink>
              <AdminNavLink href="/admin/settings">
                <SlidersHorizontal className="h-4 w-4" />
                Settings
              </AdminNavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
