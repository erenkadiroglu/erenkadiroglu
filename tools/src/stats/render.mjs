import { document, frame, r, text, textWidth } from '../svg.mjs';
import { glyph } from '../glyphs.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-US'));
const CSS =
  '.in{animation:in .7s cubic-bezier(.2,.7,.2,1) both}' +
  '@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}' +
  '@media (prefers-reduced-motion:reduce){.in{animation:none}}';

function day(date, withYear) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${withYear ? `, ${d.getUTCFullYear()}` : ''}`;
}

function monthYear(date) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function range(start, end, today) {
  if (!start) return 'no activity yet';
  const year = today.slice(0, 4);
  const cross = start.slice(0, 4) !== year || end.slice(0, 4) !== year;
  if (start === end) return day(start, cross);
  return `${day(start, cross)} – ${end === today ? 'Today' : day(end, cross)}`;
}

/** Card chrome shared by all three: frame, small-caps title, meta, rule. */
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

export function renderStreak(stats, theme, { today }) {
  const W = 1180;
  const H = 236;
  const colW = (W - 52) / 3;
  const cx = (i) => 26 + colW * i + colW / 2;
  const s = stats;
  const parts = [];

  const column = (i, value, label, sub, delay) =>
    `<g class="in" style="animation-delay:${delay}s">` +
    text(cx(i), 140, value, { size: 38, weight: 700, anchor: 'middle' }) +
    text(cx(i), 176, label, { size: 13, anchor: 'middle', extra: `fill="${theme.accentText}" font-weight="700"` }) +
    text(cx(i), 200, sub, { size: 11.5, cls: 's', anchor: 'middle' }) +
    `</g>`;

  parts.push(
    column(0, fmt(s?.totalContributions), 'Total Contributions', s?.firstContribution ? `${monthYear(s.firstContribution)} – Present` : '—', 0),
  );
  parts.push(column(2, s ? fmt(s.longest.length) : '—', 'Longest Streak', s ? range(s.longest.start, s.longest.end, today) : '—', 0.16));

  // centre: ring + flame + current streak
  const ry = 112;
  const R = 44;
  const C = 2 * Math.PI * R;
  parts.push(
    `<g class="in" style="animation-delay:.08s">` +
      `<circle cx="${r(cx(1))}" cy="${ry}" r="${R}" stroke="${theme.border}" stroke-width="3"/>` +
      `<circle cx="${r(cx(1))}" cy="${ry}" r="${R}" stroke="${theme.accent}" stroke-width="3" stroke-linecap="round" ` +
      `stroke-dasharray="${r(C)}" stroke-dashoffset="${r(C)}" transform="rotate(-90 ${r(cx(1))} ${ry})">` +
      `<animate attributeName="stroke-dashoffset" values="${r(C)};${r(C * 0.06)}" dur="1.4s" begin=".2s" fill="freeze" calcMode="spline" keySplines=".3 0 .2 1" keyTimes="0;1"/></circle>` +
      `<rect x="${r(cx(1) - 13)}" y="${ry - R - 13}" width="26" height="26" fill="${theme.surface}"/>` +
      glyph('flame', cx(1) - 10, ry - R - 11, 20, theme.accent, 1.7) +
      text(cx(1), ry + 13, s ? fmt(s.current.length) : '—', { size: 36, weight: 700, anchor: 'middle' }) +
      text(cx(1), 182, 'Current Streak', { size: 13, anchor: 'middle', extra: `fill="${theme.accentText}" font-weight="700"` }) +
      text(cx(1), 204, !s ? '—' : s.current.length ? range(s.current.start, s.current.end, today) : s.lastContribution ? `last active ${range(s.lastContribution, s.lastContribution, today)}` : 'no activity yet', { size: 11.5, cls: 's', anchor: 'middle' }) +
      `</g>`,
  );
  parts.push(`<path d="M${r(26 + colW)} 76V210M${r(26 + 2 * colW)} 76V210" stroke="${theme.divider}"/>`);

  return card({
    width: W,
    height: H,
    theme,
    title: 'CONTRIB.STREAK',
    meta: `updated ${s?.generatedAt ?? today}`,
    docTitle: 'GitHub contribution streak',
    desc: s
      ? `${s.totalContributions} total contributions; current streak ${s.current.length} days; longest streak ${s.longest.length} days.`
      : 'Contribution streak will appear after the first workflow run.',
    body: parts.join('\n'),
  });
}

/* ------------------------------------------------------------------- stats */

const HALF_W = 580;
const HALF_H = 240;

export function renderStats(stats, theme, { today }) {
  const s = stats;
  const rows = [
    ['star', 'Stars earned', s?.stars],
    ['commit', 'Commits', s?.commits],
    ['pull', 'Pull requests', s?.pullRequests],
    ['issue', 'Issues', s?.issues],
    ['repo', 'Repositories', s?.repositories],
  ];
  const x0 = 26;
  const x1 = HALF_W - 26;
  const cw = 13.5 * 0.6;
  const parts = rows.map(([g, label, value], i) => {
    const y = 88 + i * 30;
    const v = fmt(value);
    const lx = x0 + 28 + textWidth(label, 13.5) + 8;
    const vx = x1 - textWidth(v, 13.5) - 8;
    const dots = Math.max(2, Math.floor((vx - lx) / cw));
    return (
      `<g class="in" style="animation-delay:${r(0.06 * i)}s">` +
      glyph(g, x0, y - 13, 17, theme.accent, 1.6) +
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
    title: 'GIT.STATS',
    meta: 'all time',
    docTitle: 'GitHub stats',
    desc: s
      ? `${s.stars} stars, ${s.commits} commits, ${s.pullRequests} pull requests, ${s.issues} issues, ${s.repositories} repositories.`
      : 'Stats will appear after the first workflow run.',
    body: parts.join('\n'),
  });
}

/* --------------------------------------------------------------- languages */

export function renderLanguages(stats, theme) {
  const langs = stats?.languages ?? [];
  const x0 = 26;
  const width = HALF_W - 52;
  const barY = 74;
  const parts = [
    `<clipPath id="bar"><rect x="${x0}" y="${barY}" width="${width}" height="8" rx="4"/></clipPath>`,
    `<rect x="${x0}" y="${barY}" width="${width}" height="8" rx="4" fill="${theme.divider}"/>`,
  ];
  if (!langs.length) {
    parts.push(text(x0, 120, 'awaiting first workflow run', { size: 12.5, cls: 'm' }));
  } else {
    // Palette-bound: a single gold ramp keeps the card as calm as the banner.
    const shades = langs.map((_, i) => (i === langs.length - 1 && langs[i].name === 'Other' ? theme.subtle : rampShade(theme, i, langs.length)));
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
      const pct = `${(l.share * 100).toFixed(1)}%`;
      parts.push(
        `<g class="in" style="animation-delay:${r(0.05 * i)}s">` +
          `<rect x="${r(cx)}" y="${cy - 9}" width="9" height="9" rx="2" fill="${shades[i]}"/>` +
          text(cx + 18, cy, l.name, { size: 12.5 }) +
          text(cx + colW - 22, cy, pct, { size: 12, cls: 's', anchor: 'end' }) +
          `</g>`,
      );
    });
  }
  return card({
    width: HALF_W,
    height: HALF_H,
    theme,
    title: 'LANG.DIST',
    meta: 'by repository · sqrt(bytes)',
    docTitle: 'Most used languages',
    desc: langs.length ? langs.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(', ') : 'Languages will appear after the first workflow run.',
    body: parts.join('\n'),
  });
}

/** Evenly spaced steps from the accent toward the muted ink. */
function rampShade(theme, i, n) {
  const stops = theme.name === 'dark'
    ? ['#e0c58e', '#c8a96a', '#ad8d52', '#8f7443', '#d8d2c4', '#a3a9b2', '#7d848e', '#5f6670']
    : ['#6e5420', '#8a6a2c', '#a8894e', '#c4a76c', '#2a241b', '#555c66', '#7d848e', '#a39e94'];
  return stops[i % stops.length];
}

export const _internals = { range, monthYear };
