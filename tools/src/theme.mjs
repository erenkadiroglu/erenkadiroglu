/**
 * Design tokens shared by every generated asset — palette "Graphite & Ivory".
 * Keep in sync with THEMES in tools/banner/build.py.
 */
export const themes = {
  dark: {
    name: 'dark',
    page: '#0d1117',
    surface: '#0b0d10',
    raised: '#101318',
    border: '#262b33',
    divider: '#1c2027',
    fg: '#e6e2d8',
    muted: '#a3a9b2',
    subtle: '#868d97',
    leader: '#3a4049',
    ink: '#e8dcc4',
    accent: '#c8a96a',
    accentText: '#c8a96a',
    accentSoft: 'rgba(200, 169, 106, 0.10)',
    live: '#d0574b',
    // first entry is the empty cell: a visible slate, never near-black
    heat: ['#23272e', '#4a3f2a', '#7a6438', '#ad8d52', '#e0c58e'],
  },
  light: {
    name: 'light',
    page: '#ffffff',
    surface: '#fbfaf7',
    raised: '#f3f1ec',
    border: '#dcd8cf',
    divider: '#e8e4dc',
    fg: '#1c1f24',
    muted: '#555c66',
    subtle: '#646a73',
    leader: '#c4beb3',
    ink: '#2a241b',
    accent: '#8a6a2c',
    accentText: '#7a5d25',
    accentSoft: 'rgba(138, 106, 44, 0.08)',
    live: '#b3372d',
    heat: ['#ebe8e1', '#e6d6b0', '#ccb077', '#9e7e40', '#6e5420'],
  },
};

export const fontStack = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** JetBrains Mono advance width is exactly 600/1000 em for every glyph. */
export const CHAR_WIDTH = 0.6;
