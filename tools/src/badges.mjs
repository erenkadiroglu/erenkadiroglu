#!/usr/bin/env node
/**
 * Prints the shields.io badge row for the README. Logos are embedded as
 * base64 data URIs: shields only renders its LinkedIn logo on brand blue, and
 * a data URI keeps every glyph in the palette's gold.
 *
 *   node src/badges.mjs
 */
import { icons } from './icons.mjs';
import { themes } from './theme.mjs';

const GOLD = themes.dark.accent;
const LABEL_BG = themes.dark.surface.slice(1);
const MESSAGE_BG = themes.dark.divider.slice(1);

const globe =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round">` +
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></svg>';
const brand = (name) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${GOLD}">${icons[name].body}</svg>`;
const data = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const enc = (s) => encodeURIComponent(s.replace(/-/g, '--').replace(/_/g, '__'));

export const badges = [
  { label: 'LinkedIn', message: 'in/erenkadiroglu', href: 'https://www.linkedin.com/in/erenkadiroglu', logo: brand('linkedin') },
  { label: 'Portfolio', message: 'erenkadiroglu.com', href: 'https://erenkadiroglu.com', logo: globe },
  { label: 'Email', message: 'erenkdroglu@gmail.com', href: 'mailto:erenkdroglu@gmail.com', logo: brand('gmail') },
  { label: 'Instagram', message: 'eren_kdroglu', href: 'https://www.instagram.com/eren_kdroglu', logo: brand('instagram') },
];

export function badgeRow() {
  return badges
    .map(
      (b) =>
        `<a href="${b.href}"><img src="https://img.shields.io/badge/${enc(b.label)}-${enc(b.message)}-${MESSAGE_BG}?style=for-the-badge` +
        `&labelColor=${LABEL_BG}&logo=${encodeURIComponent(data(b.logo))}" alt="${b.label}: ${b.message}"></a>`,
    )
    .join('&nbsp;&nbsp;\n');
}

if (process.argv[1]?.endsWith('badges.mjs')) console.log(badgeRow());
