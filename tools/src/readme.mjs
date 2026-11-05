#!/usr/bin/env node
/**
 * Writes README.md (English, shown on the profile) and README.tr.md (Turkish)
 * from one template, so both languages always share the same structure.
 * Year calendars are listed from assets/generated/manifest.json.
 *
 *   node src/readme.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { copy } from './copy.mjs';

const root = (p) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

// Flags share one 3:2 box so both read the same size.
const flag = (code) => `<img src="assets/flags/${code}.svg" width="21" height="14" alt="">`;

const ui = {
  en: {
    file: 'README.md',
    suffix: '',
    // Relative links resolve on the profile, in the repository and on any branch.
    switch: `${flag('gb')}&nbsp; <b>English</b> &nbsp;&nbsp;|&nbsp;&nbsp; <a href="README.tr.md">${flag('tr')}&nbsp; Türkçe</a>`,
    bannerAlt: 'Eren Kadiroğlu — Mobile &amp; Web Developer. A dithered portrait that dissolves into the React, TypeScript and code logos, next to a system-info panel.',
    h: { about: 'About', work: 'Featured work', experience: 'Experience', stack: 'Tech stack', activity: 'GitHub activity' },
    stackAlt: 'Languages: TypeScript, JavaScript, Python, C++, Java. Frontend: React, Next.js, Tailwind, Vite. Mobile: React Native, Expo, Android Studio. Backend: Node.js, NestJS, FastAPI, Socket.IO. Data: PostgreSQL, Prisma, Redis, SQLite. Infra and tools: Docker, GitHub Actions, Git, VS Code.',
    alts: {
      streak: 'Contribution streak: total contributions, current streak and longest streak.',
      stats: 'GitHub stats: stars, commits, pull requests, issues and repositories.',
      langs: 'Most used languages across repositories.',
      trail: 'Contribution graph for the last 12 months with a snake weaving between the cells.',
      year: (y) => `Contribution graph for ${y}.`,
    },
    years: 'Browse by year',
    yearLabel: (y, n) => `${y} · ${n.toLocaleString('en-US')} contribution${n === 1 ? '' : 's'}`,
    note: 'Cards and calendars are rendered daily by a GitHub Action in this repository from the same contribution graph GitHub shows on the profile — no third-party stats services.',
  },
  tr: {
    file: 'README.tr.md',
    suffix: '.tr',
    switch: `<a href="README.md">${flag('gb')}&nbsp; English</a> &nbsp;&nbsp;|&nbsp;&nbsp; ${flag('tr')}&nbsp; <b>Türkçe</b>`,
    bannerAlt: 'Eren Kadiroğlu — Mobil &amp; Web Geliştirici. Dağılıp React, TypeScript ve kod logolarına dönüşen noktalı bir portre ve yanında sistem bilgisi paneli.',
    h: { about: 'Hakkımda', work: 'Öne çıkan projeler', experience: 'Deneyim', stack: 'Teknoloji yığını', activity: 'GitHub aktivitesi' },
    stackAlt: 'Diller: TypeScript, JavaScript, Python, C++, Java. Frontend: React, Next.js, Tailwind, Vite. Mobil: React Native, Expo, Android Studio. Backend: Node.js, NestJS, FastAPI, Socket.IO. Veri: PostgreSQL, Prisma, Redis, SQLite. Altyapı ve araçlar: Docker, GitHub Actions, Git, VS Code.',
    alts: {
      streak: 'Katkı serisi: toplam katkı, güncel seri ve en uzun seri.',
      stats: 'GitHub istatistikleri: yıldız, commit, pull request, issue ve depo sayısı.',
      langs: 'Depolarda en çok kullanılan diller.',
      trail: 'Son 12 ayın katkı grafiği ve hücrelerin arasında kıvrılan bir yılan.',
      year: (y) => `${y} yılının katkı grafiği.`,
    },
    years: 'Yıla göre göz at',
    yearLabel: (y, n) => `${y} · ${n.toLocaleString('tr-TR')} katkı`,
    note: "Kartlar ve takvimler, GitHub'ın profilde gösterdiği katkı grafiğinin aynısından, bu repodaki bir GitHub Action tarafından her gün üretilir; üçüncü parti istatistik servisi kullanılmaz.",
  },
};

const picture = (name, suffix, alt, width = '100%') =>
  `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark${suffix}.svg">\n` +
  `  <img src="assets/${name}-light${suffix}.svg" width="${width}" alt="${alt}">\n</picture>`;

const escAttr = (s) => s.replace(/\*\*/g, '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function manifest() {
  const file = root('assets/generated/manifest.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { years: [] };
}

export function render(lang) {
  const u = ui[lang];
  const c = copy[lang];
  const s = u.suffix;
  const aboutAlt = escAttr(`${c.about.paragraphs.join(' ')} ${c.about.principles.join('. ')}. ${c.about.open}.`);
  const expAlt = escAttr(c.experience.items.map((e) => `${e.period} — ${e.role}, ${e.org}: ${e.points.join('; ')}.`).join(' '));
  // Every row of images is one raw HTML block (no blank lines inside): outside
  // a block, GitHub's Markdown parser splits a linked <picture> apart.
  const linked = (href, pic) => `<a href="${href}">${pic}</a>`;
  const projectAlt = (p) => escAttr(`${p.name} — ${c.projects.status[p.status]}. ${p.desc}`);
  const card = (p, width) => {
    const pic = picture(`project-${p.slug}`, s, projectAlt(p), width);
    return p.link ? linked(p.link, pic) : pic;
  };
  const block = (items) => `<p align="center">\n${items.join('\n')}\n</p>`;
  const privateRow = block(c.projects.items.filter((p) => !p.link).map((p) => card(p, '32.5%')));
  const linkedRow = block(c.projects.items.filter((p) => p.link).map((p) => card(p, '49%')));
  const grid = [privateRow, linkedRow];
  const contact = c.contact
    .map((it) => linked(it.href, picture(`contact-${it.slug}`, s, escAttr(`${it.label}: ${it.sub}`), '24%')))
    .join('\n');
  const years = manifest().years.filter((y) => y.total > 0 || y.year === manifest().years[0]?.year);
  const yearBlocks = years
    .map(
      (y) =>
        `<details>\n<summary><b>${u.yearLabel(y.year, y.total)}</b></summary>\n<br>\n\n${picture(`generated/trail-${y.year}`, s, u.alts.year(y.year))}\n\n</details>`,
    )
    .join('\n');

  return `<!--
  Generated by tools/src/readme.mjs — edit tools/src/copy.mjs or readme.mjs, then run \`npm run readme\` in tools/.
  Visuals: tools/banner/build.py · tools/src/build-static.mjs · .github/workflows/stats.yml
-->

<p align="center">${u.switch}</p>

${picture('banner', s, u.bannerAlt)}

<br>

<p align="center">
${contact}
</p>

<br>

## ${u.h.about}

${picture('about', s, aboutAlt)}

## ${u.h.work}

${grid.join('\n\n')}

## ${u.h.experience}

${picture('experience', s, expAlt)}

## ${u.h.stack}

${picture('stack', s, u.stackAlt)}

## ${u.h.activity}

${block([picture('generated/streak', s, u.alts.streak), picture('generated/stats', s, u.alts.stats, '49%'), picture('generated/langs', s, u.alts.langs, '49%')])}

${picture('generated/trail', s, u.alts.trail)}
${yearBlocks ? `\n<p><sub><b>${u.years}</b></sub></p>\n\n${yearBlocks}\n` : ''}
<br>

<p><sub>${u.note}</sub></p>
`;
}

export const files = () => Object.fromEntries(Object.keys(ui).map((lang) => [ui[lang].file, render(lang)]));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [name, md] of Object.entries(files())) {
    writeFileSync(root(name), md);
    console.log(`wrote ${name}`);
  }
}
