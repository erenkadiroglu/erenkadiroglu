import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes } from '../src/theme.mjs';
import { summarize } from '../src/stats/compute.mjs';
import { _internals, renderLanguages, renderStats, renderStreak } from '../src/stats/render.mjs';
import { buildAll } from '../src/build-static.mjs';
import { contrast } from '../src/color.mjs';
import { assertWellFormed } from './helpers.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const user = JSON.parse(readFileSync(new URL('./fixtures/user.json', import.meta.url), 'utf8'));
const today = '2026-11-04';
const stats = summarize(user, { today, exclude: ['Jupyter Notebook'] });

for (const theme of Object.values(themes)) {
  test(`stats cards render (${theme.name})`, () => {
    for (const svg of [renderStreak(stats, theme, { today }), renderStats(stats, theme, { today }), renderLanguages(stats, theme)]) {
      assertWellFormed(svg);
    }
    assert.match(renderStreak(stats, theme, { today }), /Today/);
  });

  test(`placeholders render (${theme.name})`, () => {
    for (const svg of [renderStreak(null, theme, { today }), renderStats(null, theme, { today }), renderLanguages(null, theme)]) {
      assertWellFormed(svg);
    }
  });

  test(`text tokens meet WCAG AA (${theme.name})`, () => {
    for (const token of ['fg', 'muted', 'subtle', 'accentText']) {
      for (const bg of ['surface', 'raised', 'page']) {
        assert.ok(contrast(theme[token], theme[bg]) >= 4.5, `${token} on ${bg}: ${contrast(theme[token], theme[bg]).toFixed(2)}`);
      }
    }
  });

  test(`snake empty cell stays visible on the page (${theme.name})`, () => {
    assert.ok(contrast(theme.heat[0], theme.page) >= 1.15);
  });
}

test('date ranges read naturally', () => {
  assert.equal(_internals.range('2026-10-27', '2026-11-04', today), 'Oct 27 – Today');
  assert.equal(_internals.range('2025-03-01', '2025-03-09', today), 'Mar 1, 2025 – Mar 9, 2025');
  assert.equal(_internals.monthYear('2025-03-01'), 'Mar 2025');
});

test('every static asset is well-formed and committed up to date (run `npm run build`)', () => {
  for (const [name, svg] of Object.entries(buildAll())) {
    assertWellFormed(svg);
    assert.equal(readFileSync(join(root, 'assets', name), 'utf8'), svg, `${name} is stale`);
  }
});

test('README only references local assets that exist', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const refs = [...readme.matchAll(/(?:src|srcset)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 8, `only ${refs.length} asset references`);
  for (const ref of refs) assert.ok(existsSync(join(root, ref)), `missing ${ref}`);
});
