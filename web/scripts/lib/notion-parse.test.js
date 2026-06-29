import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsv, parseDateLoose, parseDateRange, mapTripType, structureNotes, buildBundle, addDays
} from './notion-parse.mjs';

test('parseCsv handles quoted commas and a header row', () => {
  const { headers, rows } = parseCsv('Name,Location\n"Japan 2024","Tokyo, Kyoto"\nPatagonia,Chile\n');
  assert.deepEqual(headers, ['Name', 'Location']);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Location, 'Tokyo, Kyoto');
  assert.equal(rows[1].Name, 'Patagonia');
});

test('parseCsv handles escaped quotes and newlines inside fields', () => {
  const { rows } = parseCsv('Name,Note\n"A","line1\nline2 with ""quote"""\n');
  assert.equal(rows[0].Note, 'line1\nline2 with "quote"');
});

test('parseDateLoose accepts ISO and long forms', () => {
  assert.equal(parseDateLoose('2024-03-03'), '2024-03-03');
  assert.equal(parseDateLoose('March 3, 2024'), '2024-03-03');
  assert.equal(parseDateLoose('3 March 2024'), '2024-03-03');
  assert.equal(parseDateLoose('whenever'), null);
});

test('parseDateRange splits the Notion arrow and dashes', () => {
  assert.deepEqual(parseDateRange('March 3, 2024 → March 6, 2024'), { start: '2024-03-03', end: '2024-03-06' });
  assert.deepEqual(parseDateRange('2023-11-12 -> 2023-11-14'), { start: '2023-11-12', end: '2023-11-14' });
  assert.deepEqual(parseDateRange('2024-01-01'), { start: '2024-01-01', end: null });
});

test('mapTripType maps synonyms onto the enum', () => {
  assert.equal(mapTripType('City break'), 'city');
  assert.equal(mapTripType('trekking'), 'backpacking');
  assert.equal(mapTripType('road trip'), 'road_trip');
  assert.equal(mapTripType(''), 'other');
  assert.equal(mapTripType('zzz'), 'other');
});

test('addDays is UTC-stable across month boundaries', () => {
  assert.equal(addDays('2024-03-03', 1), '2024-03-04');
  assert.equal(addDays('2024-02-28', 2), '2024-03-01');
});

test('structureNotes drops the title H1 and splits times', () => {
  const md = '# Japan 2024\n\nIntro line.\n\n## Day 1\n- 9am Arrive\n- Shibuya\n';
  const { descriptionHtml, days } = structureNotes(md);
  assert.equal(descriptionHtml, '<p>Intro line.</p>');
  assert.equal(days.length, 1);
  assert.deepEqual(days[0].items[0], { time: '9am', label: 'Arrive' });
  assert.deepEqual(days[0].items[1], { time: '', label: 'Shibuya' });
});

test('buildBundle resolves Day N to start_date + offset and explicit dates', () => {
  const row = { Name: 'Japan 2024', Dates: 'March 3, 2024 → March 6, 2024', Type: 'City' };
  const md = '# Japan 2024\n## Day 1\n- A\n## Day 2\n- B\n## March 6, 2024\n- C\n';
  const b = buildBundle({ row, markdown: md, externalId: 'abc' });
  assert.equal(b.start_date, '2024-03-03');
  assert.equal(b.trip_type, 'city');
  assert.equal(b.status, 'completed');
  assert.equal(b.itinerary[0].date, '2024-03-03'); // Day 1
  assert.equal(b.itinerary[1].date, '2024-03-04'); // Day 2 = start + 1
  assert.equal(b.itinerary[2].date, '2024-03-06'); // explicit heading
  assert.ok(b.itinerary.every((i) => i.kind === 'fixed'));
});

test('buildBundle flags rows missing a date', () => {
  const b = buildBundle({ row: { Name: 'Cabin' }, markdown: '', externalId: 'x' });
  assert.ok(b.warnings.includes('no start date parsed'));
  assert.equal(b.itinerary.length, 0);
});
