"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface Props {
  href: string
  children: React.ReactNode
}

export function AdminNavLink({ href, children }: Props) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
      }`}
    >
      {children}
    </Link>
  )
}
