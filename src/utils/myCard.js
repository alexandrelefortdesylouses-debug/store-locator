// "Ma Carte" is a per-device personal workspace, not a real multi-user
// account system (this app has no backend) — everything here lives in this
// browser's localStorage only, same as the existing secret-code/review data.
const FAVORITES_KEY = "storeLocator_mycard_favorites";
const PORTFOLIO_KEY = "storeLocator_mycard_portfolio";
const NOTES_KEY = "storeLocator_mycard_notes";
const STATUSES_KEY = "storeLocator_mycard_statuses";
const TAGS_KEY = "storeLocator_mycard_tags";

export const STORE_STATUSES = {
  ACTIVE_CLIENT: "active_client",
  PROSPECT: "prospect",
  APPOINTMENT_PENDING: "appointment_pending",
  REFUSED: "refused",
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
