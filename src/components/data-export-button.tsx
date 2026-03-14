"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function DataExportButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleExport() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/export")
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const filename =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "eorzea-estates-export.json"

      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Your data export has been downloaded.")
    } catch {
      toast.error("Failed to export data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
      <Download className="h-4 w-4 mr-2" />
      {isLoading ? "Preparing export…" : "Download My Data"}
    </Button>
  )
}
