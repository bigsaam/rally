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
const EMAIL = env.PB_SUPERUSER_EMAIL || 'admin@rally.local';
const PASSWORD = env.PB_SUPERUSER_PASSWORD || 'rallyadmin123';

/** @type {import('pocketbase').default | null} */
let _pb = null;

/** Returns a cached, superuser-authenticated client (re-auths when expired). */
export async function superuserPb() {
  if (!_pb) {
    _pb = new PocketBase(PB_URL);
    _pb.autoCancellation(false);
  }
  if (!_pb.authStore.isValid) {
    await _pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
  }
  return _pb;
}
