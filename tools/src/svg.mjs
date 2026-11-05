import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHAR_WIDTH, fontStack } from './theme.mjs';
import { icons } from './icons.mjs';

const fontDir = fileURLToPath(new URL('../fonts/', import.meta.url));
const WEIGHTS = { Regular: 400, Bold: 700, ExtraBold: 800 };
const fontCache = new Map();

/** Subsetted JetBrains Mono, inlined so the SVG renders identically everywhere. */
function fontFace(weight) {
  if (!fontCache.has(weight)) {
    const data = readFileSync(`${fontDir}JetBrainsMono-${weight}.subset.woff2`).toString('base64');
    fontCache.set(
      weight,
      `@font-face{font-family:'JetBrains Mono';font-weight:${WEIGHTS[weight]};font-style:normal;` +
        `src:url(data:font/woff2;base64,${data}) format('woff2')}`,
    );
  }
  return fontCache.get(weight);
}

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Width of a monospace run in px. */
export const textWidth = (text, size) => [...String(text)].length * size * CHAR_WIDTH;

/** Rounds to 2 decimals so the output stays small and diff-friendly. */
export const r = (n) => Math.round(n * 100) / 100;

export function document({ width, height, title, desc, theme, css = '', body, weights = ['Regular', 'Bold'] }) {
  const style = [
    ...weights.map(fontFace),
    `text{font-family:${fontStack}}text:not([fill]){fill:${theme.fg}}`,
    'text.m{fill:' + theme.muted + '}',
    'text.s{fill:' + theme.subtle + '}',
    'text.a{fill:' + theme.accentText + '}',
    '.b{font-weight:700}',
    css,
  ].join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `role="img" aria-labelledby="title desc" fill="none">\n` +
    `<title id="title">${esc(title)}</title>\n<desc id="desc">${esc(desc)}</desc>\n` +
    `<style>${style}</style>\n${body}\n</svg>\n`
  );
}

export function text(x, y, value, { size = 13, cls = '', weight, anchor, extra = '' } = {}) {
  const attrs = [
    `x="${r(x)}"`,
    `y="${r(y)}"`,
    `font-size="${size}"`,
    cls && `class="${cls}"`,
    weight && `font-weight="${weight}"`,
    anchor && `text-anchor="${anchor}"`,
    extra,
  ].filter(Boolean);
  return `<text ${attrs.join(' ')}>${esc(value)}</text>`;
}

/** Monochrome brand icon scaled into a size x size box at (x, y). */
export function icon(name, x, y, size, color) {
  const ic = icons[name];
  if (!ic) throw new Error(`Unknown icon: ${name}`);
  const [, , w, h] = ic.viewBox.split(/\s+/).map(Number);
  const scale = size / Math.max(w, h);
  const fill = color;
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${r(scale * 1000) / 1000})" fill="${fill}">${ic.body}</g>`;
}

export function frame({ width, height, theme, fill = theme.surface, radius = 12 }) {
  return `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${fill}" stroke="${theme.border}"/>`;
}

/** Wraps text to a maximum number of monospace columns. */
export function wrap(value, columns) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= columns) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
