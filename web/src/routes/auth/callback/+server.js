import { redirect } from '@sveltejs/kit';
import { OAUTH, safeNext } from '$lib/server/authFlow.js';

// Google redirects back here with ?code & ?state. We verify state, exchange the
// code via PocketBase (which talks to Google using its configured secret,
// creates/links the user, and maps name/avatar), then the hooks layer
// serializes the resulting pb_auth cookie. Finally bounce to wherever the user
// was headed.
export async function GET({ locals, url, cookies }) {
  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';

  const expectedState = cookies.get(OAUTH.state);
  const verifier = cookies.get(OAUTH.verifier);
  const next = safeNext(cookies.get(OAUTH.next));

  // Clear the handshake cookies regardless of outcome.
  for (const name of [OAUTH.state, OAUTH.verifier, OAUTH.next]) {
    cookies.delete(name, { path: '/' });
  }

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    throw redirect(303, '/login?error=oauth');
  }

  const redirectUrl = `${url.origin}/auth/callback`;
  try {
    await locals.pb
      .collection('users')
      .authWithOAuth2Code('google', code, verifier, redirectUrl);
  } catch (/** @type {any} */ e) {
    throw redirect(303, '/login?error=oauth');
  }

  throw redirect(303, next);
}
