# tools

Generators for every visual in the profile [README](../README.md). The Node.js part has no dependencies (Node ≥ 20);
the banner pipeline is Python (see [`banner/`](banner)).

```
tools/
├── banner/              dithered-portrait terminal banner (Python: numpy, scipy, Pillow)
├── fonts/               JetBrains Mono subsets, inlined into each SVG
├── src/
│   ├── readme.mjs       ← README.md + README.tr.md copy: edit this
│   ├── content.mjs      tech-stack data
│   ├── i18n.mjs         English / Turkish labels for every generated card
│   ├── theme.mjs        "Graphite & Ivory" tokens for GitHub light / dark
│   ├── build-static.mjs tech-stack strip
│   ├── badges.mjs       prints the shields.io badge row (logos as base64)
│   ├── stats/           GraphQL client, pure aggregation, streak / stats / language / trail cards
│   └── icons.mjs        vendored brand marks (simple-icons CC0, devicon MIT)
└── test/                node:test suites + synthetic fixture
```

| Command | What it does |
| --- | --- |
| `npm run readme` | Regenerates `README.md` and `README.tr.md` from one template |
| `npm run build` | Regenerates `assets/stack-*.svg` |
| `npm run stats` | Fetches live data (needs `GITHUB_TOKEN`) and writes `assets/generated/` |
| `npm run preview` | Renders the stats cards from the synthetic fixture into `.preview/stats/` |
| `npm test` | SVG well-formedness, WCAG AA contrast, stale-asset and README reference checks |
| `node src/badges.mjs [en\|tr]` | Prints the badge HTML (also used by `readme.mjs`) |

## Notes

- **Private activity.** The workflows fall back to `GITHUB_TOKEN`, which only sees public data. Add a personal
  access token as the repository secret `STATS_TOKEN` to include private repositories and contributions.
- **Language share** sums `sqrt(bytes)` per repository, so one large codebase cannot drown out everything else.
  Notebook output is excluded in CI because it is stored as JSON and inflates byte counts.
- **Two languages.** Every visual is rendered twice; Turkish files carry a `.tr` suffix. The profile shows
  `README.md`; the flag switch links to `README.tr.md`.
- **Contribution trail.** A snake travels the gutters between calendar cells (down one gutter, a half-turn, up the
  next) and lights each contribution as its head passes; nothing is eaten. Timing comes from the path's arc length.
- **Streaks** span every contribution year; a quiet *today* does not break the current streak.
- **Monospace layout math.** JetBrains Mono advances exactly 0.6 em per glyph, so widths are computed, not measured.
- **Motion** is CSS/SMIL only, plays once (except the banner loop) and respects `prefers-reduced-motion`.
