"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setLoading(true)
    setError("")
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })
    setLoading(false)
    if (error) {
      setError("Something went wrong. Please try again.")
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitted ? (
            <p className="text-sm text-center text-muted-foreground">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              Check your inbox (and spam folder).
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email && handleSubmit()}
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!email || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send reset link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <a href="/login" className="text-primary underline underline-offset-4">
                  Back to sign in
                </a>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
