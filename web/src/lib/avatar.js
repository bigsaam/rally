// Trip-domain visual helper. Person identity visuals (the colored initial)
// now come from @walaware/design's Avatar; this module keeps only the
// tripwala-specific gear/packing emoji mapping.

// Gear/packing rows lead with an emoji tile. We have no per-item emoji in the
// data model, so map the free-text category to a friendly default.
/** @type {Record<string, string>} */
const CATEGORY_EMOJI = {
  shelter: '⛺',
  cooking: '🍳',
  kitchen: '🍳',
  food: '🍎',
  lighting: '🔦',
  light: '🔦',
  water: '💧',
  navigation: '🧭',
  safety: '🩹',
  'first aid': '🩹',
  clothing: '🧥',
  sleep: '😴',
  sleeping: '😴',
  electronics: '🔌',
  fun: '🎲',
  games: '🎲',
  tools: '🛠️'
};

/** @param {string | null | undefined} category */
export function gearEmoji(category) {
  if (!category) return '🎒';
  return CATEGORY_EMOJI[category.trim().toLowerCase()] ?? '🎒';
}
