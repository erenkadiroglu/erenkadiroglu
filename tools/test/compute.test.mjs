import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allDays, languages, streaks, summarize } from '../src/stats/compute.mjs';

const day = (date, count) => ({ date, count });

test('streaks: counts the run ending today', () => {
  const days = [day('2026-01-01', 1), day('2026-01-02', 0), day('2026-01-03', 2), day('2026-01-04', 1)];
  const s = streaks(days, '2026-01-04');
  assert.deepEqual(s.current, { length: 2, start: '2026-01-03', end: '2026-01-04' });
  assert.equal(s.longest.length, 2);
});

test('streaks: a quiet today does not break the current streak', () => {
  const days = [day('2026-01-01', 3), day('2026-01-02', 1), day('2026-01-03', 0)];
  assert.deepEqual(streaks(days, '2026-01-03').current, { length: 2, start: '2026-01-01', end: '2026-01-02' });
});

test('streaks: a quiet yesterday does', () => {
  const days = [day('2026-01-01', 3), day('2026-01-02', 0), day('2026-01-03', 0)];
  const s = streaks(days, '2026-01-03');
  assert.equal(s.current.length, 0);
  assert.deepEqual(s.longest, { length: 1, start: '2026-01-01', end: '2026-01-01' });
});

test('streaks: runs continue across a year boundary', () => {
  const years = [
    { contributionCalendar: { weeks: [{ contributionDays: [{ date: '2025-12-31', contributionCount: 1 }] }] } },
    { contributionCalendar: { weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 2 }, { date: '2026-01-02', contributionCount: 0 }] }] } },
  ];
  const s = streaks(allDays(years, '2026-01-02'), '2026-01-02');
  assert.deepEqual(s.current, { length: 2, start: '2025-12-31', end: '2026-01-01' });
});

test('allDays: drops future days from the current year calendar', () => {
  const years = [{ contributionCalendar: { weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 1 }, { date: '2026-01-05', contributionCount: 0 }] }] } }];
  assert.equal(allDays(years, '2026-01-02').length, 1);
});

test('languages: sqrt weighting, exclusion and an "Other" bucket', () => {
  const repo = (...pairs) => ({ languages: { edges: pairs.map(([name, size]) => ({ size, node: { name, color: '#000000' } })) } });
  const out = languages([repo(['A', 400], ['B', 100]), repo(['A', 100], ['C', 1]), repo(['X', 10_000])], { limit: 2, exclude: ['X'] });
  assert.deepEqual(out.map((l) => l.name), ['A', 'B', 'Other']);
  assert.equal(out[0].score, 30); // sqrt(400) + sqrt(100)
  assert.ok(Math.abs(out.reduce((s, l) => s + l.share, 0) - 1) < 1e-9);
});

test('summarize: fixture totals line up', () => {
  const user = JSON.parse(readFileSync(new URL('./fixtures/user.json', import.meta.url), 'utf8'));
  const s = summarize(user, { today: '2026-11-04' });
  assert.equal(s.repositories, 4);
  assert.equal(s.stars, 5);
  assert.equal(s.totalContributions, user.years.reduce((a, y) => a + y.contributionCalendar.totalContributions, 0));
  assert.ok(s.current.length >= 9);
  assert.ok(s.longest.length >= s.current.length);
  assert.equal(s.firstContribution.slice(0, 4), '2025');
});
