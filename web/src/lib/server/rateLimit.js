// Tiny in-memory rate limiter (sliding window). No Redis — this is a single,
// self-hosted node process behind Cloudflare, so per-instance counters are
// enough to blunt enumeration/brute-force on the public URL. Counters reset on
// restart, which is fine for a friends-and-family app.
//
// NOTE: in-memory means limits are per-process. If Rally is ever scaled to
// multiple replicas, move this to a shared store.

/** @type {Map<string, number[]>} timestamps (ms) of recent hits per key */
const hits = new Map();

let lastSweep = 0;

/**
 * Drop empty/old buckets occasionally so the map can't grow unbounded.
 * @param {number} now
 * @param {number} windowMs
 */
function sweep(now, windowMs) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    const fresh = times.filter((t) => now - t < windowMs);
    if (fresh.length) hits.set(key, fresh);
    else hits.delete(key);
  }
}

/**
 * Record a hit for `key` and report whether it is within the limit.
 *
 * @param {string} key            stable bucket key (e.g. `ip` or `ip:trip`)
 * @param {{ limit: number, windowMs: number }} opts
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 *          retryAfter is seconds until the oldest hit ages out (0 when ok).
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  sweep(now, windowMs);

  const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - times[0])) / 1000));
    hits.set(key, times);
    return { ok: false, remaining: 0, retryAfter };
  }
  times.push(now);
  hits.set(key, times);
  return { ok: true, remaining: limit - times.length, retryAfter: 0 };
}

/**
 * Best-effort client IP. Behind Cloudflare the real client is in
 * `CF-Connecting-IP`; fall back to the first `X-Forwarded-For` hop, then to
 * SvelteKit's own resolution. Spoofable on direct (non-proxied) access, which
 * is acceptable for this threat model.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {string}
 */
export function clientIp(event) {
  const h = event.request.headers;
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  try {
    return event.getClientAddress();
  } catch (_) {
    return 'unknown';
  }
}
