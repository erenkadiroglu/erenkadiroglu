import { r } from './svg.mjs';

/** Small stroke icons drawn on a 24x24 grid for things without a brand mark. */
const paths = {
  star: '<path d="M12 3.2l2.7 5.5 6 .9-4.35 4.25 1.03 6L12 17l-5.38 2.85 1.03-6L3.3 9.6l6-.9z"/>',
  commit: '<circle cx="12" cy="12" r="3.6"/><path d="M2.5 12h5.9M15.6 12h5.9"/>',
  pull: '<circle cx="6" cy="5.5" r="2.4"/><circle cx="6" cy="18.5" r="2.4"/><circle cx="18" cy="18.5" r="2.4"/><path d="M6 7.9v8.2M18 16.1V9.5a3 3 0 0 0-3-3h-3.5"/><path d="m13.6 4-2.5 2.5 2.5 2.5"/>',
  issue: '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="1.4"/>',
  repo: '<path d="M5 4.6A1.6 1.6 0 0 1 6.6 3H19v14.6H6.6A1.6 1.6 0 0 0 5 19.2z"/><path d="M5 19.2A1.6 1.6 0 0 0 6.6 21H19v-3.4"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
  diamond: '<path d="M12 4.5 19.5 12 12 19.5 4.5 12z"/>',
  flame: '<path d="M12 2.8c.6 3.2 4.6 5 4.6 10.1a4.6 4.6 0 0 1-9.2 0c0-2 .9-3.3 1.8-4.4.3 1.7 1.2 2.6 2 2.8-.3-3 .2-5.8.8-8.5z"/>',
};

export function glyph(name, x, y, size, color, strokeWidth = 1.8) {
  const body = paths[name];
  if (!body) throw new Error(`Unknown glyph: ${name}`);
  const s = size / 24;
  return (
    `<g transform="translate(${r(x)} ${r(y)}) scale(${r(s * 1000) / 1000})" fill="none" stroke="${color}" ` +
    `stroke-width="${r(strokeWidth / s)}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`
  );
}
