// How a person's name is shown across the app. The default is FIRST NAME ONLY;
// a signed-in user can override with a nickname or by opting to show their last
// name (see the profile page). Computed at load time from the linked user's live
// prefs, so a change applies everywhere immediately (the stored participant
// display_name is only a fallback for name-only / pre-auth entries).

/**
 * First word of a full name (the part before the first space).
 * @param {string} full
 * @returns {string}
 */
export function firstName(full) {
  return String(full || '').trim().split(/\s+/)[0] || '';
}

/**
 * Resolve a display name from a full name + the person's prefs.
 * Precedence: explicit nickname → full name (if show_last_name) → first name.
 *
 * @param {string} full
 * @param {{ nickname?: string | null, show_last_name?: boolean } | null} [prefs]
 * @returns {string}
 */
export function displayName(full, prefs) {
  const nick = (prefs?.nickname || '').trim();
  if (nick) return nick;
  if (prefs?.show_last_name) return String(full || '').trim();
  return firstName(full);
}

/**
 * Display name for a participant row. Uses the linked user's live name + prefs
 * when present; otherwise the stored (name-only) display_name, first-name'd to
 * match the default.
 *
 * @param {{ display_name?: string, expand?: { user?: { name?: string, nickname?: string | null, show_last_name?: boolean } } }} p
 * @returns {string}
 */
export function participantName(p) {
  const u = p?.expand?.user;
  if (u) return displayName(u.name || p?.display_name || '', u);
  return displayName(p?.display_name || '');
}
