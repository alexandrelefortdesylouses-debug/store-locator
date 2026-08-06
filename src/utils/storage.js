const SECRET_CODE_KEY = "storeLocator_secretCode";
const DEFAULT_SECRET_CODE = "1234";
const REVIEWS_KEY_PREFIX = "storeLocator_reviews_";

export function getSecretCode() {
  return localStorage.getItem(SECRET_CODE_KEY) || DEFAULT_SECRET_CODE;
}

export function getReviews(storeId) {
  const raw = localStorage.getItem(REVIEWS_KEY_PREFIX + storeId);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addReview(storeId, review) {
  const reviews = getReviews(storeId);
  const updated = [...reviews, review];
  localStorage.setItem(REVIEWS_KEY_PREFIX + storeId, JSON.stringify(updated));
  return updated;
}
