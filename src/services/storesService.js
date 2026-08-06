// Swap point: the Admin panel's optician import goes through this file.
// To go live with a real backend, replace this re-export with a new
// implementation that writes to (and reads from) the real database instead
// of localStorage — the app's stores array would then come directly from
// the API rather than needing mergeWithOverrides() at all. See
// storesService.local.js for why the current implementation only affects
// the importing admin's own browser.
export * from "./storesService.local";
