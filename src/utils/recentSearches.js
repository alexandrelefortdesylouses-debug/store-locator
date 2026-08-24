// Recent picks from the global command palette (⌘K) — shown at the top of
// the palette when it opens, before any query is typed, so jumping back to
// an optician or folder looked at a minute ago doesn't need retyping the
// same search. Per-device localStorage, same model as the rest of "Mon
// Carnet". Only the type+id is kept (never a label/city snapshot) so a
// renamed folder or an updated store name always shows correctly — the
// caller re-resolves the current label from live data.
const RECENT_KEY = "storeLocator_mycard_recentsearches";
const MAX_RECENTS = 5;

function readRecents() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRecentSearches() {
  return readRecents();
}

export function addRecentSearch(type, id) {
  const current = readRecents().filter((r) => !(r.type === type && r.id === id));
  const updated = [{ type, id }, ...current].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  return updated;
}
