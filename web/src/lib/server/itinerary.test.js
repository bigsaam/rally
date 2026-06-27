// Unit tests for the itinerary shaping helper: vote tallies, single-choice
// per-item resolution, undated-last ordering, and picked-option passthrough.
// Run with `pnpm test` (Node's built-in test runner).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapeItinerary } from './itinerary.js';

const names = { p1: 'Ana', p2: 'Bo', p3: 'Cy' };

test('tallies votes per option with voter names', () => {
  const items = [{ id: 'i1', date: '2026-07-04 00:00:00.000Z', label: 'Dinner', sort_order: 0 }];
  const options = [
    { id: 'o1', itinerary_item: 'i1', label: 'Tacos', sort_order: 0 },
    { id: 'o2', itinerary_item: 'i1', label: 'Pizza', sort_order: 1 }
  ];
  const votes = [
    { itinerary_option: 'o1', participant: 'p1' },
    { itinerary_option: 'o1', participant: 'p2' },
    { itinerary_option: 'o2', participant: 'p3' }
  ];
  const [item] = shapeItinerary(items, options, votes, names, 'p1');
  assert.equal(item.options[0].votes, 2);
  assert.deepEqual(item.options[0].voters, ['Ana', 'Bo']);
  assert.equal(item.options[1].votes, 1);
});

test('myVote reflects the viewer’s single pick within an item', () => {
  const items = [{ id: 'i1', date: '2026-07-04 00:00:00.000Z', label: 'Dinner', sort_order: 0 }];
  const options = [
    { id: 'o1', itinerary_item: 'i1', label: 'Tacos', sort_order: 0 },
    { id: 'o2', itinerary_item: 'i1', label: 'Pizza', sort_order: 1 }
  ];
  const votes = [{ itinerary_option: 'o2', participant: 'p1' }];
  const [item] = shapeItinerary(items, options, votes, names, 'p1');
  assert.equal(item.myVote, 'o2');
  assert.equal(item.options[0].mine, false);
  assert.equal(item.options[1].mine, true);
});

test('no viewer → no mine / myVote', () => {
  const items = [{ id: 'i1', date: '2026-07-04 00:00:00.000Z', label: 'Dinner', sort_order: 0 }];
  const options = [{ id: 'o1', itinerary_item: 'i1', label: 'Tacos', sort_order: 0 }];
  const votes = [{ itinerary_option: 'o1', participant: 'p1' }];
  const [item] = shapeItinerary(items, options, votes, names, null);
  assert.equal(item.myVote, null);
  assert.equal(item.options[0].mine, false);
  assert.equal(item.options[0].votes, 1);
});

test('orders dated items chronologically and puts undated decisions last', () => {
  const items = [
    { id: 'undated', date: '', label: 'Movie night?', sort_order: 0 },
    { id: 'i2', date: '2026-07-05 00:00:00.000Z', label: 'Hike', sort_order: 0 },
    { id: 'i1a', date: '2026-07-04 00:00:00.000Z', label: 'Arrive', sort_order: 1 },
    { id: 'i1b', date: '2026-07-04 00:00:00.000Z', label: 'Lunch', sort_order: 0 }
  ];
  const ids = shapeItinerary(items, [], [], names, null).map((x) => x.id);
  assert.deepEqual(ids, ['i1b', 'i1a', 'i2', 'undated']);
});

test('passes through picked_option and item metadata', () => {
  const items = [
    { id: 'i1', date: '2026-07-04 00:00:00.000Z', time: '6:00 PM', label: 'Dinner', sort_order: 0, created_by: 'p2', picked_option: 'o1' }
  ];
  const options = [{ id: 'o1', itinerary_item: 'i1', label: 'Tacos', sort_order: 0, url: 'https://x.test' }];
  const [item] = shapeItinerary(items, options, [], names, null);
  assert.equal(item.time, '6:00 PM');
  assert.equal(item.createdByName, 'Bo');
  assert.equal(item.pickedOption, 'o1');
  assert.equal(item.date, '2026-07-04');
  assert.equal(item.options[0].url, 'https://x.test');
});

test('ignores votes for deleted options and empty input', () => {
  assert.deepEqual(shapeItinerary([], [], [], names, 'p1'), []);
  const items = [{ id: 'i1', date: '', label: 'Q', sort_order: 0 }];
  const [item] = shapeItinerary(items, [], [{ itinerary_option: 'gone', participant: 'p1' }], names, 'p1');
  assert.equal(item.myVote, null);
  assert.deepEqual(item.options, []);
});
