import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

// Server-side PocketBase client, authenticated as a superuser so it can read
// and write while every collection's API rules are locked to superuser-only
// (see the lock_rules migration). The browser NEVER talks to PocketBase
// directly — all reads go through server load(), all writes through the
// /[share_token]/actions endpoint. This is what enforces per-trip scoping in
// the no-account model: the server validates the share_token and that every
// target row belongs to that trip.
//
// Credentials come from env (1Password-injected in prod). The dev fallback
// matches the local dev superuser and is NOT a production secret.

const PB_URL = env.PB_URL || 'http://127.0.0.1:8090';
const EMAIL = env.PB_SUPERUSER_EMAIL || 'admin@tripwala.local';
const PASSWORD = env.PB_SUPERUSER_PASSWORD || 'tripwalaadmin123';

/**
 * A fresh, unauthenticated PocketBase client pointed at the same instance.
 * Used per-request to carry a signed-in user's auth (loaded from the pb_auth
 * cookie) and to run auth operations (login / OAuth / logout). Distinct from
 * the cached superuser client, which performs all data reads/writes.
 */
export function newClient() {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  return pb;
}

/** @type {import('pocketbase').default | null} */
let _pb = null;

/** Returns a cached, superuser-authenticated client. Re-auths when the token is
 *  locally expired, and self-heals if the server rejects it (see below). */
export async function superuserPb() {
  if (!_pb) {
    _pb = new PocketBase(PB_URL);
    _pb.autoCancellation(false);
    installSelfHealingAuth(_pb);
  }
  if (!_pb.authStore.isValid) {
    await _pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
  }
  return _pb;
}

/**
 * Wrap the client's low-level `send()` so any request the server rejects with
 * 401/403 transparently re-authenticates as the superuser and retries once.
 *
 * Why: `authStore.isValid` only checks local token *expiry*. A token can be
 * valid locally yet rejected by the server after its key was rotated — e.g. a
 * PocketBase restart that re-runs `superuser upsert`, or a password change.
 * Without this, the cached client keeps sending a dead token (every read 403s)
 * until the process restarts. Zero overhead on the happy path; no per-request
 * round-trip — we only re-auth in response to an actual rejection.
 *
 * @param {import('pocketbase').default} pb
 */
function installSelfHealingAuth(pb) {
  const rawSend = pb.send.bind(pb);
  /** @type {Promise<void> | null} de-dupes re-auth across concurrent failures */
  let reauthing = null;

  pb.send = async (path, options) => {
    try {
      return await rawSend(path, options);
    } catch (err) {
      const status = /** @type {any} */ (err)?.status;
      // Only retry auth failures — and never the auth call itself (no loop).
      if ((status !== 401 && status !== 403) || path.includes('/auth-with-password')) {
        throw err;
      }
      reauthing ??= (async () => {
        pb.authStore.clear();
        await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
      })().finally(() => {
        reauthing = null;
      });
      await reauthing;
      return await rawSend(path, options);
    }
  };
}
