// Unit tests for the pure pieces of the link-preview (Open Graph) builder: image
// selection, vote ranking, and URL absolutization. The async DB orchestration in
// tripOg() is left to integration; these cover the logic that's easy to get
// wrong. Run with `pnpm test` (Node's built-in test runner).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ideaImage, rankByVotes, absolutize } from './og.js';

test('ideaImage prefers an uploaded image over the unfurled preview', () => {
  const idea = { id: 'abc', image: 'pic.jpg', preview_image: 'https://ex.com/og.png' };
  assert.equal(ideaImage(idea), '/api/files/location_ideas/abc/pic.jpg?thumb=1000x0');
});

test('ideaImage falls back to the unfurled preview when there is no upload', () => {
  const idea = { id: 'abc', image: null, preview_image: 'https://ex.com/og.png' };
  assert.equal(ideaImage(idea), 'https://ex.com/og.png');
});

test('ideaImage returns undefined with no image at all', () => {
  assert.equal(ideaImage({ id: 'abc' }), undefined);
  assert.equal(ideaImage(null), undefined);
});

test('rankByVotes orders ideas by upvote count, descending', () => {
  const ideas = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const votes = [
    { location_idea: 'b' },
    { location_idea: 'b' },
    { location_idea: 'c' }
  ];
  assert.deepEqual(rankByVotes(ideas, votes).map((i) => i.id), ['b', 'c', 'a']);
});

test('rankByVotes does not mutate its input', () => {
  const ideas = [{ id: 'a' }, { id: 'b' }];
  rankByVotes(ideas, [{ location_idea: 'b' }]);
  assert.deepEqual(ideas.map((i) => i.id), ['a', 'b']);
});

test('absolutize prefixes same-origin paths and passes absolute URLs through', () => {
  const origin = 'https://tripwala.enzoiwith.us';
  assert.equal(absolutize('/api/files/x', origin), 'https://tripwala.enzoiwith.us/api/files/x');
  assert.equal(absolutize('https://ex.com/og.png', origin), 'https://ex.com/og.png');
  assert.equal(absolutize(undefined, origin), undefined);
});
