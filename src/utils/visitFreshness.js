const MS_PER_DAY = 1000 * 60 * 60 * 24;

// How long since a store's most recent visit note (utils/activity.js entries,
// most-recent-first) — a purely visit-recency signal, deliberately kept
// separate from the fuller composite score in utils/urgency.js (which also
// factors in status and priority). Used only to color the "last visit"
// staleness badge on Ma Carte's map markers (MapView.jsx).
//
// A store with no visit note at all returns null rather than treating it as
// "infinitely stale" — same reasoning as computeUrgency in urgency.js: no
// baseline to compare against isn't the same as overdue, so a
// never-contacted store gets no badge rather than a false alarm.
export function daysSinceLastVisit(entries) {
  const mostRecent = entries?.[0]?.date;
  if (!mostRecent) return null;
  return Math.floor((Date.now() - new Date(mostRecent).getTime()) / MS_PER_DAY);
}

export const FRESHNESS_STALE_DAYS = 30;
export const FRESHNESS_VERY_STALE_DAYS = 60;

// null = fresh enough, no badge needed.
export function getFreshnessBadgeColor(entries) {
  const days = daysSinceLastVisit(entries);
  if (days === null) return null;
  if (days >= FRESHNESS_VERY_STALE_DAYS) return "#dc2626";
  if (days >= FRESHNESS_STALE_DAYS) return "#d97706";
  return null;
}
