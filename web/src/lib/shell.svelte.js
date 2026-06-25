import { getContext, setContext } from 'svelte';

const KEY = Symbol('wala-shell');

/**
 * The contextual-mode payload a record screen (e.g. an open trip) hands up to
 * the layout's AppShell: the section nav + the record's title. When it's `null`
 * the shell stays at app level (global destinations).
 *
 * @typedef {{ title: string, subtitle?: string, emoji?: string, nav: import('@walaware/design').NavItem[] }} TripContext
 * @typedef {{ trip: TripContext | null, collapsed: boolean }} Shell
 *
 * `collapsed` is set by the open trip's view once its (non-sticky on mobile)
 * header scrolls up under the top bar — the layout then crossfades the trip
 * title + subtitle into the top bar so there's only one sticky header.
 */

/**
 * Create the shell holder in the layout and publish it on context. Descendant
 * screens read it with {@link useShell} and set `trip` to flip the AppShell into
 * contextual (section-nav + scrollSpy) mode — a child driving parent chrome.
 *
 * @returns {Shell}
 */
export function createShell() {
  const shell = $state({ trip: null, collapsed: false });
  setContext(KEY, shell);
  return shell;
}

/**
 * Read the shell holder from a descendant of the layout.
 * @returns {Shell}
 */
export function useShell() {
  return getContext(KEY);
}
