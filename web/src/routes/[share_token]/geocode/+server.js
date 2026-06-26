import { json, error } from '@sveltejs/kit';
import { superuserPb } from '$lib/server/pocketbase.js';
import { getMembership } from '$lib/server/membership.js';
import { rateLimit, clientIp } from '$lib/server/rateLimit.js';

// Server-side proxy for OpenStreetMap's Nominatim geocoder, used by the trip
// Map section's place search. Proxied (not called from the browser) so we can:
//   - keep it members-only (the share_token + a real membership are required),
//   - send a proper identifying User-Agent per Nominatim's usage policy,
//   - rate-limit per IP so we stay well under the 1 req/s fair-use guidance.
// Nominatim is a fixed, trusted host, so there's no SSRF surface here.

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'tripwala/1.0 (+https://tripwala.enzoiwith.us)';

export async function GET(event) {
  const { params, url, locals } = event;
  if (!locals.user) throw error(401, 'Sign in to search the map');

  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
  if (q.length < 2) return json({ results: [] });

  const pb = await superuserPb();
  let trip;
  try {
    trip = await pb.collection('trips').getFirstListItem(pb.filter('share_token = {:t}', { t: params.share_token }));
  } catch (_) {
    throw error(404, 'Trip not found');
  }
  const me = await getMembership(pb, trip.id, locals.user.id);
  if (!me || me.status === 'pending') throw error(403, 'Join this trip to search the map');

  // Per-IP throttle — friendly to Nominatim and blunts abuse of the proxy.
  const limited = rateLimit(`geocode:${clientIp(event)}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) throw error(429, 'Too many searches — give it a moment.');

  const endpoint = `${NOMINATIM}?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
  let rows;
  try {
    const res = await fetch(endpoint, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    rows = await res.json();
  } catch (_) {
    throw error(502, 'Place search is unavailable right now.');
  }

  const results = (Array.isArray(rows) ? rows : [])
    .map((r) => ({ label: String(r.display_name ?? ''), lat: Number(r.lat), lng: Number(r.lon) }))
    .filter((r) => r.label && Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .slice(0, 6);

  return json({ results });
}
