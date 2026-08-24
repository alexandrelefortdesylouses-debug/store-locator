// Backs "Mon Carnet" > Bloc-Notes Client (dated visit notes) and the
// Performance tab's metrics. Kept separate from the single freeform "note"
// field in utils/myCard.js (used by the map's detail panel): this stores a
// dated, append-only log per store rather than one editable text blob.
// Same per-device localStorage-only model as the rest of "Ma Carte".
const VISIT_NOTES_KEY = "storeLocator_mycard_visitnotes";
const PROSPECT_FIRST_SEEN_KEY = "storeLocator_mycard_prospect_first_seen";

function readObject(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// { [storeId]: Array<{ id, date: ISOString, text }> }, newest entry first.
export function getAllVisitNotes() {
  return readObject(VISIT_NOTES_KEY);
}

// photoId is optional — when set, it references a blob saved separately in
// IndexedDB (see utils/photoStore.js), not stored here; visit notes stay in
// localStorage as plain, small JSON.
export function addVisitNote(storeId, text, photoId = null) {
  const all = getAllVisitNotes();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    text,
    photoId,
  };
  const updated = { ...all, [storeId]: [entry, ...(all[storeId] || [])] };
  localStorage.setItem(VISIT_NOTES_KEY, JSON.stringify(updated));
  return updated;
}

// { [storeId]: ISOString } — the date a store was first ever marked as a
// prospect, used to count "new prospects contacted" over a period without
// recounting a store that's simply still a prospect from before.
export function getProspectFirstSeen() {
  return readObject(PROSPECT_FIRST_SEEN_KEY);
}

export function recordProspectContact(storeId) {
  const seen = getProspectFirstSeen();
  if (seen[storeId]) return seen;
  const updated = { ...seen, [storeId]: new Date().toISOString() };
  localStorage.setItem(PROSPECT_FIRST_SEEN_KEY, JSON.stringify(updated));
  return updated;
}
