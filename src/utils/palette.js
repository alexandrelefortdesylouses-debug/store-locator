// Raw hex values mirroring the brass/champagne gold defined in index.css's
// `@theme` override (amber-600/700) and the deep ink tone (neutral-950).
// Kept in sync manually since these are consumed outside Tailwind classes:
// Leaflet divIcons, canvas-based heatmap gradients, and inline chart bars.
export const GOLD_ACCENT = "#a67c34";
export const NEUTRAL_ACCENT = "#57534e";
export const SILVER_ACCENT = "#98a1ad";
export const BRONZE_ACCENT = "#96603a";
export const INK = "#0f1015";
export const PALE_GOLD = "#e6d2a4";

export const HEATMAP_GRADIENT = {
  0.3: "#f0dfb8",
  0.6: "#c9a45e",
  1: "#8c6526",
};

// Muted "traffic-light" tones for the light CRM statuses (see
// STORE_STATUSES in utils/myCard.js) — kept subdued rather than saturated
// to stay in the same sober register as the rest of the palette.
export const STATUS_COLORS = {
  active_client: "#4c8c68",
  prospect: "#3b6fa8",
  appointment_pending: "#c17d3f",
  refused: "#b3463f",
};

// Used for "Ma Carte" markers that have no status assigned yet.
export const STATUS_NONE_COLOR = NEUTRAL_ACCENT;

// Sales-priority ("potentiel") tiers, styled as a medal ladder (gold >
// silver > bronze) so the three levels read as a hierarchy at a glance
// rather than three arbitrary colors — reinforced further by badge size
// and star count where these are used (see PRIORITY_STARS in myCard.js).
export const PRIORITY_COLORS = {
  high: GOLD_ACCENT,
  medium: SILVER_ACCENT,
  low: BRONZE_ACCENT,
};
export const PRIORITY_NONE_COLOR = "#d4d4d4";

// Mon Carnet's per-row action buttons (Note/RDV/Appeler/GPS) — a distinct
// saturated hue per action so they read as different commands at a glance
// rather than a monotone icon row. Intentionally more vivid than the rest
// of the palette since these are small circular buttons, not large surfaces.
export const ACTION_COLORS = {
  note: "#0284c7",
  rdv: "#d97706",
  call: "#16a34a",
  gps: "#9333ea",
};

// Composite "urgence" tiers (see utils/urgency.js) — deliberately a
// different hue family from STATUS_COLORS/PRIORITY_COLORS so this computed
// signal never gets mistaken for a manually-set field sitting next to it in
// the same row.
export const URGENCY_COLORS = {
  high: "#c0392b",
  medium: "#c17d3f",
  low: "#6b8f5c",
};

// A distinct, non-brand hue for the "zones blanches" prospecting overlay —
// a muted teal, intentionally outside the gold/neutral/status families (and
// away from purple/orange, per the dark-mode "no garish accents" guardrail)
// so it can't be mistaken for a store marker.
export const WHITE_ZONE_COLOR = "#3f8f95";
