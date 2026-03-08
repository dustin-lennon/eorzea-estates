"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  const router = useRouter()
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
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Who We Are</h2>
          <p>
            Eorzea Estates is a fan-made housing directory for Final Fantasy XIV players. For privacy inquiries, contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> Discord OAuth profile (user ID, username, avatar, email address)</li>
            <li><strong>Character data:</strong> FFXIV character name, server, and profile information fetched from the Lodestone</li>
            <li><strong>Lodestone character data:</strong> When you choose to verify a character, we fetch publicly available data (character name, server, Free Company, avatar, etc.) from the FFXIV Lodestone. This data is collected only at your explicit request and is not shared with third parties.</li>
            <li><strong>User content:</strong> Estate listings, comments, likes, uploaded images</li>
            <li><strong>Technical data:</strong> Session tokens (JWT), timestamps of account creation and activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Purpose of Processing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Providing the estate directory and related services</li>
            <li>Authenticating your identity</li>
            <li>Displaying character and estate profiles to other users</li>
            <li>Sending transactional notifications about account activity (e.g. FC estate ownership changes)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. We Do Not Sell Your Data</h2>
          <p>
            Eorzea Estates does <strong>not</strong> sell, rent, trade, or otherwise share your personal information with third parties for their commercial purposes. This applies to all users, including California residents under the California Consumer Privacy Act (CCPA/CPRA).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you delete your account, all personal data (profile, listings, comments, likes) will be permanently removed within 30 days. Anonymized, aggregated data may be retained for service improvement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Privacy Rights</h2>
          <p className="mb-2">Depending on your location, you may have rights including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — Request a copy of all personal data we hold about you</li>
            <li><strong>Correction</strong> — Correct inaccurate or incomplete data</li>
            <li><strong>Deletion</strong> — Request deletion of your personal data</li>
            <li><strong>Portability</strong> — Receive your data in a structured, machine-readable format</li>
            <li><strong>Opt-out of sale</strong> — We do not sell data, so this right is already satisfied</li>
          </ul>
          <p className="mt-2">
            <strong>California residents (CCPA/CPRA):</strong> You have the right to know what personal information is collected, to delete it, to correct it, and to opt out of its sale (we do not sell it). To exercise your rights, email <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>. We will respond within 45 days as required by law.
          </p>
          <p className="mt-2">
            <strong>EU/EEA residents (GDPR):</strong> Legal basis for processing is consent (account creation), contract performance, and legitimate interest (service operation) per GDPR Art. 6. You also have the right to lodge a complaint with your local supervisory authority.
          </p>
          <p className="mt-2">
            For all other requests, email <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Cookies</h2>
          <p>
            Eorzea Estates uses only essential session cookies required for authentication (Auth.js). We do not use analytics, tracking, or advertising cookies. See our <a href="/cookie-policy" className="brand-link">Cookie Policy</a> for details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Third-Party Services</h2>
          <p className="mb-2">We use the following third-party services to operate this site. Each has access only to the data necessary to perform their function:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Discord OAuth (Discord Inc.):</strong> Used for sign-in. We receive your Discord user ID, username, avatar, and email. See <a href="https://discord.com/privacy" className="brand-link" target="_blank" rel="noopener noreferrer">Discord&apos;s Privacy Policy</a>.
            </li>
            <li>
              <strong>FFXIV Lodestone (Square Enix):</strong> When you verify a character, we access publicly available Lodestone profile pages. No private Square Enix data is accessed.
            </li>
            <li>
              <strong>Cloudinary (Cloudinary Ltd.):</strong> Used to store and serve estate listing images you upload. Images are stored on Cloudinary&apos;s servers. See <a href="https://cloudinary.com/privacy" className="brand-link" target="_blank" rel="noopener noreferrer">Cloudinary&apos;s Privacy Policy</a>.
            </li>
            <li>
              <strong>Resend (Resend Inc.):</strong> Used to send transactional emails (e.g. estate transfer notifications). Your email address is transmitted to Resend solely to deliver these messages. See <a href="https://resend.com/legal/privacy-policy" className="brand-link" target="_blank" rel="noopener noreferrer">Resend&apos;s Privacy Policy</a>.
            </li>
            <li>
              <strong>Supabase (Supabase Inc.):</strong> Provides the PostgreSQL database where your account and estate data is stored. See <a href="https://supabase.com/privacy" className="brand-link" target="_blank" rel="noopener noreferrer">Supabase&apos;s Privacy Policy</a>.
            </li>
            <li>
              <strong>Vercel (Vercel Inc.):</strong> Hosts and serves the application. Vercel may process request metadata (IP address, browser agent) as part of normal web hosting. See <a href="https://vercel.com/legal/privacy-policy" className="brand-link" target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Data Security</h2>
          <p>
            We use HTTPS encryption in transit, OAuth authentication, and JWT-based sessions. Access to the database is restricted to authorized personnel only. In the event of a data breach that affects your personal information, we will notify affected users as required by applicable U.S. state law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">10. Children&apos;s Privacy (COPPA)</h2>
          <p>
            Eorzea Estates is not directed to children under 13 years of age and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a> and we will promptly delete the information. The service requires users to be at least 18 years old.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Significant changes will be communicated via the platform. The &quot;last updated&quot; date at the top of this page reflects the most recent revision. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">12. Contact</h2>
          <p>
            For any privacy-related questions or requests, contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
