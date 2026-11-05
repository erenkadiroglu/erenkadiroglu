#!/usr/bin/env node
/**
 * Renders the static README visuals for both GitHub themes into ../assets:
 *   stack-{dark,light}.svg  monochrome tech-stack strip (transparent background)
 *
 *   node src/build-static.mjs [--out <dir>]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { themes } from './theme.mjs';
import { document, icon, r, text, textWidth } from './svg.mjs';
import { stack } from './content.mjs';

const W = 1180;
const COLS = 3;
const COL_W = W / COLS;
const ICON = 30;
const CELL = 74;
const ROW_H = 132;

function techStack(theme) {
  const rows = Math.ceil(stack.length / COLS);
  const H = rows * ROW_H - 18;
  const parts = [];
  stack.forEach((group, gi) => {
    const col = gi % COLS;
    const row = Math.floor(gi / COLS);
    const x0 = col * COL_W + 12;
    const y0 = row * ROW_H;
    const delay = 0.08 * gi;
    parts.push(`<g class="in" style="animation-delay:${r(delay)}s">`);
    parts.push(text(x0, y0 + 16, group.label, { size: 11.5, weight: 700, extra: `fill="${theme.accentText}" letter-spacing="1.6"` }));
    parts.push(`<path d="M${r(x0 + textWidth(group.label, 11.5) + group.label.length * 1.6 + 10)} ${y0 + 12}H${r(x0 + COL_W - 40)}" stroke="${theme.divider}"/>`);
    group.items.forEach(([name, ic], i) => {
      const cx = x0 + i * CELL + CELL / 2 - 8;
      parts.push(icon(ic, cx - ICON / 2, y0 + 40, ICON, theme.ink));
      parts.push(text(cx, y0 + 40 + ICON + 22, name, { size: 11, cls: 'm', anchor: 'middle' }));
    });
    parts.push('</g>');
  });
  const all = stack.map((g) => `${g.label.toLowerCase()}: ${g.items.map(([n]) => n).join(', ')}`).join('; ');
  return document({
    width: W,
    height: H,
    theme,
    title: 'Tech stack',
    desc: all,
    css:
      '.in{animation:in .6s cubic-bezier(.2,.7,.2,1) both}' +
      '@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}' +
      '@media (prefers-reduced-motion:reduce){.in{animation:none}}',
    body: parts.join('\n'),
  });
}

export function buildAll() {
  const files = {};
  for (const theme of Object.values(themes)) files[`stack-${theme.name}.svg`] = techStack(theme);
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { out: { type: 'string', default: fileURLToPath(new URL('../../assets/', import.meta.url)) } } });
  const files = buildAll();
  for (const [name, svg] of Object.entries(files)) {
    const path = join(values.out, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, svg);
  }
  console.log(`wrote ${Object.keys(files).length} files to ${values.out}`);
}
