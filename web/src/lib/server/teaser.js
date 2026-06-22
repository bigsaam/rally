// Build the public "teaser" a trip shows before someone signs in: the name and
// a short, tag-stripped preview of the description. Deliberately omits the
// participant list, gear, meals, etc. — those are members-only.

/**
 * @param {string | undefined | null} html stored description (may contain tags)
 * @param {number} [max] preview length in characters
 * @returns {string}
 */
export function previewText(html, max = 160) {
  const text = String(html ?? '')
    .replace(/<[^>]*>/g, ' ') // drop tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/**
 * The minimal trip shape shown to non-members.
 * @param {any} trip a trips record
 */
export function tripTeaser(trip) {
  return {
    name: trip.name,
    location: trip.location ?? '',
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
    descriptionPreview: previewText(trip.description),
    share_token: trip.share_token
  };
}
