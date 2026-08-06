// "Ma Carte" is a per-device personal workspace, not a real multi-user
// account system (this app has no backend) — everything here lives in this
// browser's localStorage only, same as the existing secret-code/review data.
const FAVORITES_KEY = "storeLocator_mycard_favorites";
const PORTFOLIO_KEY = "storeLocator_mycard_portfolio";
const NOTES_KEY = "storeLocator_mycard_notes";
const STATUSES_KEY = "storeLocator_mycard_statuses";
const TAGS_KEY = "storeLocator_mycard_tags";
const PRIORITIES_KEY = "storeLocator_mycard_priorities";
const REP_NAME_KEY = "storeLocator_mycard_repname";

export const STORE_STATUSES = {
  ACTIVE_CLIENT: "active_client",
  PROSPECT: "prospect",
  APPOINTMENT_PENDING: "appointment_pending",
  REFUSED: "refused",
};

// Optional, freeform sales-priority flag on a portfolio store — unlike
// STORE_STATUSES this is never required or shown outside "Mon Carnet".
export const PRIORITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// Star count per tier, so the badge's visual weight (not just its color)
// scales with priority — distinguishable even without color (colorblind
// users, grayscale printouts) and reinforces the gold/silver/bronze
// hierarchy in PRIORITY_COLORS (utils/palette.js).
export const PRIORITY_STARS = {
  high: 3,
  medium: 2,
  low: 1,
};

export const PRESET_TAGS = ["Premium", "Besoin de PLV", "Collection Solaire uniquement"];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getFavorites() {
  return readArray(FAVORITES_KEY);
}

export function toggleFavorite(storeId) {
  const favorites = getFavorites();
  const updated = favorites.includes(storeId)
    ? favorites.filter((id) => id !== storeId)
    : [...favorites, storeId];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

export function getPortfolio() {
  return readArray(PORTFOLIO_KEY);
}

export function addToPortfolio(storeIds) {
  const portfolio = getPortfolio();
  const merged = [...new Set([...portfolio, ...storeIds])];
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(merged));
  return merged;
}

export function resetPortfolio() {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify([]));
  return [];
}

export function getNotes() {
  return readObject(NOTES_KEY);
}

export function setNote(storeId, text) {
  const notes = getNotes();
  const updated = { ...notes };
  if (text.trim()) {
    updated[storeId] = text;
  } else {
    delete updated[storeId];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  return updated;
}

export function getStatuses() {
  return readObject(STATUSES_KEY);
}

export function setStatus(storeId, status) {
  const statuses = getStatuses();
  const updated = { ...statuses };
  if (status) {
    updated[storeId] = status;
  } else {
    delete updated[storeId];
  }
  localStorage.setItem(STATUSES_KEY, JSON.stringify(updated));
  return updated;
}

export function getTags() {
  return readObject(TAGS_KEY);
}

export function setTags(storeId, tags) {
  const allTags = getTags();
  const updated = { ...allTags };
  if (tags.length > 0) {
    updated[storeId] = tags;
  } else {
    delete updated[storeId];
  }
  localStorage.setItem(TAGS_KEY, JSON.stringify(updated));
  return updated;
}

// Freeform rep name used to fill the end-of-day report's header — not a
// real account system (there is none), just a convenience so it doesn't
// need retyping every day on this device.
export function getRepName() {
  try {
    return localStorage.getItem(REP_NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function setRepName(name) {
  localStorage.setItem(REP_NAME_KEY, name);
  return name;
}

export function getPriorities() {
  return readObject(PRIORITIES_KEY);
}

export function setPriority(storeId, priority) {
  const priorities = getPriorities();
  const updated = { ...priorities };
  if (priority) {
    updated[storeId] = priority;
  } else {
    delete updated[storeId];
  }
  localStorage.setItem(PRIORITIES_KEY, JSON.stringify(updated));
  return updated;
}
