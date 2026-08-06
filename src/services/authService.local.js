// Local (localStorage-only) implementation of the auth service. This is a
// per-device SIMULATION, not real multi-user security: this app has no
// backend, so there is no server-side identity check, and nothing here
// stops someone from reading the whitelist or granting themselves admin via
// the browser console. It exists to validate the login/whitelist/roles UX
// and workflow ahead of wiring a real backend (see authService.js for the
// swap point, and the README for the full caveat).
//
// Whitelist entries are per-device: an admin who adds an email on their own
// browser won't see that reflected on a colleague's browser. Treat this as
// a working prototype of the feature, not a deployed access-control system.
const WHITELIST_KEY = "storeLocator_auth_whitelist";
const SESSION_KEY = "storeLocator_auth_session";

export const ROLES = {
  ADMIN: "admin",
  COMMERCIAL: "commercial",
};

export const DEFAULT_ADMIN_EMAIL = "a.lefortdesylouses@thelios.com";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function readWhitelist() {
  try {
    const raw = localStorage.getItem(WHITELIST_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fall through to seed the default below
  }
  const seeded = [{ email: DEFAULT_ADMIN_EMAIL, role: ROLES.ADMIN }];
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeWhitelist(list) {
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(list));
  return list;
}

export function getWhitelist() {
  return readWhitelist();
}

export function findWhitelistEntry(email) {
  const target = normalizeEmail(email);
  return readWhitelist().find((entry) => normalizeEmail(entry.email) === target) || null;
}

export function addWhitelistEntry(email, role = ROLES.COMMERCIAL) {
  const target = normalizeEmail(email);
  if (!target) return readWhitelist();
  const list = readWhitelist();
  const existing = list.find((entry) => normalizeEmail(entry.email) === target);
  const updated = existing
    ? list.map((entry) => (normalizeEmail(entry.email) === target ? { email: target, role } : entry))
    : [...list, { email: target, role }];
  return writeWhitelist(updated);
}

// Refuses to remove the last remaining admin, so an admin can never
// accidentally lock everyone (including themselves) out of the admin panel
// on this device.
export function removeWhitelistEntry(email) {
  const target = normalizeEmail(email);
  const list = readWhitelist();
  const entry = list.find((e) => normalizeEmail(e.email) === target);
  if (!entry) return { list, error: null };
  const remainingAdmins = list.filter((e) => e.role === ROLES.ADMIN && normalizeEmail(e.email) !== target);
  if (entry.role === ROLES.ADMIN && remainingAdmins.length === 0) {
    return { list, error: "last-admin" };
  }
  return { list: writeWhitelist(list.filter((e) => normalizeEmail(e.email) !== target)), error: null };
}

export function setRole(email, role) {
  const target = normalizeEmail(email);
  const list = readWhitelist();
  const entry = list.find((e) => normalizeEmail(e.email) === target);
  if (!entry) return { list, error: null };
  if (entry.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const remainingAdmins = list.filter((e) => e.role === ROLES.ADMIN && normalizeEmail(e.email) !== target);
    if (remainingAdmins.length === 0) return { list, error: "last-admin" };
  }
  return {
    list: writeWhitelist(list.map((e) => (normalizeEmail(e.email) === target ? { ...e, role } : e))),
    error: null,
  };
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Re-validate against the whitelist on every read: if an admin removes
    // someone (or changes their role) after they've logged in, the change
    // takes effect the next time this is read rather than trusting a
    // stale cached session indefinitely.
    const entry = findWhitelistEntry(session.email);
    if (!entry) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { email: entry.email, role: entry.role };
  } catch {
    return null;
  }
}

// No password: this only checks whitelist membership, matching the scope
// explicitly asked for. Returns { user } on success or { error } on
// failure — never throws, so callers can render either case directly.
export function signIn(email) {
  const entry = findWhitelistEntry(email);
  if (!entry) {
    return { error: "not-whitelisted" };
  }
  const user = { email: entry.email, role: entry.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { user };
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAdmin(user) {
  return Boolean(user) && user.role === ROLES.ADMIN;
}
