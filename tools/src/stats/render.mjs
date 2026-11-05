import { document, esc, frame, r, text, textWidth } from '../svg.mjs';
import { glyph } from '../glyphs.mjs';

const CSS =
  '.in{animation:in .7s cubic-bezier(.2,.7,.2,1) both}' +
  // motion only — content is never hidden, so static renderers still show everything
  '@keyframes in{from{transform:translateY(4px)}to{transform:none}}' +
  '@media (prefers-reduced-motion:reduce){.in{animation:none}}';

const fmt = (n, t) => (n == null ? '—' : n.toLocaleString(t.numberLocale));

function day(date, withYear, t) {
  const d = new Date(`${date}T00:00:00Z`);
  const m = t.months[d.getUTCMonth()];
  if (t.code === 'tr') return `${d.getUTCDate()} ${m}${withYear ? ` ${d.getUTCFullYear()}` : ''}`;
  return `${m} ${d.getUTCDate()}${withYear ? `, ${d.getUTCFullYear()}` : ''}`;
}

function monthYear(date, t) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${t.months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function range(start, end, today, t) {
  const year = today.slice(0, 4);
  const cross = start.slice(0, 4) !== year || end.slice(0, 4) !== year;
  if (start === end) return day(start, cross, t);
  return `${day(start, cross, t)} – ${end === today ? t.today : day(end, cross, t)}`;
}

/** Card chrome shared by every card: frame, small-caps title, meta, rule. */
function card({ width, height, theme, title, meta, body, desc, docTitle }) {
  return document({
    width,
    height,
    theme,
    weights: ['Regular', 'Bold'],
    title: docTitle,
    desc,
    css: CSS,
    body: [
      frame({ width, height, theme, radius: 12 }),
      text(26, 36, title, { size: 12, weight: 700, extra: `fill="${theme.fg}" letter-spacing="1.6"` }),
      text(width - 26, 36, meta, { size: 11, cls: 's', anchor: 'end' }),
      `<path d="M26 52H${width - 26}" stroke="${theme.divider}"/>`,
      body,
    ].join('\n'),
  });
}

/* ------------------------------------------------------------------ streak */

export function renderStreak(s, theme, { today, t }) {
  const W = 1180;
  const H = 236;
  const colW = (W - 52) / 3;
  const cx = (i) => 26 + colW * i + colW / 2;
  const L = t.streak;
  const label = (x, y, v) => text(x, y, v, { size: 13, anchor: 'middle', extra: `fill="${theme.accentText}" font-weight="700"` });
  const column = (i, value, title, sub, delay) =>
    `<g class="in" style="animation-delay:${delay}s">` +
    text(cx(i), 140, value, { size: 38, weight: 700, anchor: 'middle' }) +
    label(cx(i), 176, title) +
    text(cx(i), 200, sub, { size: 11.5, cls: 's', anchor: 'middle' }) +
    `</g>`;

  const currentSub = !s
    ? '—'
    : s.current.length
      ? range(s.current.start, s.current.end, today, t)
      : s.lastContribution
        ? `${L.lastActive} ${range(s.lastContribution, s.lastContribution, today, t)}`
        : L.none;

  const ry = 112;
  const R = 44;
  const C = 2 * Math.PI * R;
  const parts = [
    column(0, fmt(s?.totalContributions, t), L.total, s?.firstContribution ? `${monthYear(s.firstContribution, t)} – ${t.present}` : '—', 0),
    column(2, s ? fmt(s.longest.length, t) : '—', L.longest, s?.longest.start ? range(s.longest.start, s.longest.end, today, t) : '—', 0.16),
    `<g class="in" style="animation-delay:.08s">` +
      `<circle cx="${r(cx(1))}" cy="${ry}" r="${R}" stroke="${theme.border}" stroke-width="3"/>` +
      `<circle cx="${r(cx(1))}" cy="${ry}" r="${R}" stroke="${theme.accent}" stroke-width="3" stroke-linecap="round" ` +
      `stroke-dasharray="${r(C)}" stroke-dashoffset="${r(C * 0.06)}" transform="rotate(-90 ${r(cx(1))} ${ry})">` +
      `<animate attributeName="stroke-dashoffset" values="${r(C)};${r(C * 0.06)}" dur="1.4s" begin="0s" fill="freeze" calcMode="spline" keySplines=".3 0 .2 1" keyTimes="0;1"/></circle>` +
      `<rect x="${r(cx(1) - 13)}" y="${ry - R - 13}" width="26" height="26" fill="${theme.surface}"/>` +
      glyph('flame', cx(1) - 10, ry - R - 11, 20, theme.accent, 1.7) +
      text(cx(1), ry + 13, s ? fmt(s.current.length, t) : '—', { size: 36, weight: 700, anchor: 'middle' }) +
      label(cx(1), 182, L.current) +
      text(cx(1), 204, currentSub, { size: 11.5, cls: 's', anchor: 'middle' }) +
      `</g>`,
    `<path d="M${r(26 + colW)} 76V210M${r(26 + 2 * colW)} 76V210" stroke="${theme.divider}"/>`,
  ];
  return card({
    width: W,
    height: H,
    theme,
    title: L.title,
    meta: `${t.updated} ${s?.generatedAt ?? today}`,
    docTitle: L.doc,
    desc: s ? `${L.total}: ${s.totalContributions}; ${L.current}: ${s.current.length}; ${L.longest}: ${s.longest.length}.` : t.pending,
    body: parts.join('\n'),
  });
}

/* ------------------------------------------------------------------- stats */

const HALF_W = 580;
const HALF_H = 240;

export function renderStats(s, theme, { t }) {
  const values = [s?.stars, s?.commits, s?.pullRequests, s?.issues, s?.repositories];
  const glyphs = ['star', 'commit', 'pull', 'issue', 'repo'];
  const x0 = 26;
  const x1 = HALF_W - 26;
  const cw = 13.5 * 0.6;
  const parts = t.stats.rows.map((label, i) => {
    const y = 88 + i * 30;
    const v = fmt(values[i], t);
    const lx = x0 + 28 + textWidth(label, 13.5) + 8;
    const vx = x1 - textWidth(v, 13.5) - 8;
    const dots = Math.max(2, Math.floor((vx - lx) / cw));
    return (
      `<g class="in" style="animation-delay:${r(0.06 * i)}s">` +
      glyph(glyphs[i], x0, y - 13, 17, theme.accent, 1.6) +
      text(x0 + 28, y, label, { size: 13.5, cls: 'm' }) +
      `<text x="${r(lx)}" y="${y}" font-size="13.5" fill="${theme.leader}" textLength="${r(dots * cw)}" lengthAdjust="spacingAndGlyphs">${'.'.repeat(dots)}</text>` +
      text(x1, y, v, { size: 13.5, weight: 700, anchor: 'end' }) +
      `</g>`
    );
  });
  return card({
    width: HALF_W,
    height: HALF_H,
    theme,
    title: t.stats.title,
    meta: t.stats.meta,
    docTitle: t.stats.doc,
    desc: s ? t.stats.rows.map((l, i) => `${l}: ${values[i]}`).join(', ') : t.pending,
    body: parts.join('\n'),
  });
}

/* --------------------------------------------------------------- languages */

/** A single gold-to-slate ramp keeps the card as calm as the banner. */
const RAMP = {
  dark: ['#e0c58e', '#c8a96a', '#ad8d52', '#8f7443', '#d8d2c4', '#a3a9b2', '#7d848e', '#5f6670'],
  light: ['#6e5420', '#8a6a2c', '#a8894e', '#c4a76c', '#2a241b', '#555c66', '#7d848e', '#a39e94'],
};

export function renderLanguages(s, theme, { t }) {
  const langs = s?.languages ?? [];
  const x0 = 26;
  const width = HALF_W - 52;
  const barY = 74;
  const parts = [
    `<clipPath id="bar"><rect x="${x0}" y="${barY}" width="${width}" height="8" rx="4"/></clipPath>`,
    `<rect x="${x0}" y="${barY}" width="${width}" height="8" rx="4" fill="${theme.divider}"/>`,
  ];
  if (!langs.length) {
    parts.push(text(x0, 120, t.pending, { size: 12.5, cls: 'm' }));
  } else {
    const shades = langs.map((l, i) => (l.name === 'Other' ? theme.subtle : RAMP[theme.name][i % 8]));
    let x = x0;
    const segs = langs.map((l, i) => {
      const w = i === langs.length - 1 ? x0 + width - x : l.share * width;
      const seg = `<rect x="${r(x)}" y="${barY}" width="${r(Math.max(0, w - 2))}" height="8" fill="${shades[i]}"/>`;
      x += w;
      return seg;
    });
    parts.push(`<g clip-path="url(#bar)" class="in">${segs.join('')}</g>`);
    const colW = width / 2;
    langs.forEach((l, i) => {
      const cx = x0 + (i % 2) * (colW + 12);
      const cy = 116 + Math.floor(i / 2) * 27;
      const pct = `${(l.share * 100).toLocaleString(t.numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
      parts.push(
        `<g class="in" style="animation-delay:${r(0.05 * i)}s">` +
          `<rect x="${r(cx)}" y="${cy - 9}" width="9" height="9" rx="2" fill="${shades[i]}"/>` +
          text(cx + 18, cy, l.name === 'Other' ? t.langs.other : l.name, { size: 12.5 }) +
          text(cx + colW - 22, cy, pct, { size: 12, cls: 's', anchor: 'end' }) +
          `</g>`,
      );
    });
  }
  return card({
    width: HALF_W,
    height: HALF_H,
    theme,
    title: t.langs.title,
    meta: t.langs.meta,
    docTitle: t.langs.doc,
    desc: langs.length ? langs.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(', ') : t.pending,
    body: parts.join('\n'),
  });
}

/* ------------------------------------------------------------------- trail */

/**
 * Contribution calendar with a snake that travels the gutters *between* the
 * cells — down one gutter, round a half-turn, up the next — and lights every
 * contribution as its head passes. Nothing is eaten; the graph stays intact.
 */
export function renderTrail(s, theme, { today, t, year = null }) {
  const W = 1180;
  const H = 300;
  const weeks = year ? year.weeks : s?.trail ?? emptyWeeks(today);
  const cell = 15;
  const gap = 5;
  const step = cell + gap;
  const x0 = 26 + 40;
  const top = 96;
  const rows = 7;
  const gx = (c) => x0 - gap / 2 + c * step; // gutter left of column c
  const yTop = top - gap / 2;
  const yBot = top + rows * step - gap / 2;
  const half = step / 2;

  // Route: serpentine through every vertical gutter with half-turns outside the grid.
  const nG = weeks.length + 1;
  let d = `M${r(gx(0))} ${r(yTop - half)}`;
  const segLen = [];
  for (let c = 0; c < nG; c++) {
    const down = c % 2 === 0;
    d += `V${r(down ? yBot : yTop)}`;
    segLen.push(yBot - yTop + (c === 0 ? half : 0));
    if (c < nG - 1) {
      d += `A${half} ${half} 0 0 ${down ? 0 : 1} ${r(gx(c + 1))} ${r(down ? yBot : yTop)}`;
      segLen.push(Math.PI * half);
    }
  }
  d += `V${r(nG % 2 === 1 ? yBot + half : yTop - half)}`;
  segLen.push(half);
  const total = segLen.reduce((a, b) => a + b, 0);
  const speed = 210; // px per second
  const dur = r(total / speed);

  // distance along the route where gutter c passes the centre of row y
  const at = (c, row) => {
    let dist = 0;
    for (let k = 0; k < c; k++) dist += segLen[2 * k] + segLen[2 * k + 1];
    const cy = top + row * step + cell / 2;
    const down = c % 2 === 0;
    return dist + (c === 0 ? half : 0) + (down ? cy - yTop : yBot - cy);
  };

  const parts = [];
  // month labels and weekday labels
  let lastMonth = -1;
  let lastCol = -10;
  weeks.forEach((w, c) => {
    const m = new Date(`${w[0].date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth) {
      if (c - lastCol >= 3 && c < weeks.length - 2) {
        parts.push(text(x0 + c * step, top - 20, t.months[m], { size: 11, cls: 's' }));
        lastCol = c;
      }
      lastMonth = m;
    }
  });
  t.days.forEach((label, i) => parts.push(text(26, top + (1 + i * 2) * step + cell - 3, label, { size: 10.5, cls: 's' })));

  // cells, plus a glow overlay timed to the snake's head on the left gutter
  const glow = theme.heat[4];
  weeks.forEach((w, c) => {
    const cells = [];
    for (const dd of w) {
      const row = new Date(`${dd.date}T00:00:00Z`).getUTCDay();
      const x = r(x0 + c * step);
      const y = r(top + row * step);
      cells.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${theme.heat[dd.level]}"><title>${esc(t.trail.cell(dd.count, dd.date))}</title></rect>`,
      );
      if (dd.level > 0) {
        const f = at(c, row) / total;
        const a = Math.max(0, f - 0.002);
        const b = Math.min(1, f + 0.03);
        cells.push(
          `<rect x="${r(x - 2)}" y="${r(y - 2)}" width="${cell + 4}" height="${cell + 4}" rx="4.5" fill="none" stroke="${glow}" stroke-width="1.5" opacity="0">` +
            `<animate attributeName="opacity" dur="${dur}s" begin="1s" repeatCount="indefinite" keyTimes="0;${r4(a)};${r4(f)};${r4(b)};1" values="0;0;1;0;0"/></rect>`,
        );
      }
    }
    parts.push(`<g class="in" style="animation-delay:${r(0.004 * c)}s">${cells.join('')}</g>`);
  });

  // the snake: a travelling dash with a tapering tail, and a head on the same clock
  const body = [
    [150, 2, 0.35],
    [96, 3, 0.7],
    [48, 4, 1],
  ];
  body.forEach(([len, w, o]) => {
    parts.push(
      `<path d="${d}" stroke="${theme.ink}" stroke-width="${w}" stroke-linecap="round" stroke-opacity="${o}" ` +
        `stroke-dasharray="${len} ${r(total + 200)}" stroke-dashoffset="${len}">` +
        `<animate attributeName="stroke-dashoffset" values="${len};${r(len - total)}" dur="${dur}s" begin="1s" repeatCount="indefinite"/></path>`,
    );
  });
  parts.push(
    `<circle r="4.2" fill="${theme.ink}" opacity="0"><set attributeName="opacity" to="1" begin="1s"/>` +
      `<animateMotion path="${d}" dur="${dur}s" begin="1s" repeatCount="indefinite"/></circle>`,
  );

  // legend
  const ly = yBot + half + 30;
  const lx = W - 26 - 5 * step - textWidth(t.trail.more, 11) - 10;
  parts.push(text(lx - 8, ly, t.trail.less, { size: 11, cls: 's', anchor: 'end' }));
  theme.heat.forEach((c, i) => parts.push(`<rect x="${r(lx + i * step)}" y="${ly - cell + 3}" width="${cell}" height="${cell}" rx="3" fill="${c}"/>`));
  parts.push(text(W - 26, ly, t.trail.more, { size: 11, cls: 's', anchor: 'end' }));
  parts.push(text(26, ly, t.trail.caption, { size: 11, cls: 's' }));

  return card({
    width: W,
    height: H,
    theme,
    title: t.trail.title,
    meta: year ? t.trail.year(year.year, year.total) : t.trail.meta,
    docTitle: t.trail.doc,
    desc: s ? `${t.trail.doc}. ${t.streak.total}: ${year ? year.total : s.trailTotal}.` : t.pending,
    body: parts.join('\n'),
  });
}

const r4 = (n) => Math.round(n * 10000) / 10000;

function emptyWeeks(today) {
  const end = new Date(`${today}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 52 * 7 - start.getUTCDay());
  const weeks = [];
  for (const d = new Date(start); d <= end; ) {
    const w = [];
    for (let i = 0; i < 7 && d <= end; i++) {
      w.push({ date: d.toISOString().slice(0, 10), count: 0, level: 0 });
      d.setUTCDate(d.getUTCDate() + 1);
    }
    weeks.push(w);
  }
  return weeks;
}

export const _internals = { range, monthYear };
