"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BadgeCheck, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllServers } from "@/lib/ffxiv-data"

interface Props {
  existingCode: string | null
  existingCharacterName: string | null
}

export function LodestoneVerifyForm({ existingCode, existingCharacterName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<"search" | "confirm">(existingCode ? "confirm" : "search")
  const [characterName, setCharacterName] = useState(existingCharacterName ?? "")
  const [server, setServer] = useState("")
  const [code, setCode] = useState(existingCode ?? "")
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/lodestone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterName, server }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCode(data.code)
      setStep("confirm")
      toast.success("Character found! Follow the steps below.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Character not found")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch("/api/lodestone/confirm", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Character verified successfully!")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const allServers = getAllServers()

  return (
    <div className="space-y-6">
      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Find your character</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label>Character Name</Label>
                <Input
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Firstname Lastname"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Home World</Label>
                <Input
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="e.g. Balmung"
                  list="servers-list"
                  className="mt-1"
                  required
                />
                <datalist id="servers-list">
                  {allServers.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Find Character"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Add verification code to your Lodestone bio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add the code below to your <strong>character profile bio</strong> on the Lodestone.
                You can remove it after verification.
              </p>

              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-lg font-bold tracking-widest border rounded-lg px-4 py-2 bg-muted text-center">
                  {code}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(code)
                    toast.success("Copied!")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <ol className="text-sm space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>Copy the code above</li>
                <li>
                  Open your character profile on{" "}
                  <a
                    href="https://na.finalfantasyxiv.com/lodestone/my/setting/profile/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5"
                  >
                    the Lodestone <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Paste the code anywhere in your profile bio</li>
                <li>Save the profile, then click Verify below</li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleConfirm} disabled={loading}>
              <BadgeCheck className="h-4 w-4 mr-1.5" />
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStep("search")}
              disabled={loading}
            >
              Use a different character
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
