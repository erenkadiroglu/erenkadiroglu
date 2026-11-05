# banner

Animated terminal banner (`assets/banner-{dark,light}.svg`): a 1-bit dithered portrait that dissolves into
900 "traveller" dots morphing React → TypeScript → `</>`, next to a `SYSTEM.INFO` panel.

```bash
python build.py --photo path/to/photo.jpg   # re-crop and re-dither, refreshes data/*.npy
python build.py                             # re-render the SVGs from data/*.npy
node render-logos.cjs                       # only when data/logos.json changes
```

Requires Python 3.10+ with `numpy`, `scipy` and `Pillow`; `render-logos.cjs` needs Playwright.
The photo itself is not stored in the repository — `data/portrait-*.npy` are the source of truth.

| Step | Detail |
| --- | --- |
| Crop | Head and shoulders, 300:340 aspect (`CROP`) |
| Tone | `autocontrast(cutoff=1)`, contrast ×1.3, `UnsharpMask(radius=3, percent=140)` |
| Dither | 1-bit Floyd–Steinberg on a 300×340 lattice, serpentine scan |
| Dark mode | Subject segmented from the wall (luminance/chroma test, closing, hole fill, largest component); error bleed hard-cleared at the mask edge |
| Light mode | Background kept as a faint texture, damped outside the subject to avoid an unsharp halo |
| Intro (3.2 s) | 60 randomly interleaved groups fade in, so the portrait thickens everywhere at once |
| Loop (14.2 s) | Portrait 3.0 s, each logo 2.0 s, 1.3 s morphs; explicit uneven `keyTimes` |
| Portrait layer | 94 drift bands clustered on noise-jittered positions (σ = 4) so the dissolve never forms a grid |
| Travellers | 900 points per logo from k-means over the logo mask, matched step to step by optimal transport |

`build.py` prints two checks on every run: `intro_evenness` (spread of the half-revealed portrait across tiles;
lower is more even) and `band_straightness` (share of band boundaries on long straight runs; low means organic).
Logos: React and TypeScript from simple-icons (CC0-1.0), `</>` from Lucide `code-xml` (ISC).
