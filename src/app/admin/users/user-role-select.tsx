"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UserRole } from "@/types/roles"

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "User",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
}

interface Props {
  userId: string
  currentRole: UserRole
  isSelf: boolean
}

export function UserRoleSelect({ userId, currentRole, isSelf }: Props) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [saving, setSaving] = useState(false)

  async function handleChange(newRole: UserRole) {
    if (isSelf) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      setRole(newRole)
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`)
    } catch {
      toast.error("Failed to update role")
    } finally {
      setSaving(false)
    }
  }

  if (isSelf) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
        {ROLE_LABELS[role]} (you)
      </span>
    )
  }

  return (
    <select
      value={role}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as UserRole)}
      className="text-sm border rounded-md px-2 py-1 bg-background disabled:opacity-50 cursor-pointer"
    >
      <option value="USER">User</option>
      <option value="MODERATOR">Moderator</option>
      <option value="ADMIN">Admin</option>
    </select>
  )
}
