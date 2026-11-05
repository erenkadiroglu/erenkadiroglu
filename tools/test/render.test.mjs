import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes } from '../src/theme.mjs';
import { summarize } from '../src/stats/compute.mjs';
import { _internals, renderLanguages, renderStats, renderStreak, renderTrail } from '../src/stats/render.mjs';
import { locales } from '../src/i18n.mjs';
import { files } from '../src/readme.mjs';

const readmes = files();
import { buildAll } from '../src/build-static.mjs';
import { contrast } from '../src/color.mjs';
import { assertWellFormed } from './helpers.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const user = JSON.parse(readFileSync(new URL('./fixtures/user.json', import.meta.url), 'utf8'));
const today = '2026-11-04';
const stats = summarize(user, { today, exclude: ['Jupyter Notebook'] });

for (const theme of Object.values(themes)) {
  for (const t of Object.values(locales)) {
    test(`stats cards render (${theme.name}, ${t.code})`, () => {
      const cards = [renderStreak, renderStats, renderLanguages, renderTrail].map((fn) => fn(stats, theme, { today, t }));
      cards.forEach(assertWellFormed);
      assert.match(cards[0], new RegExp(t.today));
      assert.match(cards[3], /<animateMotion/);
    });

    test(`placeholders render (${theme.name}, ${t.code})`, () => {
      for (const fn of [renderStreak, renderStats, renderLanguages, renderTrail]) assertWellFormed(fn(null, theme, { today, t }));
    });
  }

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

test('date ranges read naturally in both languages', () => {
  const { en, tr } = locales;
  assert.equal(_internals.range('2026-10-27', '2026-11-04', today, en), 'Oct 27 – Today');
  assert.equal(_internals.range('2025-03-01', '2025-03-09', today, en), 'Mar 1, 2025 – Mar 9, 2025');
  assert.equal(_internals.range('2026-10-27', '2026-11-04', today, tr), '27 Eki – Bugün');
  assert.equal(_internals.monthYear('2025-03-01', tr), 'Mar 2025');
});

test('every static asset is well-formed and committed up to date (run `npm run build`)', () => {
  for (const [name, svg] of Object.entries(buildAll())) {
    assertWellFormed(svg);
    assert.equal(readFileSync(join(root, 'assets', name), 'utf8'), svg, `${name} is stale`);
  }
});

for (const [name, md] of Object.entries(readmes)) {
  test(`${name} is generated and up to date (run \`npm run readme\`)`, () => {
    assert.equal(readFileSync(join(root, name), 'utf8'), md);
  });

  test(`${name} only references local assets that exist`, () => {
    const refs = [...md.matchAll(/(?:src|srcset)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.length >= 14, `only ${refs.length} asset references`);
    for (const ref of refs) assert.ok(existsSync(join(root, ref)), `missing ${ref}`);
  });
}

test('the Turkish README uses Turkish assets throughout', () => {
  const refs = [...readmes['README.tr.md'].matchAll(/(?:src|srcset)="(assets\/(?!flags)[^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) assert.match(ref, /\.tr\.svg$/, ref);
});
