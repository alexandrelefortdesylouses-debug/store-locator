import { buildGoogleMapsUrls, buildWazeUrl, buildAppleMapsUrl } from "./route";

// Per-device localStorage-only GPS/geolocation preferences (Settings >
// Préférences > GPS & Géolocalisation). Same local-simulation model as the
// rest of the app: no server, so preferences don't follow a rep across
// devices.
const REALTIME_KEY = "storeLocator_gps_realtime_enabled";
const APP_KEY = "storeLocator_gps_preferred_app";
const DEFAULT_ADDRESS_KEY = "storeLocator_gps_default_address";

export const GPS_APPS = { GOOGLE: "google", WAZE: "waze", APPLE: "apple" };

// Real-time GPS access is opted into by default (matches the app's existing
// "Locate me" behavior, which has always used the device's live position).
export function getGpsRealtimeEnabled() {
  const raw = localStorage.getItem(REALTIME_KEY);
  return raw === null ? true : raw === "true";
}

export function setGpsRealtimeEnabled(enabled) {
  localStorage.setItem(REALTIME_KEY, String(enabled));
}

export function getPreferredGpsApp() {
  const raw = localStorage.getItem(APP_KEY);
  return Object.values(GPS_APPS).includes(raw) ? raw : GPS_APPS.GOOGLE;
}

export function setPreferredGpsApp(app) {
  localStorage.setItem(APP_KEY, app);
}

// { label, lat, lng } | null — the fallback routing origin used when
// real-time GPS access is turned off (Domicile/Agence).
export function getDefaultAddress() {
  try {
    const raw = localStorage.getItem(DEFAULT_ADDRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setDefaultAddress(address) {
  if (!address) {
    localStorage.removeItem(DEFAULT_ADDRESS_KEY);
    return null;
  }
  localStorage.setItem(DEFAULT_ADDRESS_KEY, JSON.stringify(address));
  return address;
}

// Single point of truth for "open directions to this store in the rep's
// chosen app" — used by both StoreDetailPanel's "Itinéraire" button and Mon
// Carnet table's GPS action, so both always agree on the saved preference.
export function buildPreferredDirectionsUrl(app, store, origin) {
  switch (app) {
    case GPS_APPS.WAZE:
      return buildWazeUrl([store]);
    case GPS_APPS.APPLE:
      return buildAppleMapsUrl([store], origin);
    case GPS_APPS.GOOGLE:
    default:
      return buildGoogleMapsUrls([store], origin)[0];
  }
}
