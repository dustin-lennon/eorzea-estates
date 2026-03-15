import Link from "next/link";
import { Shield, Lock, FileText, Cookie, ChevronRight, Database, ScrollText, TriangleAlert, MessageCircle, Mail, Users, Heart, HelpCircle, BadgeCheck, Crown, Compass, ShieldCheck } from "lucide-react";
import { DataExportButton } from "@/components/data-export-button";
import { DeleteAccountButton } from "@/components/delete-account-button";

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Settings</h1>

      <section className="bg-card rounded-xl p-6 mb-8">
        <div className="flex items-center mb-6">
          <Database className="brand-link mr-3" />
          <h2 className="text-lg font-semibold text-primary">Data & Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Per our Privacy Policy, you can request a copy of all personal data we hold on your account — including your profile, estates, characters, comments, and likes.
        </p>
        <DataExportButton />
      </section>

      <section className="bg-card rounded-xl p-6 mb-8">
        <div className="flex items-center mb-6">
          <ScrollText className="brand-link mr-3" />
          <h2 className="text-lg font-semibold text-primary">About</h2>
        </div>
        <ul className="space-y-4">
          <li>
            <Link href="/changelog" className="flex items-center group justify-between hover:bg-accent rounded-lg px-3 py-2 transition">
              <span className="flex items-center">
                <ScrollText className="mr-3 text-muted-foreground group-hover:text-primary transition" />
                <span className="text-foreground">Changelog</span>
              </span>
              <ChevronRight className="mr-3 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </li>
        </ul>
      </section>

      <section className="bg-card rounded-xl p-6 mb-8">
        <div className="flex items-center mb-6">
          <HelpCircle className="brand-link mr-3" />
          <h2 className="text-lg font-semibold text-primary">Icon Guide</h2>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Profile Badges</p>
        <ul className="divide-y divide-border">
          <li className="flex items-center gap-4 py-4">
            <span className="shrink-0">
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="ig-pf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
              <Compass className="h-5 w-5" style={{ stroke: "url(#ig-pf-gradient)" }} aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium text-sm">Pathfinder</p>
              <p className="text-xs text-muted-foreground">One of the first 150 Pathfinders to explore Eorzea Estates</p>
            </div>
          </li>
          <li className="flex items-center gap-4 py-4">
            <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-sm">Verified</p>
              <p className="text-xs text-muted-foreground">FFXIV character verified via Lodestone</p>
            </div>
          </li>
          <li className="flex items-center gap-4 py-4">
            <Shield className="h-5 w-5 text-blue-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-sm">Moderator</p>
              <p className="text-xs text-muted-foreground">Eorzea Estates community moderator</p>
            </div>
          </li>
          <li className="flex items-center gap-4 py-4">
            <Crown className="h-5 w-5 text-yellow-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-sm">Admin</p>
              <p className="text-xs text-muted-foreground">Eorzea Estates team member</p>
            </div>
          </li>
        </ul>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-6 mb-4">Estate Badges</p>
        <ul className="divide-y divide-border">
          <li className="flex items-center gap-4 py-4">
            <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-sm">Ownership Verified</p>
              <p className="text-xs text-muted-foreground">Estate ownership confirmed via screenshot review</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="bg-card rounded-xl p-6 mb-8">
        <div className="flex items-center mb-6">
          <Shield className="brand-link mr-3" />
          <h2 className="text-lg font-semibold text-primary">Legal & Privacy</h2>
        </div>
        <ul className="space-y-4">
          <li>
            <Link href="/privacy-policy" className="flex items-center group justify-between hover:bg-accent rounded-lg px-3 py-2 transition">
              <span className="flex items-center">
                <Lock className="mr-3 text-muted-foreground group-hover:text-primary transition" />
                <span className="text-foreground">Privacy Policy</span>
              </span>
              <ChevronRight className="mr-3 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </li>
          <li>
            <Link href="/terms-of-service" className="flex items-center group justify-between hover:bg-accent rounded-lg px-3 py-2 transition">
              <span className="flex items-center">
                <FileText className="mr-3 text-muted-foreground group-hover:text-primary transition" />
                <span className="text-foreground">Terms of Service</span>
              </span>
              <ChevronRight className="mr-3 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </li>
          <li>
            <Link href="/cookie-policy" className="flex items-center group justify-between hover:bg-accent rounded-lg px-3 py-2 transition">
              <span className="flex items-center">
                <Cookie className="mr-3 text-muted-foreground group-hover:text-primary transition" />
                <span className="text-foreground">Cookie Policy</span>
              </span>
              <ChevronRight className="mr-3 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </li>
        </ul>
      </section>
      <section className="bg-card rounded-xl p-6 mb-8">
        <div className="flex items-center mb-6">
          <MessageCircle className="brand-link mr-3" />
          <h2 className="text-lg font-semibold text-primary">Contact & Feedback</h2>
        </div>
        <ul className="space-y-4">
          <li>
            <a href="mailto:feedback@eorzeaestates.com" className="flex items-center group justify-between hover:bg-accent rounded-lg px-3 py-2 transition">
              <span className="flex items-center">
                <Mail className="mr-3 text-muted-foreground group-hover:text-primary transition" />
                <span className="text-foreground">feedback@eorzeaestates.com</span>
              </span>
              <ChevronRight className="mr-3 text-muted-foreground group-hover:text-primary transition" />
            </a>
          </li>
          <li>
            <a href="https://discord.gg/CMJfbXrwpR" target="_blank" rel="noopener noreferrer" className="flex items-center group justify-between hover:bg-accent rounded-lg px-3 py-2 transition">
              <span className="flex items-center">
                <Users className="mr-3 text-muted-foreground group-hover:text-primary transition" />
                <span className="text-foreground">Discord Server</span>
              </span>
              <ChevronRight className="mr-3 text-muted-foreground group-hover:text-primary transition" />
            </a>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-4 px-3">Found a bug? Have a suggestion? We&apos;d love to hear from you!</p>
      </section>

      <section className="bg-card rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <Heart className="text-rose-500 mr-3 h-5 w-5 fill-rose-500" />
          <h2 className="text-lg font-semibold text-primary">Support Eorzea Estates</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Eorzea Estates is built with love for the FFXIV community. If you enjoy the site and find it useful, consider buying me a coffee ☕ — it helps keep the servers running and the lights on!
        </p>
        <a
          href="https://ko-fi.com/caspiannightworth"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-rose-500/50 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition"
        >
          <Heart className="h-4 w-4 fill-rose-500" />
          Buy Me a Coffee on Ko-fi
        </a>
      </section>

      <section className="bg-card rounded-xl p-6 border border-destructive/40">
        <div className="flex items-center mb-4">
          <TriangleAlert className="text-destructive mr-3 h-5 w-5" />
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
