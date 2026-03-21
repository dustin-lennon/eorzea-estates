"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const DiscordIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.015.04.028.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 13.999 13.999 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .028-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
)

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

interface Props {
  initialProviders: string[]
  initialHasPassword: boolean
  email: string | null
  emailVerified: boolean
}

const PROVIDERS = [
  { id: "discord", label: "Discord", Icon: DiscordIcon },
  { id: "google", label: "Google", Icon: GoogleIcon },
]

export function LinkedAccountsSettings({ initialProviders, initialHasPassword, email, emailVerified }: Props) {
  const [providers, setProviders] = useState(initialProviders)
  const [hasPassword, setHasPassword] = useState(initialHasPassword)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const methodCount = providers.length + (hasPassword ? 1 : 0)
  const isOnlyMethod = methodCount <= 1

  async function handleDisconnect(provider: string) {
    setDisconnecting(provider)
    try {
      const res = await fetch("/api/auth/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Failed to disconnect")
        return
      }
      setProviders((prev) => prev.filter((p) => p !== provider))
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected`)
    } finally {
      setDisconnecting(null)
    }
  }

  async function handleSetPassword() {
    setPasswordLoading(true)
    setPasswordError("")
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: hasPassword ? currentPassword : undefined, newPassword, confirmPassword }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to set password")
        return
      }
      toast.success(hasPassword ? "Password updated" : "Password set — you can now sign in with email + password")
      setHasPassword(true)
      setShowPasswordForm(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* OAuth providers */}
      <div className="space-y-3">
        {PROVIDERS.map(({ id, label, Icon }) => {
          const linked = providers.includes(id)
          return (
            <div key={id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon />
                <span className="text-sm font-medium">{label}</span>
                {linked
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-muted-foreground/50" />
                }
              </div>
              {linked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isOnlyMethod || disconnecting === id}
                  title={isOnlyMethod ? "Cannot remove your only login method" : undefined}
                  onClick={() => handleDisconnect(id)}
                >
                  {disconnecting === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signIn(id, { callbackUrl: "/settings" })}
                >
                  Connect
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Email + password */}
      <div className="rounded-lg border border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Email &amp; password</span>
            {hasPassword
              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
              : <XCircle className="h-4 w-4 text-muted-foreground/50" />
            }
          </div>
          {email && emailVerified && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm((v) => !v)}
            >
              {hasPassword ? "Change password" : "Set password"}
            </Button>
          )}
        </div>

        {!email && (
          <p className="text-xs text-muted-foreground">No email address on this account. Sign in with Discord or Google to associate one.</p>
        )}
        {email && !emailVerified && (
          <p className="text-xs text-muted-foreground">Your email address is not yet verified.</p>
        )}
        {email && (
          <p className="text-xs text-muted-foreground">{email}</p>
        )}

        {showPasswordForm && email && emailVerified && (
          <div className="space-y-3 pt-1">
            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSetPassword}
                disabled={
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword ||
                  (hasPassword && !currentPassword) ||
                  passwordLoading
                }
              >
                {passwordLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowPasswordForm(false); setPasswordError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("") }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
