import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes } from '../src/theme.mjs';
import { summarize } from '../src/stats/compute.mjs';
import { renderActivity } from '../src/stats/render.mjs';
import { buildAll } from '../src/build-static.mjs';
import { contrast } from '../src/color.mjs';
import { assertWellFormed } from './helpers.mjs';

const assets = fileURLToPath(new URL('../../assets/', import.meta.url));
const user = JSON.parse(readFileSync(new URL('./fixtures/user.json', import.meta.url), 'utf8'));

for (const theme of Object.values(themes)) {
  test(`activity card renders (${theme.name})`, () => {
    const svg = renderActivity(summarize(user, { today: '2026-11-04' }), theme);
    assertWellFormed(svg);
    assert.match(svg, /941/);
  });

  test(`activity placeholder renders (${theme.name})`, () => {
    const svg = renderActivity(null, theme, { today: '2026-11-04' });
    assertWellFormed(svg);
    assert.match(svg, /awaiting first workflow run/);
  });

  test(`text tokens meet WCAG AA on the card surface (${theme.name})`, () => {
    for (const token of ['fg', 'muted', 'subtle', 'accentText']) {
      assert.ok(contrast(theme[token], theme.surface) >= 4.5, `${token} contrast too low`);
      assert.ok(contrast(theme[token], theme.raised) >= 4.5, `${token} contrast too low on raised`);
    }
  });
}

test('every static asset is well-formed', () => {
  for (const [name, svg] of Object.entries(buildAll())) {
    assert.doesNotThrow(() => assertWellFormed(svg), name);
  }
});

test('committed static assets are up to date (run `npm run build`)', () => {
  for (const [name, svg] of Object.entries(buildAll())) {
    assert.equal(readFileSync(join(assets, name), 'utf8'), svg, `${name} is stale`);
  }
});

test('README only references assets that exist', () => {
  const readme = readFileSync(join(assets, '..', 'README.md'), 'utf8');
  const refs = [...readme.matchAll(/(?:src|srcset)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length > 10);
  const exists = (p) => {
    const parts = p.split('/');
    const dir = join(assets, '..', ...parts.slice(0, -1));
    return readdirSync(dir).includes(parts.at(-1));
  };
  for (const ref of refs) assert.ok(exists(ref), `missing ${ref}`);
});
