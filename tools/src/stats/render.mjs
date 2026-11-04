import { legible } from '../color.mjs';
import { document, esc, frame, r, text, textWidth, windowChrome } from '../svg.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const W = 880;
const H = 412;
const PAD = 28;

const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

function kpis(stats, theme) {
  const items = [
    [fmt(stats?.contributions), 'contributions', 'last 12 months'],
    [fmt(stats?.commits), 'commits', 'last 12 months'],
    [fmt(stats?.stars), 'stars earned', 'public repos'],
    [stats ? `${stats.current}d` : '—', 'current streak', 'consecutive days'],
    [stats ? `${stats.longest}d` : '—', 'longest streak', 'last 12 months'],
    [fmt(stats?.repositories), 'repositories', 'public, non-fork'],
  ];
  const colW = 146;
  return items
    .map(([value, label, hint], i) => {
      const x = PAD + (i % 3) * colW;
      const y = 96 + Math.floor(i / 3) * 76;
      return (
        `<g class="fade" style="animation-delay:${r(0.05 * i)}s">` +
        text(x, y, value, { size: 26, weight: 800 }) +
        text(x, y + 21, label, { size: 12 }) +
        text(x, y + 37, hint, { size: 10.5, cls: 's' }) +
        `</g>`
      );
    })
    .join('');
}

function languagePanel(stats, theme) {
  const x0 = 486;
  const width = W - PAD - x0;
  const parts = [text(x0, 74, 'languages · by repository', { size: 11, cls: 's' })];
  const barY = 88;
  const langs = stats?.languages ?? [];

  parts.push(
    `<clipPath id="bar"><rect x="${x0}" y="${barY}" width="${width}" height="10" rx="5"/></clipPath>`,
    `<rect x="${x0}" y="${barY}" width="${width}" height="10" rx="5" fill="${theme.divider}"/>`,
  );
  if (!langs.length) {
    parts.push(text(x0, 134, 'awaiting first workflow run', { size: 12, cls: 'm' }));
    return parts.join('');
  }

  const colors = langs.map((l) => (l.color ? legible(l.color, theme.surface, 2.2) : theme.subtle));
  let x = x0;
  const segs = [];
  langs.forEach((l, i) => {
    const w = i === langs.length - 1 ? x0 + width - x : l.share * width;
    segs.push(`<rect x="${r(x)}" y="${barY}" width="${r(Math.max(0, w - 2))}" height="10" fill="${colors[i]}"/>`);
    x += w;
  });
  parts.push(`<g clip-path="url(#bar)">${segs.join('')}</g>`);

  const colW = width / 2;
  langs.forEach((l, i) => {
    const cx = x0 + (i % 2) * colW;
    const cy = 130 + Math.floor(i / 2) * 27;
    const pct = `${(l.share * 100).toFixed(1)}%`;
    const maxName = Math.floor((colW - 24 - textWidth(pct, 11.5) - 14) / (12 * 0.6));
    const name = l.name.length > maxName ? l.name.slice(0, maxName - 1) + '…' : l.name;
    parts.push(
      `<circle cx="${r(cx + 5)}" cy="${cy - 4}" r="4.5" fill="${colors[i]}"/>`,
      text(cx + 16, cy, name, { size: 12 }),
      text(cx + colW - 14, cy, pct, { size: 11.5, cls: 'm', anchor: 'end' }),
    );
  });
  return parts.join('');
}

function placeholderWeeks(today) {
  const end = new Date(`${today}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay());
  const weeks = [];
  for (let d = new Date(start); d <= end; ) {
    const week = [];
    for (let i = 0; i < 7 && d <= end; i++) {
      week.push({ date: d.toISOString().slice(0, 10), count: 0, level: 0 });
      d.setUTCDate(d.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function heatmap(weeks, theme) {
  const top = 268;
  const dayLabelW = 34;
  const gap = 3;
  const x0 = PAD + dayLabelW;
  const cell = Math.min(12, (W - PAD - x0 + gap) / weeks.length - gap);
  const step = cell + gap;
  const parts = [];

  let lastMonth = -1;
  let lastLabelCol = -10;
  weeks.forEach((week, col) => {
    const month = new Date(`${week[0].date}T00:00:00Z`).getUTCMonth();
    if (month !== lastMonth) {
      if (col - lastLabelCol >= 3 && col < weeks.length - 2) {
        parts.push(text(x0 + col * step, top - 9, MONTHS[month], { size: 10.5, cls: 's' }));
        lastLabelCol = col;
      }
      lastMonth = month;
    }
  });
  ['Mon', 'Wed', 'Fri'].forEach((d, i) => parts.push(text(PAD, top + (1 + i * 2) * step + cell - 2, d, { size: 10.5, cls: 's' })));

  weeks.forEach((week, col) => {
    const cells = week.map((day) => {
      const row = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      const title = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`;
      return (
        `<rect x="${r(x0 + col * step)}" y="${r(top + row * step)}" width="${r(cell)}" height="${r(cell)}" rx="2.5" ` +
        `fill="${theme.heat[day.level] ?? theme.heat[0]}"><title>${esc(title)}</title></rect>`
      );
    });
    parts.push(`<g class="fade" style="animation-delay:${r(0.3 + col * 0.012)}s">${cells.join('')}</g>`);
  });

  const legendY = top + 7 * step + 22;
  const moreW = textWidth('more', 10.5);
  const legendX = W - PAD - moreW - 6 - 5 * step + gap;
  parts.push(text(legendX - 6, legendY, 'less', { size: 10.5, cls: 's', anchor: 'end' }));
  theme.heat.forEach((c, i) =>
    parts.push(`<rect x="${r(legendX + i * step)}" y="${r(legendY - cell + 2)}" width="${r(cell)}" height="${r(cell)}" rx="2.5" fill="${c}"/>`),
  );
  parts.push(text(W - PAD, legendY, 'more', { size: 10.5, cls: 's', anchor: 'end' }));
  return { svg: parts.join(''), legendY };
}

/** Renders the activity card. `stats` may be null to produce a placeholder. */
export function renderActivity(stats, theme, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const updated = stats?.generatedAt ?? today;
  const weeks = stats?.weeks?.length ? stats.weeks : placeholderWeeks(today);
  const map = heatmap(weeks, theme);
  const footer = stats
    ? `${fmt(stats.pullRequests)} pull requests · ${fmt(stats.issues)} issues · public data via GitHub GraphQL API`
    : 'generated by .github/workflows/activity.yml';

  const desc = stats
    ? `${stats.contributions} contributions and ${stats.commits} commits in the last 12 months; current streak ${stats.current} days, ` +
      `longest ${stats.longest} days; ${stats.repositories} public repositories with ${stats.stars} stars. Top languages: ` +
      stats.languages.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(', ') +
      '.'
    : 'Activity statistics will appear after the first scheduled workflow run.';

  return document({
    width: W,
    height: H,
    theme,
    weights: ['Regular', 'Bold', 'ExtraBold'],
    title: `GitHub activity for ${stats?.login ?? 'this profile'} — updated ${updated}`,
    desc,
    css:
      '.fade{animation:fade .6s cubic-bezier(.2,.7,.2,1) both}' +
      '@keyframes fade{from{opacity:0}to{opacity:1}}' +
      '@media (prefers-reduced-motion:reduce){.fade{animation:none}}',
    body: [
      frame({ width: W, height: H, theme }),
      windowChrome({ width: W, theme, title: `git log --since="12 months ago" · updated ${updated}` }),
      kpis(stats, theme),
      `<path d="M466 66V218" stroke="${theme.divider}"/>`,
      languagePanel(stats, theme),
      `<path d="M${PAD} 234H${W - PAD}" stroke="${theme.divider}"/>`,
      map.svg,
      text(PAD, map.legendY, footer, { size: 10.5, cls: 's' }),
    ].join('\n'),
  });
}
