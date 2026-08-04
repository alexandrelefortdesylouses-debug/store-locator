// Fixed radius/blur/opacity values look great for the full 5,500-store
// network but wash out to near-nothing when a filter narrows the map down
// to a handful of points (a niche brand, one city…). Scale the visual
// weight of each point inversely with how many are on screen so a sparse
// selection still reads as "heat" and a dense one doesn't merge into one
// indistinct blob.
const TIERS = [
  { maxCount: 20, radius: 46, blur: 36, minOpacity: 0.45, intensity: 1 },
  { maxCount: 100, radius: 34, blur: 27, minOpacity: 0.32, intensity: 0.85 },
  { maxCount: 500, radius: 25, blur: 21, minOpacity: 0.22, intensity: 0.7 },
  { maxCount: 2000, radius: 19, blur: 16, minOpacity: 0.16, intensity: 0.55 },
  { maxCount: Infinity, radius: 14, blur: 12, minOpacity: 0.1, intensity: 0.45 },
];

export function getHeatmapCalibration(count) {
  const tier = TIERS.find((t) => count <= t.maxCount) || TIERS[TIERS.length - 1];
  const { radius, blur, minOpacity, intensity } = tier;
  return { radius, blur, minOpacity, intensity };
}
