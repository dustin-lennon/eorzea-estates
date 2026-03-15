"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BookOpen, X, Check } from "lucide-react"

interface Collection {
  id: string
  name: string
  description: string | null
  estateCount: number
}

interface Props {
  userId: string
  initialCollections: Collection[]
}

export function CollectionManager({ userId, initialCollections }: Props) {
  const [collections, setCollections] = useState(initialCollections)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [savingNew, setSavingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!newName.trim()) return
    setSavingNew(true)
    try {
      const res = await fetch(`/api/users/${userId}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const created = await res.json() as { id: string; name: string; description: string | null }
      setCollections((prev) => [...prev, { ...created, estateCount: 0 }])
      setNewName("")
      setNewDesc("")
      setCreating(false)
      toast.success("Collection created")
    } catch {
      toast.error("Failed to create collection")
    } finally {
      setSavingNew(false)
    }
  }

  function startEdit(col: Collection) {
    setEditingId(col.id)
    setEditName(col.name)
    setEditDesc(col.description ?? "")
  }

  async function handleEdit(id: string) {
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/users/${userId}/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      })
      if (!res.ok) throw new Error("Failed to update")
      setCollections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: editName.trim(), description: editDesc.trim() || null } : c
        )
      )
      setEditingId(null)
      toast.success("Collection updated")
    } catch {
      toast.error("Failed to update collection")
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/users/${userId}/collections/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setCollections((prev) => prev.filter((c) => c.id !== id))
      toast.success("Collection deleted")
    } catch {
      toast.error("Failed to delete collection")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {collections.length === 0 && !creating ? (
        <div className="text-center py-10 border rounded-xl text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No collections yet.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {collections.map((col) =>
            editingId === col.id ? (
              <div key={col.id} className="rounded-xl border p-4 space-y-2">
                <input
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Collection name"
                  maxLength={80}
                />
                <input
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={300}
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={savingEdit} onClick={() => handleEdit(col.id)}>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div key={col.id} className="rounded-xl border p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${userId}/collections/${col.id}`}
                    className="font-medium brand-link"
                  >
                    {col.name}
                  </Link>
                  {col.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{col.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {col.estateCount} estate{col.estateCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(col)} aria-label="Edit collection">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === col.id}
                    onClick={() => handleDelete(col.id)}
                    aria-label="Delete collection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {creating ? (
        <div className="rounded-xl border p-4 space-y-2">
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            maxLength={80}
            autoFocus
          />
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            maxLength={300}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={savingNew || !newName.trim()} onClick={handleCreate}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName(""); setNewDesc("") }}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Collection
        </Button>
      )}
    </div>
  )
}
