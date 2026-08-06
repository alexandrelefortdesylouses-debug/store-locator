// Swap point: every consumer in the app imports auth functions from this
// file, never from authService.local.js directly. To go live with a real
// backend (e.g. Supabase or Firebase Auth), replace this re-export with a
// new implementation that has the same exported shape (ROLES,
// DEFAULT_ADMIN_EMAIL, getCurrentUser, signIn, signOut, setPassword,
// getWhitelist, findWhitelistEntry, addWhitelistEntry, removeWhitelistEntry,
// setRole, isAdmin) — no other file needs to change. See authService.local.js's own
// header comment for why the current implementation is a per-device
// simulation, not real multi-user access control.
export * from "./authService.local";
