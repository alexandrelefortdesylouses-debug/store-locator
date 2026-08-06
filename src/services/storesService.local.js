// Local (localStorage-only) implementation of the "admin store overrides"
// layer used by the Excel/CSV optician import in the Admin panel. Same
// caveat as authService.local.js: stores.json is a static file shipped to
// every visitor, and this app has no backend, so an import done here only
// changes what THIS browser sees layered on top of it — it does not update
// the real, shared dataset for anyone else. See storesService.js for the
// swap point to a real backend later.
const OVERRIDES_KEY = "storeLocator_admin_store_overrides";

function readOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOverrides(list) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(list));
  return list;
}

export function getOverrides() {
  return readOverrides();
}

// Adds new stores or updates existing ones (matched by id) — brands are
// merged (union) rather than replaced, so importing an update file doesn't
// accidentally drop brands added in a previous import.
export function upsertStores(newEntries) {
  const existing = readOverrides();
  const byId = new Map(existing.map((s) => [s.id, s]));
  newEntries.forEach((entry) => {
    const prev = byId.get(entry.id);
    if (prev) {
      const brands = [...new Set([...(prev.brands || []), ...(entry.brands || [])])];
      byId.set(entry.id, { ...prev, ...entry, brands });
    } else {
      byId.set(entry.id, entry);
    }
  });
  return writeOverrides([...byId.values()]);
}

export function removeOverride(id) {
  return writeOverrides(readOverrides().filter((s) => s.id !== id));
}

// Merges the base (static stores.json) dataset with local admin overrides:
// an override replaces a base store with the same id, and any override
// with a new id is appended.
export function mergeWithOverrides(baseStores) {
  const overrides = readOverrides();
  if (overrides.length === 0) return baseStores;
  const overrideIds = new Set(overrides.map((s) => s.id));
  return [...baseStores.filter((s) => !overrideIds.has(s.id)), ...overrides];
}
