#!/usr/bin/env node
/**
 * Writes README.md (English, shown on the profile) and README.tr.md (Turkish)
 * from one template, so both languages always share the same structure.
 *
 *   node src/readme.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { badgeRow } from './badges.mjs';

const REPO = 'https://github.com/erenkadiroglu/erenkadiroglu';
const PROFILE = 'https://github.com/erenkadiroglu';

const copy = {
  en: {
    file: 'README.md',
    suffix: '',
    switch: `<img src="assets/flags/gb.svg" height="13" alt=""> <b>English</b> &nbsp;|&nbsp; <a href="${REPO}/blob/main/README.tr.md"><img src="assets/flags/tr.svg" height="13" alt=""> Türkçe</a>`,
    bannerAlt: 'Eren Kadiroğlu — Mobile &amp; Web Developer. A dithered portrait that dissolves into the React, TypeScript and code logos, next to a system-info panel.',
    about: {
      h: 'About',
      body: [
        "Final-year Computer Engineering student at **Kahramanmaraş Sütçü İmam University**, based in Eskişehir. I build mobile and web products end to end: React Native apps, React and Next.js frontends, and the TypeScript and Python services behind them. I care about clear architecture, privacy, and software that keeps working when the network doesn't, and I use AI tooling as an everyday part of my engineering workflow.",
        'Currently open to internships, collaborations and new opportunities.',
      ],
    },
    work: {
      h: 'Featured work',
      cols: ['Project', 'What it is', 'Built with', 'Status'],
      private: '`private` · in development',
      rows: [
        ['**SahaRez**', 'Booking and matchmaking platform for sports facilities: a player web app, a facility management panel and an AI service for demand forecasting and price suggestions. Graduation project, piloting in Eskişehir.', 'NestJS · Next.js · React · FastAPI · PostgreSQL / PostGIS · Redis', 'private'],
        ['**FileConvert**', 'Free, privacy-first mobile app that converts, merges, edits and compresses PDFs entirely on the device — no server, no account, no tracking.', 'React Native · Expo · TypeScript · Kotlin native module', 'private'],
        ['**PathWords**', 'Path-tracing word puzzle that teaches English–Turkish vocabulary, with a procedural generator for endless levels.', 'React Native · Expo · TypeScript', 'private'],
        ['**[erenkadiroglu.com](https://erenkadiroglu.com)**', 'Personal portfolio with a JSON-driven content model and an admin panel; static and fast on GitHub Pages.', 'JavaScript · Node.js · Express', 'live'],
        ['**[Minesweeper](https://github.com/erenkadiroglu/minesweeper-c-project)**', "Console strategy game in C: steer a path across a minefield while tracking each mine's zone of influence.", 'C', 'public'],
      ],
    },
    experience: {
      h: 'Experience',
      cols: ['When', 'Role', 'Where'],
      rows: [
        ['Aug – Sep 2026', '**Software Engineering Intern** — web interfaces, REST API integration and PostgreSQL for the *Eskişehir Encyclopedia* digital library', 'Anadolu University BAUM · Eskişehir'],
        ['Feb – Apr 2026', '**International Project Management Intern** — led a brand launch end to end, from strategy document to website', 'TNC Group & Human Ports · Belgrade'],
        ['Jul – Aug 2025', '**IT Intern** — Python task manager and Excel sales dashboards; selected for the Belgrade programme', 'TNC Group · Remote'],
      ],
    },
    stack: {
      h: 'Tech stack',
      alt: 'Languages: TypeScript, JavaScript, Python, C++, Java. Frontend: React, Next.js, Tailwind, Vite. Mobile: React Native, Expo, Android Studio. Backend: Node.js, NestJS, FastAPI, Socket.IO. Data: PostgreSQL, Prisma, Redis, SQLite. Infra and tools: Docker, GitHub Actions, Git, VS Code.',
    },
    activity: {
      h: 'GitHub activity',
      alts: {
        streak: 'Contribution streak: total contributions, current streak and longest streak.',
        stats: 'GitHub stats: stars, commits, pull requests, issues and repositories.',
        langs: 'Most used languages across repositories.',
        trail: 'Contribution graph with a snake weaving between the cells.',
      },
      note: 'Cards are rendered daily by a GitHub Action in this repository, straight from the GraphQL API — no third-party stats services.',
    },
  },
  tr: {
    file: 'README.tr.md',
    suffix: '.tr',
    switch: `<a href="${PROFILE}"><img src="assets/flags/gb.svg" height="13" alt=""> English</a> &nbsp;|&nbsp; <img src="assets/flags/tr.svg" height="13" alt=""> <b>Türkçe</b>`,
    bannerAlt: 'Eren Kadiroğlu — Mobil &amp; Web Geliştirici. Dağılıp React, TypeScript ve kod logolarına dönüşen noktalı bir portre ve yanında sistem bilgisi paneli.',
    about: {
      h: 'Hakkımda',
      body: [
        "**Kahramanmaraş Sütçü İmam Üniversitesi** Bilgisayar Mühendisliği 4. sınıf öğrencisiyim ve Eskişehir'de yaşıyorum. Mobil ve web ürünlerini uçtan uca geliştiriyorum: React Native uygulamaları, React ve Next.js arayüzleri ve bunların arkasındaki TypeScript ve Python servisleri. Anlaşılır mimariye, gizliliğe ve ağ olmadığında da çalışmaya devam eden yazılıma önem veriyorum; yapay zekâ araçlarını mühendislik akışımın günlük bir parçası olarak kullanıyorum.",
        'Staj, iş birliği ve yeni fırsatlara açığım.',
      ],
    },
    work: {
      h: 'Öne çıkan projeler',
      cols: ['Proje', 'Nedir?', 'Teknolojiler', 'Durum'],
      private: '`özel` · geliştiriliyor',
      rows: [
        ['**SahaRez**', 'Spor tesisleri ile oyuncuları buluşturan rezervasyon ve eşleştirme platformu: oyuncu web sitesi, tesis yönetim paneli ve talep tahmini ile fiyat önerisi yapan bir yapay zekâ servisi. Bitirme projesi, pilot şehir Eskişehir.', 'NestJS · Next.js · React · FastAPI · PostgreSQL / PostGIS · Redis', 'private'],
        ['**FileConvert**', "PDF'leri cihazdan çıkarmadan dönüştüren, birleştiren, düzenleyen ve sıkıştıran ücretsiz mobil uygulama — sunucu, hesap ve takip yok.", 'React Native · Expo · TypeScript · Kotlin yerel modül', 'private'],
        ['**PathWords**', 'İngilizce–Türkçe kelime öğreten, patika çizerek oynanan kelime bulmacası; sonsuz seviye üreten prosedürel bir motorla.', 'React Native · Expo · TypeScript', 'private'],
        ['**[erenkadiroglu.com](https://erenkadiroglu.com)**', "İçeriği JSON'dan yönetilen, yönetim panelli kişisel portföy; GitHub Pages'te statik ve hızlı.", 'JavaScript · Node.js · Express', 'yayında'],
        ['**[Mayın Tarlası](https://github.com/erenkadiroglu/minesweeper-c-project)**', 'C ile yazılmış konsol tabanlı strateji oyunu: mayınların etki alanlarını takip ederek tarlada yol bulma.', 'C', 'açık kaynak'],
      ],
    },
    experience: {
      h: 'Deneyim',
      cols: ['Dönem', 'Görev', 'Kurum'],
      rows: [
        ['Ağu – Eyl 2026', '**Yazılım Mühendisliği Stajyeri** — *Eskişehir Ansiklopedisi* dijital kütüphanesinde web arayüzleri, REST API entegrasyonu ve PostgreSQL', 'Anadolu Üniversitesi BAUM · Eskişehir'],
        ['Şub – Nis 2026', '**Uluslararası Proje Yönetimi Stajyeri** — bir marka lansmanını strateji belgesinden web sitesine kadar uçtan uca yönettim', 'TNC Group & Human Ports · Belgrad'],
        ['Tem – Ağu 2025', '**Bilgi Teknolojileri Stajyeri** — Python görev yönetimi uygulaması ve Excel satış panoları; Belgrad programına seçildim', 'TNC Group · Uzaktan'],
      ],
    },
    stack: {
      h: 'Teknoloji yığını',
      alt: 'Diller: TypeScript, JavaScript, Python, C++, Java. Frontend: React, Next.js, Tailwind, Vite. Mobil: React Native, Expo, Android Studio. Backend: Node.js, NestJS, FastAPI, Socket.IO. Veri: PostgreSQL, Prisma, Redis, SQLite. Altyapı ve araçlar: Docker, GitHub Actions, Git, VS Code.',
    },
    activity: {
      h: 'GitHub aktivitesi',
      alts: {
        streak: 'Katkı serisi: toplam katkı, güncel seri ve en uzun seri.',
        stats: 'GitHub istatistikleri: yıldız, commit, pull request, issue ve depo sayısı.',
        langs: 'Depolarda en çok kullanılan diller.',
        trail: 'Hücrelerin arasında kıvrılan bir yılanla katkı grafiği.',
      },
      note: "Kartlar bu repodaki bir GitHub Action tarafından her gün doğrudan GraphQL API'sinden üretilir; üçüncü parti istatistik servisi kullanılmaz.",
    },
  },
};

const picture = (name, suffix, alt, width = '100%') =>
  `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark${suffix}.svg">\n` +
  `  <img src="assets/${name}-light${suffix}.svg" width="${width}" alt="${alt}">\n</picture>`;

const table = (cols, rows) =>
  [`| ${cols.join(' | ')} |`, `| ${cols.map(() => ':--').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

export function render(lang) {
  const c = copy[lang];
  const s = c.suffix;
  const workRows = c.work.rows.map(([a, b, d, status]) => [a, b, d, status === 'private' ? c.work.private : status]);
  return `<!--
  Generated by tools/src/readme.mjs — edit there, then run \`npm run readme\` in tools/.
  Visuals: tools/banner/build.py · tools/src/build-static.mjs · .github/workflows/stats.yml
-->

<p align="center">${c.switch}</p>

${picture('banner', s, c.bannerAlt)}

<div align="center">

${badgeRow(lang)}

</div>

## ${c.about.h}

${c.about.body.join('\n\n')}

## ${c.work.h}

${table(c.work.cols, workRows)}

## ${c.experience.h}

${table(c.experience.cols, c.experience.rows)}

## ${c.stack.h}

${picture('stack', s, c.stack.alt)}

## ${c.activity.h}

${picture('generated/streak', s, c.activity.alts.streak)}
${picture('generated/stats', s, c.activity.alts.stats, '49%')}
${picture('generated/langs', s, c.activity.alts.langs, '49%')}

${picture('generated/trail', s, c.activity.alts.trail)}

<sub>${c.activity.note}</sub>
`;
}

export const files = Object.fromEntries(Object.keys(copy).map((lang) => [copy[lang].file, render(lang)]));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [name, md] of Object.entries(files)) {
    writeFileSync(fileURLToPath(new URL(`../../${name}`, import.meta.url)), md);
    console.log(`wrote ${name}`);
  }
}
