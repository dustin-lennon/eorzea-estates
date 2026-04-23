import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavbarMessagesLink } from "@/components/navbar-messages-link"
import { NavbarUserMenu } from "@/components/navbar-user-menu"
import { effectiveImage } from "@/lib/effective-image"
import { getServerSession } from "@/lib/session"

export default async function Navbar() {
  // getServerSession() is React-cached — deduplicates with layout.tsx call (one DB query/request)
  const session = await getServerSession()

  try {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" aria-label="Eorzea Estates home">
            <Image src="/images/logo/eorzea-estates-navbar.svg" alt="Eorzea Estates" width={156} height={48} priority className="h-12 w-auto" />
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/directory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse
            </Link>

            <Link href="/designers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Designers
            </Link>

            <ThemeToggle />

            {session?.user ? (
              <>
                <NavbarMessagesLink />

                <Button asChild size="sm">
                  <Link href="/submit">
                    <Plus className="h-4 w-4 mr-1" />
                    Submit Estate
                  </Link>
                </Button>

                <NavbarUserMenu
                  initialName={session.user.name ?? null}
                  initialImage={effectiveImage(session.user)}
                  initialId={session.user.id!}
                  initialRole={(session.user.role ?? "USER") as import("@/types/roles").UserRole}
                />
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
    )
  } catch (error) {
    // Log error to server logs for debugging
    console.error("Navbar render error:", error, "Session:", session)
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-red-600">Navbar failed to render. Check server logs for details.</span>
        </div>
      </header>
    )
  }
}
