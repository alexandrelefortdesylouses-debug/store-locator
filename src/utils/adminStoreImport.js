import { geocodeAddress as geocodeQuery } from "./geocode";
import { haversineDistanceKm } from "./geo";

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

const NAME_HEADERS = ["nom", "name", "enseigne", "raison sociale", "opticien", "magasin", "store", "store name"];
const ADDRESS_HEADERS = ["adresse", "address", "rue", "street"];
const CITY_HEADERS = ["ville", "city", "commune"];
const POSTAL_HEADERS = ["code postal", "cp", "postal code", "zip", "zip code", "zipcode"];
const BRANDS_HEADERS = ["marques", "brands", "marque", "brand"];
const PHONE_HEADERS = ["telephone", "tel", "phone", "phone number"];
const EMAIL_HEADERS = ["email", "e-mail", "mail"];
const WEBSITE_HEADERS = ["site", "website", "site web"];

export function detectImportColumns(headerRow) {
  const map = {};
  headerRow.forEach((raw, index) => {
    const h = normalizeHeader(raw);
    if (map.name === undefined && NAME_HEADERS.includes(h)) map.name = index;
    else if (map.address === undefined && ADDRESS_HEADERS.includes(h)) map.address = index;
    else if (map.city === undefined && CITY_HEADERS.includes(h)) map.city = index;
    else if (map.postal === undefined && POSTAL_HEADERS.includes(h)) map.postal = index;
    else if (map.brands === undefined && BRANDS_HEADERS.includes(h)) map.brands = index;
    else if (map.phone === undefined && PHONE_HEADERS.includes(h)) map.phone = index;
    else if (map.email === undefined && EMAIL_HEADERS.includes(h)) map.email = index;
    else if (map.website === undefined && WEBSITE_HEADERS.includes(h)) map.website = index;
  });
  return map;
}

function slugify(text) {
  const withoutDiacritics = String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "");
  const slug = withoutDiacritics.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "opticien";
}

function cell(row, columnMap, key) {
  const index = columnMap[key];
  return index !== undefined ? String(row[index] ?? "").trim() : "";
}

// Shared assembly step for both the spreadsheet import (one row per call,
// see parseImportRows below) and the manual "add an optician" form in Ma
// Carte (one call, see AddStoreModal.jsx) — builds the same plain
// store-shaped object (no id/coordinates yet) either path eventually feeds
// into geocodeImportedStores.
export function buildStoreEntry({ name, address, city, postal, brandsRaw, phone, email, website }) {
  const brands = brandsRaw ? brandsRaw.split(/[,;/]/).map((b) => b.trim()).filter(Boolean) : [];
  const fullAddress = address || [postal, city].filter(Boolean).join(" ");

  return {
    name,
    address: fullAddress ? `${fullAddress}${city && !fullAddress.includes(city) ? `, ${city}` : ""}` : city,
    city,
    country: "France",
    brands,
    phone: phone || undefined,
    email: email || undefined,
    website: website || undefined,
  };
}

// Parses uploaded rows (see fileParsing.js) into plain store-shaped objects,
// one per row with a usable name.
export function parseImportRows(rows, columnMap) {
  return rows
    .map((row) => {
      const name = cell(row, columnMap, "name");
      if (!name) return null;
      return buildStoreEntry({
        name,
        address: cell(row, columnMap, "address"),
        city: cell(row, columnMap, "city"),
        postal: cell(row, columnMap, "postal"),
        brandsRaw: cell(row, columnMap, "brands"),
        phone: cell(row, columnMap, "phone"),
        email: cell(row, columnMap, "email"),
        website: cell(row, columnMap, "website"),
      });
    })
    .filter(Boolean);
}

// Client-side geocoding via the same public French government address API
// used by the offline data-generation scripts (scripts/build_stores_from_
// excel.py) — full address first (street + postal code + city), falling
// back to city alone if that doesn't match. See that script's comments for
// why geocoding by city name alone is unreliable (homonymous French
// communes) — this mirrors its fix, in a lighter form suited to an
// interactive import (no offline postal-code cross-validation pass).
export async function geocodeImportedStores(entries, { concurrency = 5, onProgress } = {}) {
  const results = new Array(entries.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++;
      const entry = entries[index];
      const fullQuery = [entry.address, entry.city].filter(Boolean).join(", ");
      let coords = fullQuery ? await geocodeQuery(fullQuery) : null;
      if (!coords && entry.city) coords = await geocodeQuery(entry.city);

      const id = `${slugify(entry.name)}-${slugify(entry.city || "france")}`;
      results[index] = coords
        ? { id, ...entry, lat: coords.lat, lng: coords.lng }
        : { id, ...entry, lat: null, lng: null, geocodeFailed: true };

      done += 1;
      onProgress?.(done, entries.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, worker));
  return results;
}

// Below this distance, two geocoded points are treated as "the same
// address" regardless of how the name was spelled — catches re-imports of
// the same optician under a slightly different name (typo, "Optique" vs
// "Opticien", trailing branch number…). 30m comfortably covers geocoding
// jitter for the same building without flagging genuine next-door
// neighbors.
const DUPLICATE_DISTANCE_KM = 0.03;

function findPotentialDuplicate(entry, existingStores) {
  const entryName = normalize(entry.name);
  const entryCity = normalize(entry.city || "");
  for (const existing of existingStores) {
    if (
      typeof entry.lat === "number" &&
      typeof entry.lng === "number" &&
      typeof existing.lat === "number" &&
      typeof existing.lng === "number" &&
      haversineDistanceKm(entry.lat, entry.lng, existing.lat, existing.lng) < DUPLICATE_DISTANCE_KM
    ) {
      return existing;
    }
    if (entryName && normalize(existing.name) === entryName && normalize(existing.city || "") === entryCity) {
      return existing;
    }
  }
  return null;
}

// Flags each successfully-geocoded entry that appears to already exist in
// the network (same coordinates within ~30m, or the same normalized
// name+city) — imported anyway (an admin re-importing a file to update
// phone/brands for an existing optician is a legitimate use case, not a
// mistake), but surfaced clearly so the admin can review and remove a
// genuine accidental duplicate from the imported-stores list afterward.
export function flagDuplicates(entries, existingStores) {
  return entries.map((entry) => {
    const duplicate = findPotentialDuplicate(entry, existingStores);
    return duplicate
      ? { ...entry, duplicateOfId: duplicate.id, duplicateOfName: duplicate.name }
      : entry;
  });
}
