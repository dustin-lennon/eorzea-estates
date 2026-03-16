"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { MoreHorizontal, Eye, EyeOff, Pencil, Trash2, ShieldCheck, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EstateVerifyModal } from "@/components/estate-verify-modal"
import type { VerificationStatus } from "@/generated/prisma/client"

interface Props {
  estateId: string
  estateName: string
  estateType: string
  characterName: string
  published: boolean
  verified: boolean
  verificationStatus: VerificationStatus | null
  modReason?: string | null
  isStale?: boolean
}

export function DashboardEstateActions({
  estateId,
  estateName,
  estateType,
  characterName,
  published,
  verified,
  verificationStatus,
  modReason,
  isStale = false,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)

  async function togglePublished() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estates/${estateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to update estate")
      }
      toast.success(published ? "Estate unpublished" : "Estate published")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update estate")
    } finally {
      setLoading(false)
    }
  }

  async function confirmActive() {
    setLoading(true)
    try {
      const res = await fetch(`/api/estates/${estateId}/confirm-active`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Listing confirmed active")
      router.refresh()
    } catch {
      toast.error("Failed to confirm listing")
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

  const canPublish = verified
  const showVerifyItem =
    !verified &&
    verificationStatus !== "QUEUED" &&
    verificationStatus !== "AI_APPROVED" &&
    verificationStatus !== "MOD_APPROVED" &&
    verificationStatus !== "MOD_REJECTED"

  const showRetryItem = verificationStatus === "MOD_REJECTED"

  return (
    <>
      <EstateVerifyModal
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        estateId={estateId}
        estateName={estateName}
        estateType={estateType}
        characterName={characterName}
        verificationStatus={verificationStatus}
        modReason={modReason}
      />

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

            {showVerifyItem && (
              <DropdownMenuItem onClick={() => setVerifyOpen(true)}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify Ownership
              </DropdownMenuItem>
            )}

            {showRetryItem && (
              <DropdownMenuItem onClick={() => setVerifyOpen(true)}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Retry Verification
              </DropdownMenuItem>
            )}

            {canPublish ? (
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
            ) : (
              <DropdownMenuItem disabled title="Verify ownership before publishing">
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </DropdownMenuItem>
            )}

            {isStale && (
              <DropdownMenuItem onClick={confirmActive}>
                <CheckCircle className="h-4 w-4 mr-2 text-yellow-500" />
                Confirm Still Active
              </DropdownMenuItem>
            )}

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
    </>
  )
}
