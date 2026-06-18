import { randomBytes } from 'node:crypto';

// Friendly trip slugs: <trip-word>-<adjective>-<noun>, e.g. "trinity-mossy-otter".
// The slug is the share capability, so the random words carry the entropy — the
// leading trip word is for vibes only (it's guessable). Two random words from
// these lists is ~modest entropy; pass extraWords>0 (or rely on collision-retry
// in the caller) to lengthen. The owner token stays separately high-entropy.

const ADJECTIVES = [
  'mossy', 'sunny', 'breezy', 'rocky', 'misty', 'golden', 'quiet', 'cozy', 'rustic', 'amber',
  'piney', 'sandy', 'frosty', 'dusky', 'hazy', 'leafy', 'snowy', 'brave', 'swift', 'jolly',
  'merry', 'wild', 'calm', 'bold', 'happy', 'mellow', 'rugged', 'balmy', 'crisp', 'dewy',
  'shady', 'sunlit', 'starry', 'windy', 'woody', 'ferny', 'grassy', 'fluffy', 'toasty', 'smoky',
  'lofty', 'sleepy', 'sturdy', 'gentle', 'nimble', 'cheery', 'rosy', 'dusty', 'foggy', 'lush',
  'mighty', 'peppy', 'plucky', 'quirky', 'spry', 'tawny', 'vivid', 'wavy', 'zesty', 'alpine',
  'autumn', 'boreal', 'coastal', 'copper', 'emerald', 'granite', 'ivory', 'jade', 'sage', 'slate',
  'teal', 'umber', 'velvet', 'winter', 'cobalt', 'crimson', 'dapple', 'flint', 'hearth', 'lichen',
  'marble', 'pebble', 'rapid', 'rambling', 'roaming', 'wandering', 'wily', 'brisk', 'dappled', 'feral'
];

const NOUNS = [
  'otter', 'fox', 'elk', 'owl', 'pine', 'fern', 'creek', 'ridge', 'ember', 'birch',
  'maple', 'willow', 'heron', 'marten', 'lynx', 'bear', 'moose', 'badger', 'finch', 'robin',
  'sparrow', 'trout', 'salmon', 'beaver', 'raccoon', 'falcon', 'hawk', 'aspen', 'boulder', 'meadow',
  'canyon', 'summit', 'gully', 'hollow', 'thicket', 'lantern', 'kettle', 'canteen', 'campfire', 'trail',
  'basin', 'cove', 'glade', 'brook', 'bluff', 'knoll', 'vale', 'cedar', 'spruce', 'juniper',
  'cliff', 'gorge', 'mesa', 'dune', 'reef', 'marsh', 'fjord', 'tundra', 'prairie', 'grove',
  'lark', 'wren', 'crane', 'quail', 'bison', 'cougar', 'coyote', 'marmot', 'newt', 'toad',
  'acorn', 'thistle', 'clover', 'nettle', 'reed', 'cattail', 'birdsong', 'driftwood', 'pinecone', 'kindling',
  'compass', 'paddle', 'hammock', 'skillet', 'flask', 'mallet', 'beacon', 'anchor', 'rucksack', 'whittle'
];

const STOP = new Set(['the', 'a', 'an', 'trip', 'our', 'my', 'to', 'at', 'in', 'of', 'and', 'camping', 'camp']);

/** @param {string[]} arr */
function pick(arr) {
  return arr[randomBytes(2).readUInt16BE(0) % arr.length];
}

/** First meaningful, slug-safe word of the trip name (fallback: "trip"). */
function tripWord(/** @type {string} */ name) {
  const words = String(name || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w));
  return (words[0] || 'trip').slice(0, 16);
}

/**
 * @param {string} name trip name (seeds the leading word)
 * @param {number} [extraWords] additional random words beyond the default 2
 * @returns {string} e.g. "trinity-mossy-otter"
 */
export function generateSlug(name, extraWords = 0) {
  const parts = [tripWord(name)];
  const count = 2 + Math.max(0, extraWords);
  for (let i = 0; i < count; i++) parts.push(i % 2 === 0 ? pick(ADJECTIVES) : pick(NOUNS));
  let slug = parts.join('-');
  if (slug.length < 10) slug += '-' + pick(NOUNS); // satisfy the field's min length
  return slug.slice(0, 64);
}
