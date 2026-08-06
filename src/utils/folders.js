// Thematic folders for "Mon Carnet" (e.g. "Tournée Mai", "Focus Dior") — a
// lightweight way to group portfolio stores for a specific purpose, on top
// of the always-on Favoris/status system. Same per-device localStorage-only
// model as the rest of "Ma Carte"/"Mon Carnet" (see utils/myCard.js).
const FOLDERS_KEY = "storeLocator_mycard_folders";
const FOLDER_MEMBERS_KEY = "storeLocator_mycard_folder_members";

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

export function getFolders() {
  return readFolders();
}

export function createFolder(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return readFolders();
  const folder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
  };
  return writeFolders([...readFolders(), folder]);
}

export function deleteFolder(folderId) {
  const folders = writeFolders(readFolders().filter((f) => f.id !== folderId));
  const members = readMembers();
  if (folderId in members) {
    const { [folderId]: _removed, ...rest } = members;
    writeMembers(rest);
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
