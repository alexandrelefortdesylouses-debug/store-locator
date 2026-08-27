import { getStoreZip } from "./postalCode";

// Paris intra-muros postal codes map 1:1 to arrondissements: the last two
// digits of a 750XX code — or its historical 751XX variant, used for part
// of the 16th (75016 and 75116 both exist) — ARE the arrondissement number.
// No lookup table needed, unlike department/city which require real geodata.
export function getStoreArrondissement(store) {
  const zip = getStoreZip(store);
  if (!zip || !zip.startsWith("75")) return null;
  const num = parseInt(zip.slice(3), 10);
  if (!Number.isInteger(num) || num < 1 || num > 20) return null;
  return `750${String(num).padStart(2, "0")}`;
}

function ordinal(n) {
  return n === 1 ? "1er" : `${n}e`;
}

// Always the fixed 1-20 range rather than derived from the current data —
// unlike regions/departments/cities, this list is a known constant, and
// showing every arrondissement (even ones with zero results right now)
// keeps the filter predictable as other filters narrow the store list.
export const PARIS_ARRONDISSEMENT_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  const code = `750${String(num).padStart(2, "0")}`;
  return { value: code, label: `${ordinal(num)} – ${code}` };
});
