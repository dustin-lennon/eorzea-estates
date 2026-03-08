"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
  const router = useRouter();
  return (
    <div className="prose mx-auto max-w-2xl px-4 py-12 dark:prose-invert">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center text-muted-foreground hover:text-primary transition mb-6 w-fit"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        <span className="text-base">Back</span>
      </button>
      <h1 className="text-2xl font-bold mb-4">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>
      
      <div className="space-y-6 text-sm leading-relaxed text-text-dim">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. What Are Cookies</h2>
          <p>Cookies are small text files stored on your device by your web browser. They are used to remember information about your session.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Cookies We Use</h2>
          <p>Eorzea Estates uses only essential cookies required for the service to function. We do not use any analytics, tracking, advertising, or third-party cookies.</p>
          <div className="mt-4 rounded-lg border border-border-muted overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="px-4 py-2 text-text font-medium">Cookie</th>
                  <th className="px-4 py-2 text-text font-medium">Purpose</th>
                  <th className="px-4 py-2 text-text font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">authjs.session-token</td>
                  <td className="px-4 py-2">Stores your authenticated session (JWT)</td>
                  <td className="px-4 py-2">30 days</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">authjs.csrf-token</td>
                  <td className="px-4 py-2">CSRF protection for authentication forms</td>
                  <td className="px-4 py-2">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">authjs.callback-url</td>
                  <td className="px-4 py-2">Stores redirect URL during OAuth sign-in</td>
                  <td className="px-4 py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Why No Cookie Banner?</h2>
          <p>Under GDPR (and the ePrivacy Directive), consent is not required for cookies that are strictly necessary for the service to function. Since Eorzea Estates only uses essential authentication cookies, no cookie consent banner is legally required.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Managing Cookies</h2>
          <p>You can clear or block cookies through your browser settings. Note that blocking session cookies will prevent you from signing in to Eorzea Estates.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Changes To Policy</h2>
          <p>If we ever add non-essential cookies (analytics, etc.), we will update this policy and implement a proper consent mechanism before doing so.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Contact</h2>
          <p>If you have any questions about this cookie policy, please contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
