// Raw hex values mirroring the brass/champagne gold defined in index.css's
// `@theme` override (amber-600/700) and the deep ink tone (neutral-950).
// Kept in sync manually since these are consumed outside Tailwind classes:
// Leaflet divIcons, canvas-based heatmap gradients, and inline chart bars.
export const GOLD_ACCENT = "#a67c34";
export const NEUTRAL_ACCENT = "#57534e";
export const SILVER_ACCENT = "#98a1ad";
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

// A distinct, non-brand hue for the "zones blanches" prospecting overlay —
// a muted teal, intentionally outside the gold/neutral/status families (and
// away from purple/orange, per the dark-mode "no garish accents" guardrail)
// so it can't be mistaken for a store marker.
export const WHITE_ZONE_COLOR = "#3f8f95";
