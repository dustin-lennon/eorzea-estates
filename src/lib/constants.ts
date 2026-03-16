/** Number of days without activity before a listing is considered potentially stale */
export const STALE_DAYS = 90

/**
 * Returns true if the given date is older than STALE_DAYS days.
 * Uses confirmedActiveAt if available, otherwise falls back to updatedAt.
 */
export function isStale(lastActivity: Date): boolean {
  return (Date.now() - lastActivity.getTime()) / 86_400_000 > STALE_DAYS
}
