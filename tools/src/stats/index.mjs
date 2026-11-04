#!/usr/bin/env node
/**
 * Builds assets/generated/activity-{dark,light}.svg.
 *
 *   GITHUB_TOKEN=... node src/stats/index.mjs [--user <login>]
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
import { summarize } from './compute.mjs';
import { renderActivity } from './render.mjs';

const { values } = parseArgs({
  options: {
    user: { type: 'string', default: process.env.GITHUB_USER || profile.handle },
    out: { type: 'string', default: fileURLToPath(new URL('../../../assets/generated/', import.meta.url)) },
    fixture: { type: 'string' },
    today: { type: 'string' },
    exclude: { type: 'string', default: process.env.EXCLUDE_LANGUAGES ?? '' },
    placeholder: { type: 'boolean', default: false },
  },
});

const today = values.today ?? new Date().toISOString().slice(0, 10);
const exclude = values.exclude.split(',').map((s) => s.trim()).filter(Boolean);

let stats = null;
if (!values.placeholder) {
  const user = values.fixture
    ? JSON.parse(readFileSync(values.fixture, 'utf8'))
    : await fetchUser(values.user, process.env.GITHUB_TOKEN);
  stats = summarize(user, { today, exclude });
}

mkdirSync(values.out, { recursive: true });
for (const theme of Object.values(themes)) {
  const file = join(values.out, `activity-${theme.name}.svg`);
  const svg = renderActivity(stats, theme, { today });
  // Skip rewrites where only the "updated" stamp would change: no noise commits.
  const stamp = /updated \d{4}-\d{2}-\d{2}/g;
  if (existsSync(file) && readFileSync(file, 'utf8').replace(stamp, '') === svg.replace(stamp, '')) {
    console.log(`unchanged ${file}`);
    continue;
  }
  writeFileSync(file, svg);
  console.log(`wrote ${file}`);
}
if (stats) {
  const { weeks, ...summary } = stats;
  console.log(JSON.stringify({ ...summary, languages: summary.languages.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`) }, null, 2));
}
