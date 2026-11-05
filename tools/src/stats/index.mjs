#!/usr/bin/env node
/**
 * Builds {streak,stats,langs,trail}-{dark,light}[.tr].svg (CI publishes them to the `stats` branch).
 *
 *   GITHUB_TOKEN=... node src/stats/index.mjs [--user <login>] [--private]
 *   node src/stats/index.mjs --fixture test/fixtures/user.json --out ../.preview
 *   node src/stats/index.mjs --placeholder
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { themes } from '../theme.mjs';
import { profile } from '../content.mjs';
import { fetchUser } from './github.mjs';
import { fetchCalendar, fetchRecent } from './calendar.mjs';
import { summarize } from './compute.mjs';
import { renderLanguages, renderStats, renderStreak, renderTrail } from './render.mjs';
import { locales } from '../i18n.mjs';

const { values } = parseArgs({
  options: {
    user: { type: 'string', default: process.env.GITHUB_USER || profile.handle },
    out: { type: 'string', default: fileURLToPath(new URL('../../../.preview/stats/', import.meta.url)) },
    fixture: { type: 'string' },
    today: { type: 'string' },
    exclude: { type: 'string', default: process.env.EXCLUDE_LANGUAGES ?? '' },
    private: { type: 'boolean', default: process.env.INCLUDE_PRIVATE === 'true' },
    placeholder: { type: 'boolean', default: false },
  },
});

const today = values.today ?? new Date().toISOString().slice(0, 10);
const exclude = values.exclude.split(',').map((s) => s.trim()).filter(Boolean);

let stats = null;
if (!values.placeholder) {
  const user = values.fixture
    ? JSON.parse(readFileSync(values.fixture, 'utf8'))
    : await fetchUser(values.user, process.env.GITHUB_TOKEN, { includePrivate: values.private });
  let calendar = null;
  let recent = null;
  if (!values.fixture) {
    // Read the graph GitHub itself draws (includes private contributions when the
    // profile shows them); fall back to GraphQL if the page cannot be parsed.
    const first = Number((user.createdAt ?? `${today}`).slice(0, 4));
    const years = [];
    for (let y = first; y <= Number(today.slice(0, 4)); y++) years.push(y);
    try {
      calendar = await fetchCalendar(values.user, years, today);
      recent = await fetchRecent(values.user, today);
      const sum = (ds) => ds.reduce((a, d) => a + d.count, 0);
      console.log(`profile calendar: ${calendar.length} days, ${sum(calendar)} contributions (last 12 months: ${sum(recent)})`);
    } catch (err) {
      console.warn(`profile calendar unavailable, using GraphQL instead: ${err.message}`);
      calendar = recent = null;
    }
  }
  stats = { ...summarize(user, { today, exclude, calendar, recent }), privateRepos: values.private };
}

// Skip rewrites where only the date stamp would change: no noise commits.
const stamp = /(updated|güncellendi) \d{4}-\d{2}-\d{2}/g;
mkdirSync(values.out, { recursive: true });
for (const t of Object.values(locales)) {
  for (const theme of Object.values(themes)) {
    const cards = {
      streak: renderStreak(stats, theme, { today, t }),
      stats: renderStats(stats, theme, { today, t }),
      langs: renderLanguages(stats, theme, { today, t }),
      trail: renderTrail(stats, theme, { today, t }),
    };
    for (const [name, svg] of Object.entries(cards)) {
      const file = join(values.out, `${name}-${theme.name}${t.suffix}.svg`);
      if (existsSync(file) && readFileSync(file, 'utf8').replace(stamp, '') === svg.replace(stamp, '')) {
        console.log(`unchanged ${file}`);
        continue;
      }
      writeFileSync(file, svg);
      console.log(`wrote ${file}`);
    }
  }
}
if (stats) {
  const { trail, years, ...summary } = stats;
  console.log(JSON.stringify({ ...summary, languages: summary.languages.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`), years: years.map((y) => `${y.year}: ${y.total}`) }, null, 2));
}
