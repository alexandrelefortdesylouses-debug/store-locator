// Shared client-side geocoding helper against the French government's
// public BAN (Base Adresse Nationale) API — the same source used offline by
// scripts/build_stores_from_excel.py. Used by both the admin Excel import
// flow (adminStoreImport.js) and the Settings "default start address" field.
export async function geocodeAddress(query) {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?${new URLSearchParams({ q: query, limit: "1" })}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.geometry.coordinates;
    return { lat, lng, label: feature.properties?.label || query };
  } catch {
    return null;
  }
}
