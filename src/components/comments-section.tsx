"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { BadgeCheck, Crown, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Comment {
  id: string
  body: string
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
    role: string
    characters: { characterName: string }[]
  }
}

interface CommentsSectionProps {
  estateId: string
  initialComments: Comment[]
  isLoggedIn: boolean
}

export function CommentsSection({ estateId, initialComments, isLoggedIn }: CommentsSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${estateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (!res.ok) throw new Error()
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setBody("")
    } catch {
      toast.error("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isLoggedIn ? "Leave a comment..." : "Sign in to comment"}
          disabled={!isLoggedIn || submitting}
          rows={3}
          maxLength={1000}
        />
        {isLoggedIn && (
          <Button type="submit" size="sm" disabled={!body.trim() || submitting}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        )}
        {!isLoggedIn && (
          <Button type="button" size="sm" variant="outline" onClick={() => router.push("/login")}>
            Sign in to comment
          </Button>
        )}
      </form>

      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const verifiedChar = comment.user.characters[0]
            const displayName = verifiedChar?.characterName ?? comment.user.name
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.user.image ?? undefined} />
                  <AvatarFallback>{displayName?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {comment.user.role === "ADMIN" && (
                      <Crown className="h-3.5 w-3.5 text-yellow-500" />
                    )}
                    {comment.user.role === "MODERATOR" && (
                      <Shield className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    {verifiedChar && comment.user.role === "USER" && (
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <Link href={`/profile/${comment.user.id}`} className="hover:underline">
                      {displayName}
                    </Link>
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
