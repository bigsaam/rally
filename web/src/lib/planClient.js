// Client → server bridge for planning-phase mutations. Mirrors tripClient: the
// browser POSTs an op to /[share_token]/plan, which writes server-side with
// membership + trip-scoped validation. Throws on failure so callers can reload.

/**
 * @param {string} shareToken
 * @param {Record<string, unknown>} body must include `op`
 */
export async function planAction(shareToken, body) {
  const res = await fetch(`/${encodeURIComponent(shareToken)}/plan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Planning action "${body.op}" failed (${res.status})`);
  return res.json();
}
