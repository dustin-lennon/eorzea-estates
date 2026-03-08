import Link from "next/link";
import { Shield, Lock, FileText, Cookie, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Settings</h1>
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
      {/* More settings sections can be added here */}
    </div>
  );
}
