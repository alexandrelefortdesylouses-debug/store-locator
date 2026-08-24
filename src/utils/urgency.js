import { STORE_STATUSES } from "./myCard";

// Composite "who needs a follow-up" signal, combining three fields the rep
// otherwise has to cross-reference mentally in three separate columns:
// CRM status, sales priority, and how long it's been since the last visit
// note. Purely computed/derived — never stored, never editable directly —
// so it always reflects the other fields' current values.
export const URGENCY_LEVELS = { HIGH: "high", MEDIUM: "medium", LOW: "low", NONE: "none" };

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const STATUS_WEIGHT = {
  [STORE_STATUSES.PROSPECT]: 2,
  [STORE_STATUSES.APPOINTMENT_PENDING]: 2,
  [STORE_STATUSES.ACTIVE_CLIENT]: 0,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// A refused optician is deliberately excluded from any follow-up signal —
// there's nothing to relaunch. Everything else is scored from 0 upward and
// bucketed into three tiers; a store with no status/priority/visit history
// at all scores 0 and shows no badge, rather than a false "low" alert.
export function computeUrgency({ status, priority, lastVisitDate }) {
  if (status === STORE_STATUSES.REFUSED) return URGENCY_LEVELS.NONE;

  let score = 0;
  score += PRIORITY_WEIGHT[priority] || 0;
  score += STATUS_WEIGHT[status] || 0;

  // Only penalize staleness when there's an actual last-visit date to be
  // stale relative to — a store that's never been noted at all has no
  // "time since visit" signal, and must not be treated as maximally stale.
  if (lastVisitDate) {
    const daysSinceVisit = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / MS_PER_DAY);
    if (daysSinceVisit >= 60) score += 3;
    else if (daysSinceVisit >= 30) score += 2;
    else if (daysSinceVisit >= 14) score += 1;
  }

  if (score >= 6) return URGENCY_LEVELS.HIGH;
  if (score >= 3) return URGENCY_LEVELS.MEDIUM;
  if (score > 0) return URGENCY_LEVELS.LOW;
  return URGENCY_LEVELS.NONE;
}

export const URGENCY_RANK = {
  [URGENCY_LEVELS.HIGH]: 0,
  [URGENCY_LEVELS.MEDIUM]: 1,
  [URGENCY_LEVELS.LOW]: 2,
  [URGENCY_LEVELS.NONE]: 3,
};
