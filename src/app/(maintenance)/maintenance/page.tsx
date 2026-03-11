import Image from "next/image"
import Link from "next/link"
import { Wrench } from "lucide-react"

export const metadata = { title: "Under Maintenance — Eorzea Estates" }

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <Image
          src="/images/logo/eorzea-estates-icon.svg"
          alt="Eorzea Estates"
          width={200}
          height={200}
          unoptimized
          priority
        />

        <div className="flex items-center gap-2 text-muted-foreground">
          <Wrench className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-widest">Maintenance</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground">
            We&apos;re making improvements to Eorzea Estates. Check back soon.
          </p>
        </div>

        <Link
          href="/login"
          className="mt-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Sign in as Admin
        </Link>
      </div>
    </div>
  )
}
