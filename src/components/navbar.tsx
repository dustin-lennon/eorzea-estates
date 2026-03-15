import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/auth"
import { Plus, LayoutDashboard, LogOut, Settings as SettingsIcon, ShieldCheck, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function Navbar() {
  const session = await auth()

  try {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" aria-label="Eorzea Estates home">
            <Image src="/images/logo/eorzea-estates-navbar.svg" alt="Eorzea Estates" width={0} height={0} className="h-12 w-auto" />
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/directory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse
            </Link>

            <ThemeToggle />

            {session?.user ? (
              <>
                <Button asChild size="sm">
                  <Link href="/submit">
                    <Plus className="h-4 w-4 mr-1" />
                    Submit Estate
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User"} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {session.user.name}
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${session.user.id}`}>
                        <User className="h-4 w-4 mr-2" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    {(session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
                      <DropdownMenuItem asChild>
                        <Link href={session.user.role === "ADMIN" ? "/admin" : "/admin/moderation"}>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <form
                        action={async () => {
                          "use server"
                          await signOut({ redirectTo: "/" })
                        }}
                      >
                        <DropdownMenuItem asChild>
                          <button
                            type="submit"
                            className="flex w-full items-center"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                              <span>Sign out</span>
                          </button>
                        </DropdownMenuItem>
                      </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Sign in with Discord</Link>
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
