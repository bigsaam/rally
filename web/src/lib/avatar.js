// Identity visuals for the Campfire design. A person has no account, so their
// colored initial IS their identity — and the color is derived from the name so
// it stays stable across devices (ported from the design system's Avatar).

const AV_RAMP = [
  'var(--color-av-1)',
  'var(--color-av-2)',
  'var(--color-av-3)',
  'var(--color-av-4)',
  'var(--color-av-5)',
  'var(--color-av-6)',
  'var(--color-av-7)',
  'var(--color-av-8)'
];

/** @param {string} name */
export function colorFor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV_RAMP[h % AV_RAMP.length];
}

/** @param {string} name */
export function initialOf(name = '') {
  return (name.trim()[0] || '?').toUpperCase();
}

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
