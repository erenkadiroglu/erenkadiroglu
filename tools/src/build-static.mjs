#!/usr/bin/env node
/**
 * Renders the static README assets (header, tech stack, project cards and
 * link buttons) for both GitHub themes into ../assets.
 *
 *   node src/build-static.mjs [--out <dir>]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { themes } from './theme.mjs';
import { document, esc, frame, icon, r, text, textWidth, windowChrome, wrap } from './svg.mjs';
import { glyph } from './glyphs.mjs';
import { legible } from './color.mjs';
import { featured, links, profile, projects, stack } from './content.mjs';

/* ------------------------------------------------------------------ header */

/** 5x7 pixel glyphs hidden inside the header's contribution-grid motif. */
const PIXEL = {
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
};

/** Deterministic PRNG so rebuilding never produces a noisy diff. */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function monogramGrid({ x, y, cols, rows, cell, gap, theme, delay }) {
  const rand = mulberry32(20240917);
  const lit = new Set();
  const word = ['E', 'K'];
  const glyphWidth = 5;
  const totalWidth = word.length * glyphWidth + (word.length - 1);
  const offset = Math.floor((cols - totalWidth) / 2);
  word.forEach((ch, gi) => {
    PIXEL[ch].forEach((row, ry) =>
      [...row].forEach((px, rx) => px === '#' && lit.add(`${offset + gi * (glyphWidth + 1) + rx},${ry}`)),
    );
  });
  const columns = [];
  for (let cx = 0; cx < cols; cx++) {
    const cells = [];
    for (let cy = 0; cy < rows; cy++) {
      const n = rand();
      const level = lit.has(`${cx},${cy}`) ? (n > 0.35 ? 4 : 3) : n > 0.9 ? 1 : 0;
      const fill = level === 0 ? theme.divider : theme.heat[level];
      cells.push(
        `<rect x="${r(x + cx * (cell + gap))}" y="${r(y + cy * (cell + gap))}" width="${cell}" height="${cell}" rx="2.5" fill="${fill}"/>`,
      );
    }
    columns.push(`<g class="fade" style="animation-delay:${r(delay + cx * 0.035)}s">${cells.join('')}</g>`);
  }
  return columns.join('');
}

function typedCommand({ x, y, command, start, theme, size, bg, id }) {
  const cw = size * 0.6;
  const prompt = `<tspan class="a" font-weight="800">❯</tspan> `;
  const cmdX = x + cw * 2;
  const len = [...command].length;
  const duration = r(len * 0.055);
  const cover =
    `<g class="cover" style="animation:type-${id} ${duration}s steps(${len}) ${start}s both,hide .01s linear ${r(start + duration + 0.35)}s forwards">` +
    `<rect x="${r(cmdX - 1)}" y="${r(y - size)}" width="${r(textWidth(command, size) + cw + 4)}" height="${r(size * 1.45)}" fill="${bg}"/>` +
    `<rect x="${r(cmdX)}" y="${r(y - size * 0.92)}" width="${r(cw)}" height="${r(size * 1.2)}" fill="${theme.accent}" opacity=".85"/>` +
    `</g>`;
  const keyframes = `@keyframes type-${id}{to{transform:translateX(${r(len * cw)}px)}}`;
  return {
    svg: `<text x="${x}" y="${y}" font-size="${size}">${prompt}${esc(command)}</text>${cover}`,
    keyframes,
    end: start + duration,
  };
}

function header(theme) {
  const W = 880;
  const H = 372;
  const pad = 34;
  const bg = theme.raised;
  const size = 14;
  const parts = [];
  const css = [];

  const cmd1 = typedCommand({ x: pad, y: 82, command: 'whoami', start: 0.35, theme, size, bg, id: 1 });
  const cmd2 = typedCommand({ x: pad, y: 214, command: 'cat ./profile.yml', start: cmd1.end + 0.75, theme, size, bg, id: 2 });
  css.push(cmd1.keyframes, cmd2.keyframes);

  const reveal = cmd1.end + 0.2;
  parts.push(cmd1.svg);
  parts.push(
    `<g class="fade" style="animation-delay:${r(reveal)}s">` +
      text(pad - 2, 134, profile.name, { size: 40, weight: 800 }) +
      `</g>`,
    `<g class="fade" style="animation-delay:${r(reveal + 0.12)}s">` +
      text(pad, 166, profile.role, { size: 15, cls: 'm' }) +
      `</g>`,
  );
  parts.push(monogramGrid({ x: W - pad - 20 * 14 + 3, y: 66, cols: 20, rows: 7, cell: 11, gap: 3, theme, delay: reveal + 0.1 }));

  parts.push(cmd2.svg);
  const factsStart = cmd2.end + 0.2;
  const keyWidth = 12;
  const colX = [pad, 470];
  profile.facts.forEach(([key, value], i) => {
    const col = Math.floor(i / 3);
    const row = i % 3;
    const y = 248 + row * 27;
    parts.push(
      `<g class="fade" style="animation-delay:${r(factsStart + i * 0.07)}s">` +
        `<text x="${colX[col]}" y="${y}" font-size="13.5"><tspan class="s">${esc(key.padEnd(keyWidth, ' ').replace(/ /g, ' '))}</tspan>${esc(value)}</text>` +
        `</g>`,
    );
  });

  const finalStart = factsStart + profile.facts.length * 0.07 + 0.25;
  parts.push(
    `<g class="fade" style="animation-delay:${r(finalStart)}s">` +
      `<text x="${pad}" y="340" font-size="${size}"><tspan class="a" font-weight="800">❯</tspan></text>` +
      `<rect class="blink" x="${r(pad + size * 0.6 * 2)}" y="${r(340 - size * 0.92)}" width="${r(size * 0.6)}" height="${r(size * 1.2)}" fill="${theme.accent}" opacity=".85" style="animation-delay:${r(finalStart)}s"/>` +
      `</g>`,
  );

  css.push(
    '.fade{animation:fade .7s cubic-bezier(.2,.7,.2,1) both}',
    '@keyframes fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}',
    '@keyframes hide{to{opacity:0}}',
    '.blink{animation:blink 1.1s steps(1) infinite}',
    '@keyframes blink{50%{opacity:0}}',
    '@media (prefers-reduced-motion:reduce){.fade,.blink{animation:none}.cover{display:none}}',
  );

  return document({
    width: W,
    height: H,
    theme,
    weights: ['Regular', 'Bold', 'ExtraBold'],
    title: `${profile.name} — ${profile.role}`,
    desc: profile.facts.map(([k, v]) => `${k}: ${v}`).join('; '),
    css: css.join(''),
    body: [
      frame({ width: W, height: H, theme, fill: bg }),
      windowChrome({ width: W, theme, title: `~/${profile.handle} — zsh` }),
      ...parts,
    ].join('\n'),
  });
}

/* ------------------------------------------------------------------- chips */

const CHIP_H = 32;

function brandChip(item, x, y, theme) {
  const size = 13;
  const w = 36 + textWidth(item.name, size) + 13;
  const mark = item.icon
    ? icon(item.icon, x + 11, y + 8, 16, theme)
    : glyph(item.glyph, x + 11, y + 8, 16, theme.accent, 1.7);
  return {
    w,
    svg:
      `<rect x="${r(x + 0.5)}" y="${r(y + 0.5)}" width="${r(w - 1)}" height="${CHIP_H - 1}" rx="8" fill="${theme.chip}" stroke="${theme.border}"/>` +
      mark +
      text(x + 36, y + 20.5, item.name, { size }),
  };
}

function tagChip(label, x, y, theme, { h = CHIP_H, size = 12.5, padX = 13 } = {}) {
  const w = padX * 2 + textWidth(label, size);
  return {
    w,
    svg:
      `<rect x="${r(x + 0.5)}" y="${r(y + 0.5)}" width="${r(w - 1)}" height="${h - 1}" rx="${h / 4}" stroke="${theme.border}" stroke-dasharray="3 3"/>` +
      text(x + padX, y + h / 2 + size * 0.36, label, { size, cls: 'm' }),
  };
}

/* ------------------------------------------------------------------- stack */

function techStack(theme) {
  const W = 880;
  const pad = 26;
  const labelW = 196;
  const gap = 8;
  const maxX = W - pad;
  const parts = [];
  let y = pad;

  stack.forEach((group, gi) => {
    if (gi > 0) {
      parts.push(`<path d="M${pad} ${r(y - 13)}H${W - pad}" stroke="${theme.divider}"/>`);
    }
    const top = y;
    parts.push(
      `<text x="${pad}" y="${r(top + 21)}" font-size="12.5"><tspan class="a">${String(gi + 1).padStart(2, '0')}</tspan><tspan class="m">  ${esc(group.label)}</tspan></text>`,
    );
    let x = pad + labelW;
    const place = (chip) => {
      if (x + chip.w > maxX) {
        x = pad + labelW;
        y += CHIP_H + gap;
      }
      return chip;
    };
    for (const item of group.items) {
      const probe = brandChip(item, 0, 0, theme);
      place(probe);
      const chip = brandChip(item, x, y, theme);
      parts.push(chip.svg);
      x += chip.w + gap;
    }
    for (const tag of group.tags ?? []) {
      const probe = tagChip(tag, 0, 0, theme);
      place(probe);
      const chip = tagChip(tag, x, y, theme);
      parts.push(chip.svg);
      x += chip.w + gap;
    }
    y += CHIP_H + 26;
  });

  const H = Math.round(y - 26 + pad);
  const all = stack.flatMap((g) => [...g.items.map((i) => i.name), ...(g.tags ?? [])]);
  return document({
    width: W,
    height: H,
    theme,
    title: 'Tech stack',
    desc: stack.map((g) => `${g.label}: ${[...g.items.map((i) => i.name), ...(g.tags ?? [])].join(', ')}`).join('. '),
    body: [frame({ width: W, height: H, theme }), ...parts].join('\n'),
  }).replace('<desc', `<!-- ${all.length} entries -->\n<desc`);
}

/* ---------------------------------------------------------------- projects */

function node(x, y, w, label, theme, { h = 30, emphasis = false } = {}) {
  return (
    `<rect x="${r(x + 0.5)}" y="${r(y + 0.5)}" width="${w - 1}" height="${h - 1}" rx="6" fill="${theme.surface}" stroke="${emphasis ? theme.accent : theme.border}"/>` +
    text(x + w / 2, y + h / 2 + 4.2, label, { size: 12, anchor: 'middle' })
  );
}

function arrow(points, theme, { dashed = false } = {}) {
  const d = points.map(([px, py], i) => `${i ? 'L' : 'M'}${r(px)} ${r(py)}`).join('');
  return `<path d="${d}" stroke="${theme.muted}" stroke-width="1.2" ${dashed ? 'stroke-dasharray="3 3"' : ''} marker-end="url(#arrow)"/>`;
}

function featuredCard(theme) {
  const W = 880;
  const H = 332;
  const pad = 28;
  const p = [];

  p.push(
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M1 1.5 9 5 1 8.5" fill="none" stroke="${theme.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`,
  );
  p.push(text(pad, 46, 'FEATURED PROJECT', { size: 11.5, cls: 'a', extra: 'letter-spacing="1.5"' }));
  p.push(text(pad, 84, featured.name, { size: 28, weight: 800 }));
  p.push(glyph('arrowUpRight', pad + textWidth(featured.name, 28) + 10, 64, 18, theme.subtle, 1.6));
  p.push(text(pad, 108, featured.repo, { size: 12, cls: 's' }));
  const taglineLines = wrap(featured.tagline, 52);
  taglineLines.forEach((line, i) => p.push(text(pad, 142 + i * 21, line, { size: 14 })));
  const pointsTop = 142 + taglineLines.length * 21 + 12;
  featured.points.forEach((pt, i) => {
    p.push(
      `<text x="${pad}" y="${pointsTop + i * 23}" font-size="12.5"><tspan class="a">▸</tspan><tspan class="m"> ${esc(pt)}</tspan></text>`,
    );
  });
  let tx = pad;
  for (const tag of featured.tags) {
    const chip = tagChip(tag, tx, H - pad - 26, theme, { h: 26, size: 11, padX: 10 });
    p.push(chip.svg);
    tx += chip.w + 6;
  }

  // Architecture panel
  const ax = 480;
  const ay = 24;
  const aw = W - ax - 24;
  const ah = H - 48;
  p.push(`<rect x="${ax + 0.5}" y="${ay + 0.5}" width="${aw - 1}" height="${ah - 1}" rx="10" fill="${theme.raised}" stroke="${theme.divider}"/>`);
  p.push(text(ax + 16, ay + 24, 'architecture', { size: 11, cls: 's' }));

  const ix = ax + 16;
  const iw = aw - 32;
  const nodeW = Math.floor((iw - 24 - 2 * 14) / 3);
  const col = (i) => ix + 12 + i * (nodeW + 14);

  // device boundary
  const dTop = ay + 38;
  const dH = 128;
  p.push(`<rect x="${ix + 0.5}" y="${dTop + 0.5}" width="${iw - 1}" height="${dH}" rx="8" stroke="${theme.border}" stroke-dasharray="4 4"/>`);
  p.push(text(ix + iw - 12, dTop + 17, 'android client', { size: 10.5, cls: 's', anchor: 'end' }));
  const row1 = dTop + 28;
  const row2 = row1 + 58;
  p.push(node(col(0), row1, nodeW, 'View', theme));
  p.push(node(col(1), row1, nodeW, 'ViewModel', theme));
  p.push(node(col(2), row1, nodeW, 'Repository', theme, { emphasis: true }));
  p.push(node(col(1), row2, nodeW, 'Room · DAO', theme));
  p.push(node(col(2), row2, nodeW, 'Retrofit', theme));
  p.push(arrow([[col(0) + nodeW, row1 + 15], [col(1) - 2, row1 + 15]], theme));
  p.push(arrow([[col(1) + nodeW, row1 + 15], [col(2) - 2, row1 + 15]], theme));
  p.push(arrow([[col(2) + nodeW / 2 - 18, row1 + 30], [col(2) + nodeW / 2 - 18, row1 + 44], [col(1) + nodeW / 2, row1 + 44], [col(1) + nodeW / 2, row2 - 2]], theme));
  p.push(arrow([[col(2) + nodeW / 2, row1 + 30], [col(2) + nodeW / 2, row2 - 2]], theme));
  p.push(text(col(0) + nodeW / 2, row2 + 13, 'offline-first', { size: 10.5, cls: 'a', anchor: 'middle' }));
  p.push(text(col(0) + nodeW / 2, row2 + 27, 'local cache', { size: 10.5, cls: 's', anchor: 'middle' }));

  // backend boundary
  const bTop = dTop + dH + 30;
  const bH = ay + ah - 14 - bTop;
  p.push(`<rect x="${ix + 0.5}" y="${bTop + 0.5}" width="${iw - 1}" height="${bH}" rx="8" stroke="${theme.border}" stroke-dasharray="4 4"/>`);
  p.push(text(ix + 12, bTop + bH - 10, 'backend', { size: 10.5, cls: 's' }));
  const row3 = bTop + (bH - 30) / 2;
  p.push(node(col(2), row3, nodeW, 'PHP REST API', theme));
  p.push(node(col(1), row3, nodeW, 'MySQL', theme));
  p.push(arrow([[col(2) + nodeW / 2, row2 + 30], [col(2) + nodeW / 2, row3 - 2]], theme));
  p.push(text(col(2) + nodeW / 2 - 8, row2 + 30 + (row3 - row2 - 30) / 2 + 4, 'JSON / HTTP', { size: 10.5, cls: 's', anchor: 'end' }));
  p.push(arrow([[col(2), row3 + 15], [col(1) + nodeW + 2, row3 + 15]], theme));

  return document({
    width: W,
    height: H,
    theme,
    weights: ['Regular', 'Bold', 'ExtraBold'],
    title: `${featured.name} — ${featured.tagline}`,
    desc:
      `${featured.points.join('. ')}. Stack: ${featured.tags.join(', ')}. ` +
      'Architecture: View → ViewModel → Repository, which reads from a Room cache and a Retrofit client calling a PHP REST API backed by MySQL.',
    body: [frame({ width: W, height: H, theme }), ...p].join('\n'),
  });
}

function projectCard(project, theme) {
  const W = 432;
  const H = 196;
  const pad = 24;
  const p = [];
  p.push(text(pad, 42, project.name, { size: 16, weight: 700 }));
  p.push(glyph('arrowUpRight', W - pad - 16, 28, 16, theme.subtle, 1.6));
  p.push(text(pad, 63, project.repo, { size: 11, cls: 's' }));
  wrap(project.description, 47)
    .slice(0, 3)
    .forEach((line, i) => p.push(text(pad, 95 + i * 20, line, { size: 12.5, cls: 'm' })));

  const by = H - pad - 4;
  const dot = legible(project.language.color, theme.surface, 2.2);
  p.push(`<circle cx="${pad + 5}" cy="${by - 4}" r="5" fill="${dot}"/>`);
  p.push(text(pad + 16, by, project.language.name, { size: 12, cls: 'm' }));

  let x = W - pad;
  const chips = [];
  for (const tag of [...project.tags].reverse()) {
    const w = tagChip(tag, 0, 0, theme, { h: 24, size: 11 }).w;
    x -= w;
    chips.unshift(tagChip(tag, x, by - 17, theme, { h: 24, size: 11 }).svg);
    x -= 6;
  }
  p.push(...chips);

  return document({
    width: W,
    height: H,
    theme,
    title: `${project.name} — ${project.repo}`,
    desc: `${project.description} Language: ${project.language.name}. Topics: ${project.tags.join(', ')}.`,
    body: [frame({ width: W, height: H, theme }), ...p].join('\n'),
  });
}

/* ------------------------------------------------------------------- links */

function linkButton(link, theme) {
  const size = 13;
  const H = 38;
  const W = Math.ceil(14 + 16 + 10 + textWidth(link.label, size) + 16);
  const mark = link.icon
    ? icon(link.icon, 14, 11, 16, theme, theme.fg)
    : glyph(link.glyph, 14, 11, 16, theme.fg, 1.7);
  return document({
    width: W,
    height: H,
    theme,
    title: link.label,
    desc: link.href.replace(/^mailto:/, ''),
    weights: ['Regular'],
    body: [frame({ width: W, height: H, theme, fill: theme.raised, radius: 9 }), mark, text(40, 23.5, link.label, { size })].join('\n'),
  });
}

/* -------------------------------------------------------------------- main */

export function buildAll() {
  const files = {};
  for (const theme of Object.values(themes)) {
    const t = theme.name;
    files[`header-${t}.svg`] = header(theme);
    files[`stack-${t}.svg`] = techStack(theme);
    files[`projects/${featured.slug}-${t}.svg`] = featuredCard(theme);
    for (const project of projects) files[`projects/${project.slug}-${t}.svg`] = projectCard(project, theme);
    for (const link of links) files[`links/${link.slug}-${t}.svg`] = linkButton(link, theme);
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
