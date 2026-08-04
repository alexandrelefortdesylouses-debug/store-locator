import { getStoreZip } from "./postalCode";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim();
}

function normalizeHeader(header) {
  return normalize(header).replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePostal(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(5, "0").slice(-5);
}

const NAME_HEADERS = ["nom", "name", "enseigne", "raison sociale", "client", "opticien", "magasin", "store", "store name"];
const CITY_HEADERS = ["ville", "city", "commune"];
const POSTAL_HEADERS = ["code postal", "cp", "postal code", "zip", "zip code", "zipcode"];
const SIRET_HEADERS = ["siret", "siren"];

// The client's stores.json has no SIRET field, so a "siret" column (if
// present in the uploaded file) is detected but never used for matching —
// only name/city/postal code can be cross-checked against our data.
export function detectColumns(headerRow) {
  const map = {};
  headerRow.forEach((raw, index) => {
    const h = normalizeHeader(raw);
    if (map.name === undefined && NAME_HEADERS.includes(h)) map.name = index;
    else if (map.city === undefined && CITY_HEADERS.includes(h)) map.city = index;
    else if (map.postal === undefined && POSTAL_HEADERS.includes(h)) map.postal = index;
    else if (map.siret === undefined && SIRET_HEADERS.includes(h)) map.siret = index;
  });
  return map;
}

function buildIndexes(stores) {
  const byNamePostal = new Map();
  const byNameCity = new Map();
  const byName = new Map();

  stores.forEach((store) => {
    const name = normalize(store.name);
    const city = normalize(store.city);
    const postal = getStoreZip(store) || "";

    if (postal) byNamePostal.set(`${name}|${postal}`, store);
    if (city) byNameCity.set(`${name}|${city}`, store);

    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(store);
  });

  return { byNamePostal, byNameCity, byName };
}

// Best-effort last resort: a store whose name contains (or is contained by)
// the imported row's name, restricted to the row's city so generic/franchise
// names ("Optic 2000", "Krys"...) don't produce false positives.
function findPartialMatch(name, city, stores) {
  if (!city) return null;
  const candidates = stores.filter((store) => {
    if (normalize(store.city) !== city) return false;
    const storeName = normalize(store.name);
    return storeName.includes(name) || name.includes(storeName);
  });
  return candidates.length === 1 ? candidates[0] : null;
}

export function matchPortfolioRows(rows, columnMap, stores) {
  const { byNamePostal, byNameCity, byName } = buildIndexes(stores);
  const matched = [];
  const unmatched = [];

  rows.forEach((cells) => {
    const rawName = columnMap.name !== undefined ? cells[columnMap.name] : "";
    const rawCity = columnMap.city !== undefined ? cells[columnMap.city] : "";
    const rawPostal = columnMap.postal !== undefined ? cells[columnMap.postal] : "";

    const name = normalize(rawName);
    const city = normalize(rawCity);
    const postal = normalizePostal(rawPostal);

    if (!name) {
      unmatched.push({ name: rawName, city: rawCity, postal: rawPostal, reason: "missing-name" });
      return;
    }

    let store = null;
    if (postal && byNamePostal.has(`${name}|${postal}`)) {
      store = byNamePostal.get(`${name}|${postal}`);
    } else if (city && byNameCity.has(`${name}|${city}`)) {
      store = byNameCity.get(`${name}|${city}`);
    } else {
      const candidates = byName.get(name);
      if (candidates && candidates.length === 1) {
        store = candidates[0];
      }
    }

    if (!store) {
      store = findPartialMatch(name, city, stores);
    }

    if (store) {
      matched.push({ row: { name: rawName, city: rawCity, postal: rawPostal }, store });
    } else {
      unmatched.push({ name: rawName, city: rawCity, postal: rawPostal, reason: "not-found" });
    }
  });

  return { matched, unmatched };
}
