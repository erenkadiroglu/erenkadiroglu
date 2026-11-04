/**
 * Design tokens shared by every generated asset.
 * Both palettes are tuned against GitHub's own page backgrounds so the
 * cards sit on the profile page instead of floating on top of it.
 */
export const themes = {
  dark: {
    name: 'dark',
    page: '#0d1117',
    surface: '#0d1117',
    raised: '#161b22',
    border: '#30363d',
    divider: '#21262d',
    fg: '#e6edf3',
    muted: '#9ea7b3',
    subtle: '#7d8590',
    accent: '#5eead4',
    accentText: '#5eead4',
    accentSoft: 'rgba(94, 234, 212, 0.12)',
    chip: '#161b22',
    heat: ['#161b22', '#0f3d39', '#11665e', '#1f9e8f', '#5eead4'],
  },
  light: {
    name: 'light',
    page: '#ffffff',
    surface: '#ffffff',
    raised: '#f6f8fa',
    border: '#d0d7de',
    divider: '#e4e8ec',
    fg: '#1f2328',
    muted: '#59636e',
    subtle: '#646e79',
    accent: '#0d9488',
    accentText: '#0f766e',
    accentSoft: 'rgba(13, 148, 136, 0.10)',
    chip: '#f6f8fa',
    heat: ['#eff2f5', '#b4ebe2', '#5fcfbe', '#14a394', '#0f6b63'],
  },
};

export const fontStack = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** JetBrains Mono advance width is exactly 600/1000 em for every glyph. */
export const CHAR_WIDTH = 0.6;
