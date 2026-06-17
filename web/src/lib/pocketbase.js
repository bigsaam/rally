import PocketBase from 'pocketbase';

// Browser-side PocketBase client. Same-origin: in dev Vite proxies /api and /_
// to the local binary; in prod Caddy routes them to the container. Used for
// interactive writes (RSVP, claims, signups, checks) and realtime subscriptions
// so the page feels live.
//
// NOTE (security boundary, step 9): collection API rules are still open, so the
// browser can write to any trip's rows. Fine for a trusted weekend trip behind
// an unguessable link; must be hardened before a public/cloud deployment.

/** @type {import('pocketbase').default | null} */
let _pb = null;

export function pb() {
  if (typeof window === 'undefined') {
    throw new Error('pb() is browser-only — call it from onMount or an event handler');
  }
  if (!_pb) {
    _pb = new PocketBase(window.location.origin);
    _pb.autoCancellation(false);
  }
  return _pb;
}
