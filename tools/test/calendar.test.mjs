import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendar } from '../src/stats/calendar.mjs';
import { calendarWeeks, summarize } from '../src/stats/compute.mjs';
import { readFileSync } from 'node:fs';

// Shape of https://github.com/users/<login>/contributions (2024–2026 markup).
const html = `
<table class="ContributionCalendar-grid"><tbody><tr>
<td tabindex="0" data-ix="0" aria-selected="false" aria-describedby="contribution-graph-legend-level-0" style="width: 10px" data-date="2026-11-01" id="contribution-day-component-0-0" data-level="0" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>
<tool-tip id="tooltip-a" for="contribution-day-component-0-0" popover="manual" data-direction="n" data-type="label" data-view-component="true" class="sr-only position-absolute">No contributions on November 1st.</tool-tip>
<td tabindex="-1" data-ix="1" aria-selected="false" data-date="2026-11-02" id="contribution-day-component-1-1" data-level="3" role="gridcell" class="ContributionCalendar-day"></td>
<tool-tip id="tooltip-b" for="contribution-day-component-1-1" popover="manual" class="sr-only position-absolute">12 contributions on November 2nd.</tool-tip>
<td data-date="2026-11-03" id="contribution-day-component-2-2" data-level="1" class="ContributionCalendar-day"></td>
<tool-tip for="contribution-day-component-2-2" class="sr-only">1 contribution on November 3rd.</tool-tip>
<td data-date="2026-11-04" id="contribution-day-component-3-3" data-level="4" class="ContributionCalendar-day"></td>
<tool-tip for="contribution-day-component-3-3" class="sr-only">1,204 contributions on November 4th.</tool-tip>
</tr></tbody></table>`;

test('parseCalendar reads dates, counts and GitHub levels', () => {
  assert.deepEqual(parseCalendar(html), [
    { date: '2026-11-01', level: 0, count: 0 },
    { date: '2026-11-02', level: 3, count: 12 },
    { date: '2026-11-03', level: 1, count: 1 },
    { date: '2026-11-04', level: 4, count: 1204 },
  ]);
});

test('calendarWeeks keeps GitHub levels and fills gaps with zero days', () => {
  const { weeks, total } = calendarWeeks(parseCalendar(html), '2026-10-31', '2026-11-04');
  assert.equal(total, 1217);
  assert.equal(weeks.length, 2); // Sat 31 Oct ends the first column
  assert.equal(weeks[1][1].level, 3); // Mon 2 Nov
  assert.equal(weeks[0][0].count, 0);
});

test('summarize prefers the profile calendar over GraphQL numbers', () => {
  const user = JSON.parse(readFileSync(new URL('./fixtures/user.json', import.meta.url), 'utf8'));
  const s = summarize(user, { today: '2026-11-04', calendar: parseCalendar(html) });
  assert.equal(s.source, 'profile');
  assert.equal(s.totalContributions, 1217);
  assert.equal(s.current.length, 3);
  assert.deepEqual(s.years.map((y) => y.year), [2026]);
});
