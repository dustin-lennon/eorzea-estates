
"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

            <div className="space-y-6 text-sm leading-relaxed text-text-dim">
                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">1. Who We Are</h2>
                    <p>
                        Eorzea Estates is a fan-made housing directory for Final Fantasy XIV players, operated at eorzeaestates.com. For privacy inquiries, contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.
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
                        <li>Sending notifications about account activity</li>
                    </ul>
                    <p>
                        Legal basis (GDPR Art. 6): Consent (account creation), legitimate interest (service operation), and contract performance.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active. If you delete your account, all personal data (profile, listings, comments, likes) will be permanently removed within 30 days. Anonymized, aggregated data may be retained for service improvement.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights (GDPR)</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Access</strong> — Request a copy of all personal data we hold about you</li>
                        <li><strong>Rectification</strong> — Correct inaccurate or incomplete data</li>
                        <li><strong>Erasure</strong> — Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                        <li><strong>Portability</strong> — Receive your data in a structured, machine-readable format</li>
                        <li><strong>Restriction</strong> — Request limited processing of your data</li>
                        <li><strong>Objection</strong> — Object to processing based on legitimate interest</li>
                    </ul>
                    <p>
                        To exercise any of these rights, email <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>. We will respond within 30 days.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">6. Cookies</h2>
                    <p>
                        Eorzea Estates uses only essential session cookies required for authentication (NextAuth.js). We do not use analytics, tracking, or advertising cookies. See our <a href="/settings/cookie-policy" className="brand-link">Cookie Policy</a> for details.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">7. Third-Party Services</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Discord OAuth:</strong> If you sign in with Discord, we receive your email, username, and avatar. See <a href="https://discord.com/privacy" className="brand-link" target="_blank" rel="noopener noreferrer">Discord&apos;s Privacy Policy</a>.
                        </li>
                        <li>
                            <strong>FFXIV Lodestone:</strong> When you verify a character, we access publicly available profile pages on <span className="underline">na.finalfantasyxiv.com</span>. No authentication or private data from Square Enix is accessed. Only data visible on public Lodestone profiles is retrieved.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">8. Data Security</h2>
                    <p>
                        We use HTTPS encryption in transit, OAuth authentication, and JWT-based stateless sessions. Access to the database is restricted to authorized personnel only.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">9. Children</h2>
                    <p>
                        Eorzea Estates is not intended for users under 18 years of age. We do not knowingly collect data from children.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">10. Changes to This Policy</h2>
                    <p>
                        We may update this policy from time to time. Significant changes will be communicated via the platform. Continued use after changes constitutes acceptance.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-foreground mb-2">11. Contact</h2>
                    <p>
                        For any privacy-related questions or requests, contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
