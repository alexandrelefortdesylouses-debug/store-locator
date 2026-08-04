const ZIP_REGEX = /\b(\d{5})\b/;

export function getStoreZip(store) {
  const match = store.address.match(ZIP_REGEX);
  return match ? match[1] : null;
}

export function getStoreDeptCode(store) {
  const zip = getStoreZip(store);
  if (!zip) return null;
  return zip.startsWith("97") || zip.startsWith("98") ? zip.slice(0, 3) : zip.slice(0, 2);
}
