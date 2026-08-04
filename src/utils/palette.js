// Raw hex values mirroring the brass/champagne gold defined in index.css's
// `@theme` override (amber-600/700) and the deep ink tone (neutral-950).
// Kept in sync manually since these are consumed outside Tailwind classes:
// Leaflet divIcons, canvas-based heatmap gradients, and inline chart bars.
export const GOLD_ACCENT = "#a67c34";
export const NEUTRAL_ACCENT = "#57534e";
export const INK = "#0b0c0e";
export const PALE_GOLD = "#e6d2a4";

export const HEATMAP_GRADIENT = {
  0.3: "#f0dfb8",
  0.6: "#c9a45e",
  1: "#8c6526",
};
