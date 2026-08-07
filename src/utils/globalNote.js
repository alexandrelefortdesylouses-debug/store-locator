// Single freeform note living in Mon Carnet's "Bloc-Notes" tab, stored as
// HTML so it can embed atomic @mention badges inline with the free text.
// Per-device localStorage only, auto-saved on a debounce (see
// CarnetNotesTab) — never described as real Cloud sync in the UI, same
// local-simulation model as the rest of this app.
const GLOBAL_NOTE_KEY = "storeLocator_carnet_global_note";

export function getGlobalNoteHtml() {
  try {
    return localStorage.getItem(GLOBAL_NOTE_KEY) || "";
  } catch {
    return "";
  }
}

export function setGlobalNoteHtml(html) {
  localStorage.setItem(GLOBAL_NOTE_KEY, html);
}
