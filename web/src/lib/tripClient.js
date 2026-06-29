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
  if (!res.ok) {
    // Surface the server's error message (SvelteKit error() → { message }) so
    // callers can show why, e.g. an Immich album create that couldn't connect.
    let msg = `Trip action "${body.op}" failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch (_) {
      /* keep the generic message */
    }
    throw new Error(msg);
  }
  return res.json();
}
