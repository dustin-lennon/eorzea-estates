"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, LogOut, Settings as SettingsIcon, ShieldCheck, User } from "lucide-react"
import type { UserRole } from "@/types/roles"
import { effectiveImage } from "@/lib/effective-image"

// Custom event emitted by AvatarSettings after a successful upload/remove.
// Using a browser event avoids dependency on useSession() propagating in time.
export const AVATAR_CHANGED_EVENT = "__eorzea_avatar_changed"

interface Props {
  initialName: string | null
  initialImage: string | null
  initialId: string
  initialRole: UserRole
}

export function NavbarUserMenu({ initialName, initialImage, initialId, initialRole }: Props) {
  const { data: session } = authClient.useSession()
  const [liveImage, setLiveImage] = useState<string | null>(null)

  useEffect(() => {
    function handler(e: Event) {
      setLiveImage((e as CustomEvent<{ url: string | null }>).detail.url)
    }
    window.addEventListener(AVATAR_CHANGED_EVENT, handler)
    return () => window.removeEventListener(AVATAR_CHANGED_EVENT, handler)
  }, [])

  const name = session?.user?.name ?? initialName
  // liveImage wins (set immediately after upload), then session (customAvatarUrl ?? image), then server prop
  const image = liveImage ?? (session?.user ? effectiveImage(session.user) : null) ?? initialImage
  const id = session?.user?.id ?? initialId
  const role = (session?.user?.role ?? initialRole) as UserRole

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
          <AvatarFallback>
            {name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium">{name}</div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={`/profile/${id}`}>
            <User className="h-4 w-4 mr-2" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon className="h-4 w-4 mr-2" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {(role === "ADMIN" || role === "MODERATOR") && (
          <DropdownMenuItem asChild>
            <Link href={role === "ADMIN" ? "/admin" : "/admin/moderation"}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              <span>Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/" } } })}
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
