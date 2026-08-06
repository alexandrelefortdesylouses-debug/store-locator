// Thematic folders for "Mon Carnet" (e.g. "Tournée Mai", "Focus Dior") — a
// lightweight way to group portfolio stores for a specific purpose, on top
// of the always-on Favoris/status system. Same per-device localStorage-only
// model as the rest of "Ma Carte"/"Mon Carnet" (see utils/myCard.js).
const FOLDERS_KEY = "storeLocator_mycard_folders";
const FOLDER_MEMBERS_KEY = "storeLocator_mycard_folder_members";
const FOLDER_NOTES_KEY = "storeLocator_mycard_folder_notes";

// A fixed, muted palette (distinct from STATUS_COLORS/PRIORITY_COLORS so a
// folder swatch is never mistaken for a status or priority badge sitting
// next to it in the same row) — deliberately just color, no per-swatch
// meaning, since folders are freeform groupings the rep defines themselves.
export const FOLDER_COLORS = {
  blue: "#4a7fb5",
  green: "#5c9c73",
  red: "#c05a52",
  yellow: "#d1a83f",
  purple: "#8b6bb1",
  orange: "#d18a4a",
  gray: "#8a8f98",
};
export const DEFAULT_FOLDER_COLOR = "gray";

function readFolders() {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFolders(list) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(list));
  return list;
}

function readMembers() {
  try {
    const raw = localStorage.getItem(FOLDER_MEMBERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeMembers(map) {
  localStorage.setItem(FOLDER_MEMBERS_KEY, JSON.stringify(map));
  return map;
}

function readNotes() {
  try {
    const raw = localStorage.getItem(FOLDER_NOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeNotes(map) {
  localStorage.setItem(FOLDER_NOTES_KEY, JSON.stringify(map));
  return map;
}

export function getFolders() {
  return readFolders();
}

export function createFolder(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return readFolders();
  const folder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    color: DEFAULT_FOLDER_COLOR,
  };
  return writeFolders([...readFolders(), folder]);
}

export function renameFolder(folderId, name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return readFolders();
  return writeFolders(readFolders().map((f) => (f.id === folderId ? { ...f, name: trimmed } : f)));
}

export function setFolderColor(folderId, color) {
  return writeFolders(readFolders().map((f) => (f.id === folderId ? { ...f, color } : f)));
}

export function deleteFolder(folderId) {
  const folders = writeFolders(readFolders().filter((f) => f.id !== folderId));

  const members = readMembers();
  if (folderId in members) {
    const { [folderId]: _removedMembers, ...restMembers } = members;
    writeMembers(restMembers);
  }

  const notes = readNotes();
  if (folderId in notes) {
    const { [folderId]: _removedNote, ...restNotes } = notes;
    writeNotes(restNotes);
  }

  return folders;
}

export function getFolderMembers() {
  return readMembers();
}

export function addStoreToFolder(folderId, storeId) {
  const members = readMembers();
  const current = members[folderId] || [];
  if (current.includes(storeId)) return members;
  return writeMembers({ ...members, [folderId]: [...current, storeId] });
}

export function removeStoreFromFolder(folderId, storeId) {
  const members = readMembers();
  const current = members[folderId] || [];
  return writeMembers({ ...members, [folderId]: current.filter((id) => id !== storeId) });
}

// Bulk add (never removes) — used by the table's multi-select "add to
// folder" action and by drag-and-drop, where the intent is always "these
// stores belong here now", not a per-store toggle.
export function addStoresToFolder(folderId, storeIds) {
  const members = readMembers();
  const current = members[folderId] || [];
  const merged = [...new Set([...current, ...storeIds])];
  return writeMembers({ ...members, [folderId]: merged });
}

export function getFolderNotes() {
  return readNotes();
}

export function setFolderNote(folderId, text) {
  const notes = readNotes();
  const updated = { ...notes };
  if (text.trim()) {
    updated[folderId] = text;
  } else {
    delete updated[folderId];
  }
  return writeNotes(updated);
}
