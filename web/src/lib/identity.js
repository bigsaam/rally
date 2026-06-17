// Identity-lite: the no-account trick. A browser keeps a stable random
// `client_id` (used server-side to dedupe "this is me" and enforce one
// participant per browser per trip), plus a per-trip mapping of which
// participant "I am" on this device. No passwords.
//
// All functions are SSR-safe: they no-op / return null when localStorage is
// unavailable, so they may be imported anywhere but should be *called* only in
// the browser (onMount / event handlers).

const CLIENT_KEY = 'rally_client_id';

/** @param {string} shareToken */
const tripKey = (shareToken) => `rally_identity_${shareToken}`;

function store() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older runtimes.
  return 'cid-' + Math.abs(Date.now() ^ (performance?.now?.() ?? 0)).toString(36) + Math.random().toString(36).slice(2);
}

/** Stable per-browser id, created on first use. */
export function getClientId() {
  const s = store();
  if (!s) return '';
  let id = s.getItem(CLIENT_KEY);
  if (!id) {
    id = randomId();
    s.setItem(CLIENT_KEY, id);
  }
  return id;
}

/**
 * @param {string} shareToken
 * @returns {{ participantId: string, displayName: string } | null}
 */
export function getTripIdentity(shareToken) {
  const s = store();
  if (!s) return null;
  const raw = s.getItem(tripKey(shareToken));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.participantId === 'string') return parsed;
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * @param {string} shareToken
 * @param {{ participantId: string, displayName: string }} identity
 */
export function setTripIdentity(shareToken, identity) {
  const s = store();
  if (s) s.setItem(tripKey(shareToken), JSON.stringify(identity));
}

/** @param {string} shareToken */
export function clearTripIdentity(shareToken) {
  const s = store();
  if (s) s.removeItem(tripKey(shareToken));
}
