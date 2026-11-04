# tools

Zero-dependency Node.js (≥ 20) generators for every visual in the profile [README](../README.md).

```
tools/
├── fonts/               JetBrains Mono subsets, inlined into each SVG
├── src/
│   ├── content.mjs      ← profile data: edit this
│   ├── theme.mjs        design tokens for GitHub light / dark
│   ├── build-static.mjs header, tech stack, project cards, link buttons
│   ├── stats/           GraphQL client, pure aggregation, activity card renderer
│   └── icons.mjs        vendored brand marks (simple-icons CC0, devicon MIT)
└── test/                node:test suites + synthetic fixture
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run build` | Regenerates `assets/*.svg` from `src/content.mjs` |
| `npm run activity` | Fetches live data (needs `GITHUB_TOKEN`) and writes `assets/generated/` |
| `npm run preview` | Renders the activity card from the synthetic fixture into `.preview/` |
| `npm test` | SVG well-formedness, WCAG AA contrast, stale-asset and README reference checks |

## Design notes

- **Monospace layout math.** JetBrains Mono advances exactly 0.6 em per glyph, so text width is computed rather
  than measured — chips, wrapping and alignment need no browser.
- **Brand colors stay legible.** Icon and language colors are nudged toward white/black until they reach a
  minimum contrast ratio against the card, preserving hue where possible.
- **Language share** sums `sqrt(bytes)` per repository, so one large codebase cannot drown out everything else.
  Notebook output is excluded in CI because it is stored as JSON and inflates byte counts.
- **Streaks** treat a quiet *today* as still open, so the current streak only breaks once a full day passes.
- **Motion** is CSS-only, plays once, and is disabled under `prefers-reduced-motion`.
- **Deterministic output.** No timestamps or randomness leak into static assets, so rebuilding produces no diff.
