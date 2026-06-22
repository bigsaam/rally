// Shared bits for the auth routes: short-lived OAuth handshake cookies and a
// safe post-login redirect target.

export const OAUTH = {
  state: 'rally_oauth_state',
  verifier: 'rally_oauth_verifier',
  next: 'rally_oauth_next'
};

/**
 * Cookie options for the OAuth handshake (cleared right after the callback).
 * @param {boolean} secure
 */
export function oauthCookieOpts(secure) {
  return /** @type {const} */ ({
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 600
  });
}

/**
 * Only allow redirecting to a local path (defends against open-redirect via the
 * `next` param). Anything else falls back to the home page.
 *
 * @param {unknown} next
 * @returns {string}
 */
export function safeNext(next) {
  const v = String(next ?? '');
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  return '/';
}
