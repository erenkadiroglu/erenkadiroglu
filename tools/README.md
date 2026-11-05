# tools

Generators for every visual in the profile [README](../README.md). The Node.js part has no dependencies (Node ≥ 20);
the banner pipeline is Python (see [`banner/`](banner)).

```
tools/
├── banner/              dithered-portrait terminal banner (Python: numpy, scipy, Pillow)
├── fonts/               JetBrains Mono subsets, inlined into each SVG
├── src/
│   ├── content.mjs      ← tech-stack data: edit this
│   ├── theme.mjs        "Graphite & Ivory" tokens for GitHub light / dark
│   ├── build-static.mjs tech-stack strip
│   ├── badges.mjs       prints the shields.io badge row (logos as base64)
│   ├── stats/           GraphQL client, pure aggregation, streak / stats / language cards
│   └── icons.mjs        vendored brand marks (simple-icons CC0, devicon MIT)
└── test/                node:test suites + synthetic fixture
```

| Command | What it does |
| --- | --- |
| `npm run build` | Regenerates `assets/stack-*.svg` |
| `npm run stats` | Fetches live data (needs `GITHUB_TOKEN`) and writes `assets/generated/` |
| `npm run preview` | Renders the stats cards from the synthetic fixture into `.preview/stats/` |
| `npm test` | SVG well-formedness, WCAG AA contrast, stale-asset and README reference checks |
| `node src/badges.mjs` | Prints the badge HTML for the README |

## Notes

- **Private activity.** The workflows fall back to `GITHUB_TOKEN`, which only sees public data. Add a personal
  access token as the repository secret `STATS_TOKEN` to include private repositories and contributions.
- **Language share** sums `sqrt(bytes)` per repository, so one large codebase cannot drown out everything else.
  Notebook output is excluded in CI because it is stored as JSON and inflates byte counts.
- **Streaks** span every contribution year; a quiet *today* does not break the current streak.
- **Monospace layout math.** JetBrains Mono advances exactly 0.6 em per glyph, so widths are computed, not measured.
- **Motion** is CSS/SMIL only, plays once (except the banner loop) and respects `prefers-reduced-motion`.
