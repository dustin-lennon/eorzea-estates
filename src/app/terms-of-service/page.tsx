"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center text-muted-foreground hover:text-primary transition mb-6 w-fit"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        <span className="text-base">Back</span>
      </button>
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 8, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-text-dim">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By creating an account or using Eorzea Estates, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>Eorzea Estates is a fan-made housing directory for Final Fantasy XIV players. It allows users to create estate listings linked to their FFXIV characters, browse other estates, and interact with the community.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Account Rules</h2>
          <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>One account per person — duplicate accounts may be removed</li>
              <li>You must provide accurate information during registration</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. User Conduct</h2>
          <ul className="list-disc pl-5 space-y-1">
              <li>Do not harass, bully, or send unsolicited inappropriate content to other users</li>
              <li>Do not impersonate other players or use someone else&apos;s FFXIV character</li>
              <li>Do not upload illegal, explicit, or offensive content</li>
              <li>Do not use the platform for commercial purposes, spam, or solicitation</li>
              <li>Do not attempt to exploit, hack, or disrupt the service</li>
              <li>Do not scrape or collect data from the platform without authorization</li>
          </ul>
          <p className="mt-2">Violation of these rules may result in a warning, profile reset, or immediate account termination.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Lodestone Data & Third-Party Content</h2>
          <p>Eorzea Estates allows users to import their FFXIV character data from the publicly accessible FFXIV Lodestone service operated by Square Enix. This import is performed solely at the user&apos;s explicit request.</p>
          <p className="mt-2">By importing a character, you confirm that you are the rightful owner of that character. Importing characters belonging to other players without their consent is prohibited and may result in account termination.</p>
          <p className="mt-2">Eorzea Estates does not store, cache, or redistribute Lodestone data in bulk. Character data is fetched on-demand and displayed only within the user&apos;s profile or estate listing on the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Profile Moderation</h2>
          <ul className="list-disc pl-5 space-y-1">
              <li>Administrators may send warnings to users whose profiles or behavior do not align with the platform&apos;s purpose</li>
              <li>Profiles may be reset (removing all profile data including name, bio, avatar, and tags) if the content is deemed inappropriate, irrelevant, or in violation of these terms</li>
              <li>Uploaded avatars or images may be removed</li>
              <li>Accounts may be suspended or banned</li>
          </ul>
          <p className="mt-2">Users whose profiles are reset will need to set up their profile again. This action is non-reversible. We encourage users to create profiles and listings that are relevant to FFXIV and the Eorzea Estates community.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Intellectual Property Disclaimer</h2>
          <p>FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd. FINAL FANTASY XIV © SQUARE ENIX CO., LTD. All FFXIV-related content, images, names, and assets are the property of Square Enix.</p>
          <p className="mt-2">Eorzea Estates is a fan-made project and is <strong>not affiliated with, endorsed by, or sponsored by Square Enix</strong>. All character data displayed is publicly available via the Lodestone.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. User Content</h2>
          <p>You retain ownership of content you upload (profile text, images). By uploading, you grant Eorzea Estates a non-exclusive license to display it within the platform. You may delete your content at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Limitation of Liability</h2>
          <ul className="list-disc pl-5 space-y-1">
              <li>Eorzea Estates is provided &quot;as is&quot; without warranties of any kind</li>
              <li>We are not responsible for interactions between users (online or offline)</li>
              <li>We are not responsible for loss of data due to technical issues</li>
              <li>We are not responsible for service interruptions or downtime</li>
              <li>We are not responsible for third-party content or services linked from the platform</li>
          </ul>
          <p className="mt-2">To the maximum extent permitted by law, our total liability is limited to zero, as this is a free, non-commercial service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">10. Termination</h2>
          <p>You may delete your account at any time from your settings page. We reserve the right to suspend or terminate accounts that violate these terms, without prior notice. Upon termination, your data will be handled according to our <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>.</p>
        </section>
 
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">11. Changes to Terms</h2>
          <p>We reserve the right to modify, update, or replace these Terms of Service at any time, for any reason, without prior notice. Changes take effect immediately upon publication.</p>
          <p className="mt-2">All updates to these terms will be communicated through the Changelog section available in the app&apos;s Settings page. It is your responsibility to periodically review the Changelog and these Terms for any changes.</p>
          <p className="mt-2">Your continued use of Eorzea Estates after any changes constitutes your acceptance of the updated terms. If you do not agree with the new terms, you must stop using the platform and delete your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">12. Governing Law</h2>
          <p>These terms are governed by the laws of the United States and applicable state legislation. Any disputes shall be resolved in accordance with applicable U.S. regulations.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">13. Contact</h2>
          <p>Questions about these terms? Contact us at <a href="mailto:privacy@example.com" className="brand-link">privacy@example.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
