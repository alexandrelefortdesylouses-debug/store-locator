import { getStoreDeptCode } from "./postalCode";

// A handful of stores in stores.json share a town name with a place
// overseas (e.g. "Saint Louis" in Haut-Rhin vs La Réunion, "La Trinité" in
// Alpes-Maritimes vs Martinique, "Saint Claude" in Jura vs Guadeloupe) and
// were geocoded to the wrong one — their postal code is correct (so region/
// department filtering is unaffected), but their lat/lng lands thousands of
// km away, which shows up as e.g. a "Bourgogne-Franche-Comté" store pinned
// in the Caribbean. These bounds only need to be precise enough to catch
// that specific mainland/overseas mix-up, not to model real department
// borders.
const MAINLAND_BOUNDS = { minLat: 41, maxLat: 51.5, minLng: -5.5, maxLng: 9.7 };

// Keyed by the 3-digit overseas-territory postal prefix (see regions.js for
// the 971-976 département ones; 987/988 are collectivities, not
// départements, so they don't appear in regions.js at all — but stores.json
// does have a couple of entries with those postal codes).
const DOMTOM_BOUNDS = {
  971: { minLat: 15.8, maxLat: 18.2, minLng: -63.2, maxLng: -60.9 }, // Guadeloupe + Saint-Barthélemy + Saint-Martin (still zipped under 971 in this data)
  972: { minLat: 14.3, maxLat: 14.9, minLng: -61.3, maxLng: -60.7 }, // Martinique
  973: { minLat: 2, maxLat: 6, minLng: -54.6, maxLng: -51.5 }, // Guyane
  974: { minLat: -21.5, maxLat: -20.8, minLng: 55.2, maxLng: 55.9 }, // La Réunion
  975: { minLat: 46.7, maxLat: 47.2, minLng: -56.5, maxLng: -56.1 }, // Saint-Pierre-et-Miquelon
  976: { minLat: -13.1, maxLat: -12.6, minLng: 44.9, maxLng: 45.3 }, // Mayotte
  987: { minLat: -18, maxLat: -15.5, minLng: -150.5, maxLng: -148.5 }, // French Polynesia (Society Islands)
  988: { minLat: -23, maxLat: -19.5, minLng: 163, maxLng: 168.5 }, // New Caledonia
};

function inBounds(lat, lng, bounds) {
  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}

// True when a store's coordinates are at least plausible for the
// territory implied by its own postal code. Stores with no postal code at
// all have nothing to cross-check against, so they're treated as plausible
// rather than penalized for missing data.
export function hasPlausibleCoordinates(store) {
  if (typeof store.lat !== "number" || typeof store.lng !== "number") return false;
  const deptCode = getStoreDeptCode(store);
  if (!deptCode) return true;
  const domtomBounds = DOMTOM_BOUNDS[deptCode];
  if (domtomBounds) return inBounds(store.lat, store.lng, domtomBounds);
  return inBounds(store.lat, store.lng, MAINLAND_BOUNDS);
}
