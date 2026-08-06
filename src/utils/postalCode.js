const ZIP_REGEX = /\b(\d{5})\b/g;
const BP_NUMBER_REGEX = /\bBP\.?\s*\d+/gi;

// A "BP <digits>" postal-box reference earlier in the address is a 5-digit
// run too and would otherwise be mistaken for the postal code (e.g. "BP
// 10525, 44300, NANTES" — matching the *first* 5-digit token grabs the box
// number "10525" and misfiles the store under department 10 instead of the
// real 44). Strip BP references first, then take the *last* remaining
// 5-digit token — the postal code consistently sits right before the city
// name at the end of these addresses. Mirrors the same fix already applied
// in the offline data-import pipeline (scripts/build_stores_from_excel.py,
// extract_expected_zip).
export function getStoreZip(store) {
  const cleaned = store.address.replace(BP_NUMBER_REGEX, "");
  const matches = cleaned.match(ZIP_REGEX);
  return matches ? matches[matches.length - 1] : null;
}

export function getStoreDeptCode(store) {
  const zip = getStoreZip(store);
  if (!zip) return null;
  return zip.startsWith("97") || zip.startsWith("98") ? zip.slice(0, 3) : zip.slice(0, 2);
}
