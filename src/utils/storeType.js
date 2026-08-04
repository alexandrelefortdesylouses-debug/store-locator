// The source data has no store-type field. This is a heuristic classification
// derived from the store name and the number of brands carried — not data
// provided by the client — documented as such in the README.

export const STORE_TYPES = {
  FLAGSHIP: "flagship",
  DEPARTMENT_STORE: "department_store",
  INDEPENDENT: "independent",
};

const DEPARTMENT_STORE_NAMES = [
  "galeries lafayette",
  "printemps",
  "bhv",
  "fnac",
  "monoprix",
  "le bon marche",
  "el corte ingles",
  "harrods",
  "selfridges",
  "karstadt",
];

const FLAGSHIP_KEYWORDS = ["flagship", "concept store"];
const FLAGSHIP_MIN_BRANDS = 3;

export function getStoreType(store) {
  const name = store.name.toLowerCase();

  if (DEPARTMENT_STORE_NAMES.some((n) => name.includes(n))) {
    return STORE_TYPES.DEPARTMENT_STORE;
  }
  if (
    FLAGSHIP_KEYWORDS.some((k) => name.includes(k)) ||
    store.brands.length >= FLAGSHIP_MIN_BRANDS
  ) {
    return STORE_TYPES.FLAGSHIP;
  }
  return STORE_TYPES.INDEPENDENT;
}
