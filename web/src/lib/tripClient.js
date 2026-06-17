// Client → server bridge for trip mutations. The browser never talks to
// PocketBase directly; it POSTs an op to /[share_token]/actions, which performs
// the write server-side with trip-scoped validation. Throws on failure so
// callers can fall back to a reload.

/**
 * @param {string} shareToken
 * @param {Record<string, unknown>} body  must include `op`
 */
export async function tripAction(shareToken, body) {
  const res = await fetch(`/${encodeURIComponent(shareToken)}/actions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Trip action "${body.op}" failed (${res.status})`);
  return res.json();
}
