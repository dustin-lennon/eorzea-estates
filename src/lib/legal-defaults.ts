export type LegalSlug = "privacy-policy" | "terms-of-service" | "cookie-policy"

export interface LegalDefault {
  title: string
  content: string
}

export const LEGAL_DEFAULTS: Record<LegalSlug, LegalDefault> = {
  "privacy-policy": {
    title: "Privacy Policy",
    content: `## 1. Who We Are

Eorzea Estates is a fan-made housing directory for Final Fantasy XIV players. For privacy inquiries, contact us at [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com).

## 2. Data We Collect

- **Account data:** Discord OAuth profile (user ID, username, avatar, email address)
- **Character data:** FFXIV character name, server, and profile information fetched from the Lodestone
- **Lodestone character data:** When you choose to verify a character, we fetch publicly available data (character name, server, Free Company, avatar, etc.) from the FFXIV Lodestone. This data is collected only at your explicit request and is not shared with third parties.
- **User content:** Estate listings, comments, likes, uploaded images
- **Technical data:** Session tokens (JWT), timestamps of account creation and activity

## 3. Purpose of Processing

- Providing the estate directory and related services
- Authenticating your identity
- Displaying character and estate profiles to other users
- Sending transactional notifications about account activity (e.g. FC estate ownership changes)

## 4. We Do Not Sell Your Data

Eorzea Estates does **not** sell, rent, trade, or otherwise share your personal information with third parties for their commercial purposes. This applies to all users, including California residents under the California Consumer Privacy Act (CCPA/CPRA).

## 5. Data Retention

We retain your data for as long as your account is active. If you delete your account, all personal data (profile, listings, comments, likes) will be permanently removed within 30 days. Anonymized, aggregated data may be retained for service improvement.

## 6. Your Privacy Rights

Depending on your location, you may have rights including:

- **Access** — Request a copy of all personal data we hold about you
- **Correction** — Correct inaccurate or incomplete data
- **Deletion** — Request deletion of your personal data
- **Portability** — Receive your data in a structured, machine-readable format
- **Opt-out of sale** — We do not sell data, so this right is already satisfied

**California residents (CCPA/CPRA):** You have the right to know what personal information is collected, to delete it, to correct it, and to opt out of its sale (we do not sell it). To exercise your rights, email [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com). We will respond within 45 days as required by law.

**EU/EEA residents (GDPR):** Legal basis for processing is consent (account creation), contract performance, and legitimate interest (service operation) per GDPR Art. 6. You also have the right to lodge a complaint with your local supervisory authority.

For all other requests, email [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com).

## 7. Cookies

Eorzea Estates uses only essential session cookies required for authentication (Auth.js). We do not use analytics, tracking, or advertising cookies. See our [Cookie Policy](/cookie-policy) for details.

## 8. Third-Party Services

We use the following third-party services to operate this site. Each has access only to the data necessary to perform their function:

- **Discord OAuth (Discord Inc.):** Used for sign-in. We receive your Discord user ID, username, avatar, and email. See [Discord's Privacy Policy](https://discord.com/privacy).
- **FFXIV Lodestone (Square Enix):** When you verify a character, we access publicly available Lodestone profile pages. No private Square Enix data is accessed.
- **Cloudinary (Cloudinary Ltd.):** Used to store and serve estate listing images you upload. Images are stored on Cloudinary's servers. See [Cloudinary's Privacy Policy](https://cloudinary.com/privacy).
- **Resend (Resend Inc.):** Used to send transactional emails (e.g. estate transfer notifications). Your email address is transmitted to Resend solely to deliver these messages. See [Resend's Privacy Policy](https://resend.com/legal/privacy-policy).
- **Supabase (Supabase Inc.):** Provides the PostgreSQL database where your account and estate data is stored. See [Supabase's Privacy Policy](https://supabase.com/privacy).
- **Vercel (Vercel Inc.):** Hosts and serves the application. Vercel may process request metadata (IP address, browser agent) as part of normal web hosting. See [Vercel's Privacy Policy](https://vercel.com/legal/privacy-policy).

## 9. Data Security

We use HTTPS encryption in transit, OAuth authentication, and JWT-based sessions. Access to the database is restricted to authorized personnel only. In the event of a data breach that affects your personal information, we will notify affected users as required by applicable U.S. state law.

## 10. Children's Privacy (COPPA)

Eorzea Estates is not directed to children under 13 years of age and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com) and we will promptly delete the information. The service requires users to be at least 18 years old.

## 11. Changes to This Policy

We may update this policy from time to time. Significant changes will be communicated via the platform. The "last updated" date at the top of this page reflects the most recent revision. Continued use after changes constitutes acceptance.

## 12. Contact

For any privacy-related questions or requests, contact us at [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com).`,
  },

  "terms-of-service": {
    title: "Terms of Service",
    content: `## 1. Acceptance of Terms

By creating an account or using Eorzea Estates, you agree to these Terms of Service. If you do not agree, please do not use the platform.

## 2. Description of Service

Eorzea Estates is a fan-made housing directory for Final Fantasy XIV players. It allows users to create estate listings linked to their FFXIV characters, browse other estates, and interact with the community.

## 3. Account Rules

- You must be at least 18 years old to create an account
- You are responsible for maintaining the security of your account
- One account per person — duplicate accounts may be removed
- You must provide accurate information during registration

## 4. User Conduct

- Do not harass, bully, or send unsolicited inappropriate content to other users
- Do not impersonate other players or use someone else's FFXIV character
- Do not upload illegal, explicit, or offensive content
- Do not use the platform for commercial purposes, spam, or solicitation
- Do not attempt to exploit, hack, or disrupt the service
- Do not scrape or collect data from the platform without authorization

Violation of these rules may result in a warning, profile reset, or immediate account termination.

## 5. Lodestone Data & Third-Party Content

Eorzea Estates allows users to import their FFXIV character data from the publicly accessible FFXIV Lodestone service operated by Square Enix. This import is performed solely at the user's explicit request.

By importing a character, you confirm that you are the rightful owner of that character. Importing characters belonging to other players without their consent is prohibited and may result in account termination.

Eorzea Estates does not store, cache, or redistribute Lodestone data in bulk. Character data is fetched on-demand and displayed only within the user's profile or estate listing on the platform.

## 6. Profile Moderation

- Administrators may send warnings to users whose profiles or behavior do not align with the platform's purpose
- Profiles may be reset (removing all profile data including name, bio, avatar, and tags) if the content is deemed inappropriate, irrelevant, or in violation of these terms
- Uploaded avatars or images may be removed
- Accounts may be suspended or banned

Users whose profiles are reset will need to set up their profile again. This action is non-reversible. We encourage users to create profiles and listings that are relevant to FFXIV and the Eorzea Estates community.

## 7. Intellectual Property Disclaimer

FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd. FINAL FANTASY XIV © SQUARE ENIX CO., LTD. All FFXIV-related content, images, names, and assets are the property of Square Enix.

Eorzea Estates is a fan-made project and is **not affiliated with, endorsed by, or sponsored by Square Enix**. All character data displayed is publicly available via the Lodestone.

## 8. User Content

You retain ownership of content you upload (profile text, images). By uploading, you grant Eorzea Estates a non-exclusive license to display it within the platform. You may delete your content at any time.

## 9. Limitation of Liability

- Eorzea Estates is provided "as is" without warranties of any kind
- We are not responsible for interactions between users (online or offline)
- We are not responsible for loss of data due to technical issues
- We are not responsible for service interruptions or downtime
- We are not responsible for third-party content or services linked from the platform

To the maximum extent permitted by law, our total liability is limited to zero, as this is a free, non-commercial service.

## 10. Termination

You may delete your account at any time from your settings page. We reserve the right to suspend or terminate accounts that violate these terms, without prior notice. Upon termination, your data will be handled according to our [Privacy Policy](/privacy-policy).

## 11. Changes to Terms

We reserve the right to modify, update, or replace these Terms of Service at any time, for any reason, without prior notice. Changes take effect immediately upon publication.

All updates to these terms will be communicated through the Changelog section available in the app's Settings page. It is your responsibility to periodically review the Changelog and these Terms for any changes.

Your continued use of Eorzea Estates after any changes constitutes your acceptance of the updated terms. If you do not agree with the new terms, you must stop using the platform and delete your account.

## 12. Governing Law

These terms are governed by the laws of the United States and applicable state legislation. Any disputes shall be resolved in accordance with applicable U.S. regulations.

## 13. Contact

Questions about these terms? Contact us at [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com).`,
  },

  "cookie-policy": {
    title: "Cookie Policy",
    content: `## 1. What Are Cookies

Cookies are small text files stored on your device by your web browser. They are used to remember information about your session.

## 2. Cookies We Use

Eorzea Estates uses only essential cookies required for the service to function. We do not use any analytics, tracking, advertising, or third-party cookies.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| authjs.session-token | Stores your authenticated session (JWT) | 30 days |
| authjs.csrf-token | CSRF protection for authentication forms | Session |
| authjs.callback-url | Stores redirect URL during OAuth sign-in | Session |

## 3. Why No Cookie Banner?

Under GDPR (and the ePrivacy Directive), consent is not required for cookies that are strictly necessary for the service to function. Since Eorzea Estates only uses essential authentication cookies, no cookie consent banner is legally required.

## 4. Managing Cookies

You can clear or block cookies through your browser settings. Note that blocking session cookies will prevent you from signing in to Eorzea Estates.

## 5. Changes To Policy

If we ever add non-essential cookies (analytics, etc.), we will update this policy and implement a proper consent mechanism before doing so.

## 6. Contact

If you have any questions about this cookie policy, please contact us at [privacy@eorzeaestates.com](mailto:privacy@eorzeaestates.com).`,
  },
}

export const LEGAL_SLUGS: LegalSlug[] = [
  "privacy-policy",
  "terms-of-service",
  "cookie-policy",
]
