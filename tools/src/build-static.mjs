#!/usr/bin/env node
/**
 * Renders the static README panels for both themes and both languages into ../assets:
 *   about-*, projects-*, experience-*   content panels in the banner's visual language
 *   stack-*                             monochrome tech-stack strip (transparent background)
 * File names: <panel>-<theme>[.tr].svg
 *
 *   node src/build-static.mjs [--out <dir>]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { themes } from './theme.mjs';
import { document, esc, frame, icon, r, text, textWidth } from './svg.mjs';
import { glyph } from './glyphs.mjs';
import { stack } from './content.mjs';
import { locales } from './i18n.mjs';
import { copy } from './copy.mjs';

const W = 1180;
const PAD = 28;
const CSS =
  '.in{animation:in .7s cubic-bezier(.2,.7,.2,1) both}' +
  '@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}' +
  '.pulse{animation:pulse 1.8s ease-in-out infinite}@keyframes pulse{50%{opacity:.25}}' +
  '@media (prefers-reduced-motion:reduce){.in,.pulse{animation:none}}';

const plain = (s) => s.replace(/\*\*/g, '');

/** Header chrome shared with the stats cards: frame, small-caps title, meta, rule. */
function panel({ height, theme, title, meta, body, docTitle, desc }) {
  return document({
    width: W,
    height,
    theme,
    title: docTitle,
    desc,
    css: CSS,
    body: [
      frame({ width: W, height, theme, radius: 12 }),
      text(PAD, 38, title, { size: 12, weight: 700, extra: `fill="${theme.fg}" letter-spacing="1.6"` }),
      text(W - PAD, 38, meta, { size: 11, cls: 's', anchor: 'end' }),
      `<path d="M${PAD} 54H${W - PAD}" stroke="${theme.divider}"/>`,
      body,
    ].join('\n'),
  });
}

/** Word-wraps text with **bold** spans to `cols` monospace columns; returns tspans per line. */
function richLines(source, cols, theme) {
  const words = [];
  source.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    const bold = part.startsWith('**');
    const clean = part.replace(/\*\*/g, '');
    clean.split(/\s+/).filter(Boolean).forEach((w, i) => {
      // punctuation glued to the previous span ("**Uni**.") keeps no space
      const glue = i === 0 && words.length > 0 && !/^\s/.test(clean);
      words.push({ w, bold, glue });
    });
  });
  const lines = [];
  let line = [];
  let len = 0;
  for (const word of words) {
    const sep = line.length && !word.glue ? 1 : 0;
    if (len + sep + [...word.w].length > cols && line.length && !word.glue) {
      lines.push(line);
      line = [];
      len = 0;
    }
    len += (line.length && !word.glue ? 1 : 0) + [...word.w].length;
    line.push(word);
  }
  if (line.length) lines.push(line);
  return lines.map((ws) => {
    const runs = [];
    ws.forEach(({ w, bold, glue }, i) => {
      const last = runs.at(-1);
      const chunk = (i && !glue ? ' ' : '') + w;
      if (last && last.bold === bold) last.text += chunk;
      else runs.push({ bold, text: chunk });
    });
    return runs
      .map((run) => (run.bold ? `<tspan fill="${theme.fg}" font-weight="700">${esc(run.text)}</tspan>` : esc(run.text)))
      .join('');
  });
}

function chip(label, x, y, theme, { size = 11, h = 22 } = {}) {
  const w = 20 + textWidth(label, size);
  return {
    w,
    svg:
      `<rect x="${r(x + 0.5)}" y="${r(y + 0.5)}" width="${r(w - 1)}" height="${h - 1}" rx="${h / 2}" fill="${theme.raised}" stroke="${theme.border}"/>` +
      text(x + 10, y + h / 2 + size * 0.36, label, { size, cls: 'm' }),
  };
}

/* -------------------------------------------------------------------- about */

function about(theme, t, c) {
  const left = W * 0.62;
  const cols = Math.floor((left - PAD * 2) / (14 * 0.6));
  const parts = [];
  let y = 92;
  c.paragraphs.forEach((p, pi) => {
    const lines = richLines(p, cols, theme);
    parts.push(
      `<g class="in" style="animation-delay:${0.08 * pi}s">` +
        lines.map((l, i) => `<text x="${PAD}" y="${y + i * 25}" font-size="14" fill="${theme.muted}">${l}</text>`).join('') +
        `</g>`,
    );
    y += lines.length * 25 + 16;
  });
  // availability pill
  const pillY = y + 4;
  const pw = 44 + textWidth(c.open, 13);
  parts.push(
    `<g class="in" style="animation-delay:.2s">` +
      `<rect x="${PAD + 0.5}" y="${pillY + 0.5}" width="${r(pw)}" height="31" rx="15.5" fill="${theme.accentSoft}" stroke="${theme.accent}" stroke-opacity=".6"/>` +
      `<circle class="pulse" cx="${PAD + 18}" cy="${pillY + 16}" r="4" fill="${theme.accent}"/>` +
      text(PAD + 32, pillY + 20.5, c.open, { size: 13, extra: `fill="${theme.accentText}" font-weight="700"` }) +
      `</g>`,
  );
  const H = Math.max(pillY + 31 + PAD, 92 + c.principles.length * 34 + 30);

  // principles column
  const px = left + 24;
  parts.push(`<path d="M${r(left)} 76V${H - 26}" stroke="${theme.divider}"/>`);
  parts.push(text(px, 86, c.principlesTitle, { size: 11, weight: 700, extra: `fill="${theme.accentText}" letter-spacing="1.6"` }));
  c.principles.forEach((p, i) => {
    const py = 122 + i * 34;
    parts.push(
      `<g class="in" style="animation-delay:${r(0.1 + 0.06 * i)}s">` +
        glyph('diamond', px, py - 12, 14, theme.accent, 1.6) +
        text(px + 26, py, p, { size: 13.5 }) +
        `</g>`,
    );
  });
  return panel({
    height: H,
    theme,
    title: c.title,
    meta: c.meta,
    docTitle: c.title,
    desc: `${c.paragraphs.map(plain).join(' ')} ${c.principles.join('. ')}. ${c.open}.`,
    body: parts.join('\n'),
  });
}

/* ----------------------------------------------------------------- projects */

function projects(theme, t, c) {
  const nameX = PAD + 46;
  const cols = Math.floor((W - nameX - PAD) / (13 * 0.6));
  const parts = [];
  let y = 70;
  c.items.forEach((p, i) => {
    const top = y;
    if (i) parts.push(`<path d="M${PAD} ${top}H${W - PAD}" stroke="${theme.divider}"/>`);
    const row = [];
    row.push(text(PAD, top + 34, String(i + 1).padStart(2, '0'), { size: 13, weight: 700, extra: `fill="${theme.accentText}"` }));
    row.push(text(nameX, top + 34, p.name, { size: 17, weight: 700 }));
    if (p.link) {
      const lx = nameX + textWidth(p.name, 17) + 16;
      row.push(text(lx, top + 33, p.linkLabel, { size: 11.5, cls: 's' }));
      row.push(glyph('arrowUpRight', lx + textWidth(p.linkLabel, 11.5) + 3, top + 23, 12, theme.subtle, 1.6));
    }
    // status pill
    const label = c.status[p.status];
    const sw = 34 + textWidth(label, 11.5);
    const sx = W - PAD - sw;
    const tone = p.status === 'live' ? theme.accent : p.status === 'public' ? theme.ink : theme.subtle;
    row.push(
      `<rect x="${r(sx + 0.5)}" y="${top + 17.5}" width="${r(sw - 1)}" height="23" rx="11.5" fill="none" stroke="${tone}" stroke-opacity=".55"/>` +
        `<circle ${p.status === 'live' ? 'class="pulse" ' : ''}cx="${r(sx + 14)}" cy="${top + 29}" r="3.5" fill="${tone}"/>` +
        text(sx + 24, top + 33, label, { size: 11.5, extra: `fill="${tone}"` }),
    );
    // description
    const lines = richLines(p.desc, cols, theme);
    lines.forEach((l, li) => row.push(`<text x="${nameX}" y="${top + 62 + li * 21}" font-size="13" fill="${theme.muted}">${l}</text>`));
    // stack chips
    let cx = nameX;
    const cy = top + 62 + lines.length * 21 - 4;
    p.stack.forEach((s) => {
      const ch = chip(s, cx, cy, theme);
      row.push(ch.svg);
      cx += ch.w + 6;
    });
    parts.push(`<g class="in" style="animation-delay:${r(0.07 * i)}s">${row.join('')}</g>`);
    y = cy + 22 + 22;
  });
  const H = y + 6;
  const priv = c.items.filter((p) => p.status === 'private').length;
  return panel({
    height: H,
    theme,
    title: c.title,
    meta: c.meta(c.items.length, priv),
    docTitle: c.title,
    desc: c.items.map((p) => `${p.name} (${c.status[p.status]}): ${p.desc} ${p.stack.join(', ')}.`).join(' '),
    body: parts.join('\n'),
  });
}

/* --------------------------------------------------------------- experience */

function experience(theme, t, c) {
  const rail = 250;
  const tx = rail + 34;
  const cols = Math.floor((W - tx - PAD) / (13 * 0.6));
  const parts = [];
  let y = 74;
  const nodes = [];
  c.items.forEach((e, i) => {
    const top = y;
    const row = [];
    row.push(text(PAD, top + 22, e.period, { size: 13.5, weight: 700 }));
    row.push(text(PAD, top + 44, e.where, { size: 11.5, cls: 's' }));
    row.push(text(tx, top + 22, e.role, { size: 15.5, weight: 700 }));
    row.push(text(tx, top + 45, e.org, { size: 12.5, extra: `fill="${theme.accentText}"` }));
    let py = top + 74;
    e.points.forEach((p) => {
      richLines(p, cols - 3, theme).forEach((l, li) => {
        row.push(`<text x="${tx + (li ? 18 : 0)}" y="${py}" font-size="13" fill="${theme.muted}">${li ? '' : `<tspan fill="${theme.accent}">▸</tspan>  `}${l}</text>`);
        py += 21;
      });
    });
    nodes.push({ y: top + 17, first: i === 0 });
    parts.push(`<g class="in" style="animation-delay:${r(0.08 * i)}s">${row.join('')}</g>`);
    y = py + 18;
  });
  const H = y + 8;
  const rails = [`<path d="M${rail} ${nodes[0].y}V${nodes.at(-1).y}" stroke="${theme.border}" stroke-width="1.5"/>`];
  nodes.forEach((n) =>
    rails.push(
      n.first
        ? `<circle cx="${rail}" cy="${n.y}" r="9" fill="${theme.accentSoft}"/><circle class="pulse" cx="${rail}" cy="${n.y}" r="5" fill="${theme.accent}"/>`
        : `<circle cx="${rail}" cy="${n.y}" r="5" fill="${theme.surface}" stroke="${theme.accent}" stroke-width="1.5"/>`,
    ),
  );
  return panel({
    height: H,
    theme,
    title: c.title,
    meta: c.meta(c.items.length),
    docTitle: c.title,
    desc: c.items.map((e) => `${e.period}, ${e.role}, ${e.org} (${e.where}): ${e.points.join('; ')}.`).join(' '),
    body: [...rails, ...parts].join('\n'),
  });
}

/* -------------------------------------------------------------------- stack */

const COLS = 3;
const COL_W = W / COLS;
const ICON = 30;
const CELL = 74;
const ROW_H = 132;

function techStack(theme, t) {
  const rows = Math.ceil(stack.length / COLS);
  const H = rows * ROW_H - 18;
  const parts = [];
  stack.forEach((group, gi) => {
    const label = t.stack.labels[group.key];
    const col = gi % COLS;
    const row = Math.floor(gi / COLS);
    const x0 = col * COL_W + 12;
    const y0 = row * ROW_H;
    parts.push(`<g class="in" style="animation-delay:${r(0.08 * gi)}s">`);
    parts.push(text(x0, y0 + 16, label, { size: 11.5, weight: 700, extra: `fill="${theme.accentText}" letter-spacing="1.6"` }));
    parts.push(`<path d="M${r(x0 + textWidth(label, 11.5) + label.length * 1.6 + 10)} ${y0 + 12}H${r(x0 + COL_W - 40)}" stroke="${theme.divider}"/>`);
    group.items.forEach(([name, ic], i) => {
      const cx = x0 + i * CELL + CELL / 2 - 8;
      parts.push(icon(ic, cx - ICON / 2, y0 + 40, ICON, theme.ink));
      parts.push(text(cx, y0 + 40 + ICON + 22, name, { size: 11, cls: 'm', anchor: 'middle' }));
    });
    parts.push('</g>');
  });
  const all = stack.map((g) => `${t.stack.labels[g.key].toLocaleLowerCase(t.code)}: ${g.items.map(([n]) => n).join(', ')}`).join('; ');
  return document({ width: W, height: H, theme, title: t.stack.doc, desc: all, css: CSS, body: parts.join('\n') });
}

/* --------------------------------------------------------------------- main */

export function buildAll() {
  const files = {};
  for (const t of Object.values(locales)) {
    const c = copy[t.code];
    for (const theme of Object.values(themes)) {
      const n = (name) => `${name}-${theme.name}${t.suffix}.svg`;
      files[n('about')] = about(theme, t, c.about);
      files[n('projects')] = projects(theme, t, c.projects);
      files[n('experience')] = experience(theme, t, c.experience);
      files[n('stack')] = techStack(theme, t);
    }
  }
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
