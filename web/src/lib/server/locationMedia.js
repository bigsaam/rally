// Resolve a location_ideas `image` file value into a same-origin URL the browser
// can load. Mirrors userAvatar.js: the file is stored on the (superuser-locked)
// record and served by PocketBase at /api/files/{collection}/{recordId}/{file},
// which Caddy proxies in docker + prod. A same-origin path keeps the internal
// PB_URL off the wire and needs no CORS. Returns undefined when there's no image.

/**
 * @param {{ id: string, image?: string | null } | null | undefined} idea
 * @param {string} [thumb] PocketBase thumb size (e.g. '416x224'). Must be listed
 *   in the field's `thumbs` (see the location_image_thumbs migration) or PB
 *   returns the original. Omit for the full-size image.
 * @returns {string | undefined}
 */
export function locationImageUrl(idea, thumb) {
  const value = idea?.image;
  if (!value) return undefined;
  const base = `/api/files/location_ideas/${idea.id}/${encodeURIComponent(value)}`;
  return thumb ? `${base}?thumb=${encodeURIComponent(thumb)}` : base;
}
