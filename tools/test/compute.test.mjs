import { test } from 'node:test';
import assert from 'node:assert/strict';
import { languages, level, streaks, summarize } from '../src/stats/compute.mjs';
import { readFileSync } from 'node:fs';

const day = (date, contributionCount) => ({ date, contributionCount });

test('streaks: counts the run ending today', () => {
  const days = [day('2026-01-01', 1), day('2026-01-02', 0), day('2026-01-03', 2), day('2026-01-04', 1)];
  assert.deepEqual(streaks(days, '2026-01-04'), { current: 2, longest: 2 });
});

test('streaks: a quiet today does not break the current streak', () => {
  const days = [day('2026-01-01', 3), day('2026-01-02', 1), day('2026-01-03', 0)];
  assert.deepEqual(streaks(days, '2026-01-03'), { current: 2, longest: 2 });
});

test('streaks: a quiet yesterday does', () => {
  const days = [day('2026-01-01', 3), day('2026-01-02', 0), day('2026-01-03', 0)];
  assert.deepEqual(streaks(days, '2026-01-03'), { current: 0, longest: 1 });
});

test('languages: sqrt weighting, exclusion and an "Other" bucket', () => {
  const repo = (...pairs) => ({ languages: { edges: pairs.map(([name, size]) => ({ size, node: { name, color: '#000000' } })) } });
  const out = languages([repo(['A', 400], ['B', 100]), repo(['A', 100], ['C', 1]), repo(['X', 10_000])], { limit: 2, exclude: ['X'] });
  assert.deepEqual(out.map((l) => l.name), ['A', 'B', 'Other']);
  assert.equal(out[0].score, 30); // sqrt(400) + sqrt(100)
  assert.ok(Math.abs(out.reduce((s, l) => s + l.share, 0) - 1) < 1e-9);
});

test('level: prefers the API quartile and falls back to counts', () => {
  assert.equal(level({ contributionLevel: 'THIRD_QUARTILE', contributionCount: 1 }), 3);
  assert.equal(level({ contributionCount: 0 }), 0);
  assert.equal(level({ contributionCount: 50 }), 4);
});

test('summarize: fixture totals line up', () => {
  const user = JSON.parse(readFileSync(new URL('./fixtures/user.json', import.meta.url), 'utf8'));
  const s = summarize(user, { today: '2026-11-04' });
  assert.equal(s.repositories, 4);
  assert.equal(s.stars, 5);
  assert.equal(s.weeks.flat().reduce((a, d) => a + d.count, 0), s.contributions);
  assert.ok(s.longest >= s.current);
});
