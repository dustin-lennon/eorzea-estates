"use client"

import dynamic from "next/dynamic"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

// @uiw/react-md-editor uses browser APIs; must be loaded client-side only
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface Props {
  slug: string
  initialContent: string
}

export function LegalEditor({ slug, initialContent }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)

  const handleChange = useCallback((val?: string) => {
    setContent(val ?? "")
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/legal/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success("Legal page saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div data-color-mode="auto">
        <MDEditor
          value={content}
          onChange={handleChange}
          height={600}
          preview="live"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
