/** Minimal color utilities: WCAG contrast and brand-color legibility fixes. */

export function parseHex(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

function channel(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

/**
 * Nudges a brand color toward white (on dark backgrounds) or black (on light
 * ones) until it reaches the requested contrast ratio. Brand hue is preserved
 * as far as legibility allows.
 */
export function legible(hex, background, min = 3) {
  if (!hex) return null;
  const target = luminance(background) < 0.5 ? '#ffffff' : '#000000';
  let out = hex;
  for (let t = 0; t <= 1 && contrast(out, background) < min; t += 0.04) {
    out = mix(hex, target, t);
  }
  return out;
}
