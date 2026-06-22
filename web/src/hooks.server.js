import { rateLimit, clientIp } from '$lib/server/rateLimit.js';

// Coarse global rate limit per client IP — a backstop against someone scraping
// trip URLs or hammering the actions endpoint. Generous enough that normal use
// (including the ~4s live-poll while a tab is open) never trips it. Sensitive
// POSTs (create trip, join, unlock a secret) add their own stricter, narrower
// limits at the point of use.
const GLOBAL = { limit: 300, windowMs: 60_000 };

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Only meter dynamic app traffic; let static assets and the prerendered
  // landing page through untouched.
  const p = event.url.pathname;
  const metered = !p.startsWith('/_app/') && !p.startsWith('/favicon');

  if (metered) {
    const { ok, retryAfter } = rateLimit(`g:${clientIp(event)}`, GLOBAL);
    if (!ok) {
      return new Response('Too many requests — slow down a moment.', {
        status: 429,
        headers: { 'retry-after': String(retryAfter) }
      });
    }
  }

  return resolve(event);
}
