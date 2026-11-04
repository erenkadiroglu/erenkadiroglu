import { r } from './svg.mjs';

/** Small stroke icons drawn on a 24x24 grid for things without a brand mark. */
const paths = {
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  database:
    '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.66 3.58 3 8 3s8-1.34 8-3v-13"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
};

export function glyph(name, x, y, size, color, strokeWidth = 1.9) {
  const body = paths[name];
  if (!body) throw new Error(`Unknown glyph: ${name}`);
  const s = size / 24;
  return (
    `<g transform="translate(${r(x)} ${r(y)}) scale(${r(s * 1000) / 1000})" fill="none" stroke="${color}" ` +
    `stroke-width="${r(strokeWidth / s)}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`
  );
}
