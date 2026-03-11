"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { MoreHorizontal, Eye, EyeOff, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Props {
  estateId: string
  published: boolean
}

export function DashboardEstateActions({ estateId, published }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function togglePublished() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estates/${estateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      })
      if (!res.ok) throw new Error()
      toast.success(published ? "Estate unpublished" : "Estate published")
      router.refresh()
    } catch {
      toast.error("Failed to update estate")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this estate? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/estates/${estateId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Estate deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete estate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {published && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/estate/${estateId}`}>View</Link>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/estate/${estateId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={togglePublished}>
            {published ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
