"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { toast } from "sonner"
import { BadgeCheck, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { REGIONS } from "@/lib/ffxiv-data"
import { HowToModal } from "./how-to-modal"

interface Props {
  pendingCharacterId: string | null
  pendingCode: string | null
  pendingCharacterName: string | null
  pendingAvatarUrl: string | null
}

type SearchTab = "name" | "id"

export function LodestoneVerifyForm({
  pendingCharacterId,
  pendingCode,
  pendingCharacterName,
  pendingAvatarUrl,
}: Props) {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState<"search" | "confirm">(
    pendingCharacterId ? "confirm" : "search"
  )
  const [searchTab, setSearchTab] = useState<SearchTab>("name")
  const [characterName, setCharacterName] = useState("")
  const [server, setServer] = useState("")
  const [lodestoneIdInput, setLodestoneIdInput] = useState("")
  const [code, setCode] = useState(pendingCode ?? "")
  const [characterId, setCharacterId] = useState(pendingCharacterId ?? "")
  const [displayName, setDisplayName] = useState(pendingCharacterName ?? "")
  const [displayServer, setDisplayServer] = useState("")
  const [avatarUrl, setAvatarUrl] = useState(pendingAvatarUrl ?? "")
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: Record<string, string> =
        searchTab === "name"
          ? { characterName, server }
          : { lodestoneId: lodestoneIdInput.trim() }

      const res = await fetch("/api/lodestone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCode(data.code)
      setCharacterId(data.characterId)
      setDisplayName(data.characterName ?? "")
      setDisplayServer(data.server && data.dataCenter ? `${data.server} [${data.dataCenter}]` : "")
      setAvatarUrl(data.avatarUrl ?? "")
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
      const res = await fetch("/api/lodestone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.characterName} verified successfully!`)
      await update() // refresh session so navbar reflects new name + avatar immediately
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Find your character</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Search mode tabs */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() => setSearchTab("name")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  searchTab === "name"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Name &amp; World
              </button>
              <button
                type="button"
                onClick={() => setSearchTab("id")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  searchTab === "id"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Lodestone ID
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              {searchTab === "name" ? (
                <>
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
                    <select
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="" disabled>Select home world</option>
                      {REGIONS.flatMap((region) =>
                        region.dataCenters.map((dc) => (
                          <optgroup key={dc.name} label={dc.name}>
                            {dc.servers.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <Label>Lodestone Character ID</Label>
                  <Input
                    value={lodestoneIdInput}
                    onChange={(e) => setLodestoneIdInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 12345678"
                    className="mt-1"
                    inputMode="numeric"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Find your ID in your Lodestone profile URL:{" "}
                    na.finalfantasyxiv.com/lodestone/character/<strong>12345678</strong>/
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Find Character"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <>
          {/* Character preview card */}
          {(displayName || avatarUrl) && (
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-muted shrink-0">
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-base">{displayName}</p>
                    {displayServer && (
                      <p className="text-sm text-muted-foreground">{displayServer}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Add verification code to your Lodestone bio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add the code below to your <strong>character profile bio</strong> on the Lodestone.
                You can remove it after verification.
              </p>

              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm font-bold border rounded-lg px-4 py-3 bg-muted break-all">
                  {code}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(code)
                    toast.success("Copied!")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <HowToModal />

              <ol className="text-sm space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>Copy the code above</li>
                <li>Log in to the Lodestone and open your Character Profile settings</li>
                <li>Paste the code anywhere in your profile bio and save</li>
                <li>Return here and click Verify below</li>
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
