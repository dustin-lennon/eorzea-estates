/**
 * Returns the URL to display for a user's avatar.
 *
 * customAvatarUrl (uploaded by the user) takes priority over image (set by OAuth provider).
 * This replaces the `customAvatarUrl ?? image` computation that was previously
 * baked into the NextAuth JWT callback.
 */
export function effectiveImage(user: {
  customAvatarUrl?: string | null
  image?: string | null
}): string | null {
  return user.customAvatarUrl ?? user.image ?? null
}
