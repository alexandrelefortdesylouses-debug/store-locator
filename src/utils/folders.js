// Thematic folders and subfolders for "Mon Carnet" (e.g. "Secteur Alpes" >
// "Stations de ski") — a lightweight way to group portfolio stores for a
// specific purpose, on top of the always-on Favoris/status system. Same
// per-device localStorage-only model as the rest of "Ma Carte"/"Mon
// Carnet" (see utils/myCard.js).
//
// A folder is { id, name, color, parentId, createdAt, order }. `parentId`
// is `null` for a top-level folder or another folder's id for a subfolder
// — nesting depth isn't capped, though the UI is only exercised for one
// level in practice. `order` is the mutable position used by "custom"
// sort (drag-and-drop / Monter-Descendre); `createdAt` never changes and
// backs the "Date de création" sort option.
const FOLDERS_KEY = "storeLocator_mycard_folders";
const FOLDER_MEMBERS_KEY = "storeLocator_mycard_folder_members";
const FOLDER_NOTES_KEY = "storeLocator_mycard_folder_notes";
const FOLDER_SORT_KEY = "storeLocator_mycard_folder_sort";

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

export const FOLDER_SORT_MODES = {
  CUSTOM: "custom",
  ALPHA: "alpha",
  COUNT: "count",
  CREATED: "created",
};

// Normalizes folders created before subfolders/custom ordering existed —
// they're missing parentId/createdAt/order, so they'd otherwise all tie at
// the top of every sort. Falls back to array position (stable sort keeps
// their original relative order, which is what the rep already saw).
function normalizeFolder(folder, index) {
  return {
    ...folder,
    parentId: folder.parentId ?? null,
    createdAt: typeof folder.createdAt === "number" ? folder.createdAt : index,
    order: typeof folder.order === "number" ? folder.order : index,
  };
}

function readFolders() {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map(normalizeFolder);
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

// Captures folders + members + notes together so a destructive action that
// touches all three (deleteFolder's cascade) can be undone as a single
// atomic restore, rather than trying to replay the cascade in reverse.
export function snapshotFolderState() {
  return { folders: readFolders(), members: readMembers(), notes: readNotes() };
}

// Overwrites current folders/members/notes with a prior snapshot — used
// only by the "Annuler" undo toast right after a delete, so a wholesale
// overwrite (rather than a merge) is safe: nothing else could have
// legitimately changed this state in the few seconds the toast was up.
export function restoreFolderSnapshot(snapshot) {
  writeFolders(snapshot.folders);
  writeMembers(snapshot.members);
  writeNotes(snapshot.notes);
}

export function createFolder(name, parentId = null) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return readFolders();
  const now = Date.now();
  const folder = {
    id: `folder-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    color: DEFAULT_FOLDER_COLOR,
    parentId: parentId || null,
    createdAt: now,
    order: now,
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

// A folder and all of its descendants, id-only, root first — used by
// deleteFolder (cascade) and by callers that need to know whether a
// currently-selected folder just got deleted along with its parent.
export function getDescendantFolderIds(folders, rootId) {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const next = folders.filter((f) => frontier.includes(f.parentId)).map((f) => f.id);
    ids.push(...next);
    frontier = next;
  }
  return ids;
}

// Deletes a folder and every subfolder nested under it (recursively) —
// leaving a subfolder orphaned with a parentId pointing nowhere would just
// hide it from the tree, so a cascade is the only option that doesn't
// silently strand folders. Doesn't touch the stores themselves, only the
// grouping.
export function deleteFolder(folderId) {
  const all = readFolders();
  const idsToDelete = new Set(getDescendantFolderIds(all, folderId));
  const folders = writeFolders(all.filter((f) => !idsToDelete.has(f.id)));

  const members = readMembers();
  const nextMembers = { ...members };
  let membersChanged = false;
  idsToDelete.forEach((id) => {
    if (id in nextMembers) {
      delete nextMembers[id];
      membersChanged = true;
    }
  });
  if (membersChanged) writeMembers(nextMembers);

  const notes = readNotes();
  const nextNotes = { ...notes };
  let notesChanged = false;
  idsToDelete.forEach((id) => {
    if (id in nextNotes) {
      delete nextNotes[id];
      notesChanged = true;
    }
  });
  if (notesChanged) writeNotes(nextNotes);

  return folders;
}

// Swaps `order` with the previous/next sibling (same parentId) in the
// current custom-order sequence — used by the "Monter"/"Descendre" menu
// actions. A no-op at either end of the sibling list.
export function reorderFolderStep(folderId, direction) {
  const all = readFolders();
  const folder = all.find((f) => f.id === folderId);
  if (!folder) return all;
  const siblings = all.filter((f) => f.parentId === folder.parentId).sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((f) => f.id === folderId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return all;
  const other = siblings[swapIdx];
  return writeFolders(
    all.map((f) => {
      if (f.id === folder.id) return { ...f, order: other.order };
      if (f.id === other.id) return { ...f, order: folder.order };
      return f;
    }),
  );
}

// Drag-and-drop reorder: dropping `draggedId` onto `targetId` reinserts it
// just before the target among their shared siblings, then reassigns
// sequential order values to that whole sibling group. Only reorders
// within the same parent — dropping onto a folder under a different
// parent is a no-op rather than an implicit "move to another parent",
// which isn't something this feature exposes.
export function reorderFolderDrop(draggedId, targetId) {
  const all = readFolders();
  const dragged = all.find((f) => f.id === draggedId);
  const target = all.find((f) => f.id === targetId);
  if (!dragged || !target || dragged.id === target.id || dragged.parentId !== target.parentId) return all;

  const siblings = all.filter((f) => f.parentId === dragged.parentId).sort((a, b) => a.order - b.order);
  const without = siblings.filter((f) => f.id !== draggedId);
  const targetIdx = without.findIndex((f) => f.id === targetId);
  without.splice(targetIdx, 0, dragged);

  const orderById = new Map(without.map((f, i) => [f.id, i]));
  return writeFolders(all.map((f) => (orderById.has(f.id) ? { ...f, order: orderById.get(f.id) } : f)));
}

export function sortFolderSiblings(list, sortMode, countsByFolder = {}) {
  const arr = [...list];
  switch (sortMode) {
    case FOLDER_SORT_MODES.ALPHA:
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case FOLDER_SORT_MODES.COUNT:
      return arr.sort((a, b) => (countsByFolder[b.id] || 0) - (countsByFolder[a.id] || 0));
    case FOLDER_SORT_MODES.CREATED:
      return arr.sort((a, b) => a.createdAt - b.createdAt);
    case FOLDER_SORT_MODES.CUSTOM:
    default:
      return arr.sort((a, b) => a.order - b.order);
  }
}

// Flattens the folder tree into display order (depth-first, each sibling
// group sorted per sortMode) with a `depth` attached — used by
// FolderAssignModal, which shows every folder indented but doesn't need
// the sidebar's expand/collapse or drag interactivity.
export function buildFolderTree(folders, sortMode, countsByFolder = {}) {
  const result = [];
  function walk(parentId, depth) {
    const siblings = sortFolderSiblings(
      folders.filter((f) => (f.parentId || null) === parentId),
      sortMode,
      countsByFolder,
    );
    siblings.forEach((folder) => {
      result.push({ folder, depth });
      walk(folder.id, depth + 1);
    });
  }
  walk(null, 0);
  return result;
}

export function getFolderSortMode() {
  const raw = localStorage.getItem(FOLDER_SORT_KEY);
  return Object.values(FOLDER_SORT_MODES).includes(raw) ? raw : FOLDER_SORT_MODES.CUSTOM;
}

export function setFolderSortMode(mode) {
  localStorage.setItem(FOLDER_SORT_KEY, mode);
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
