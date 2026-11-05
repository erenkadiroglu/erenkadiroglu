#!/usr/bin/env python3
"""
Animated terminal banner: dithered portrait that dissolves into a swarm of
"traveller" dots morphing between three logos, next to a SYSTEM.INFO panel.

    python build.py --photo <photo>      # full pipeline, refreshes data/*.npy
    python build.py                      # re-render SVGs from data/*.npy

Requires numpy, scipy and Pillow. The .npy grids in data/ are the source of
truth for the portrait, so the photo is only needed when re-cropping.
"""
from __future__ import annotations

import argparse
import base64
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from scipy import ndimage
from scipy.cluster.vq import kmeans2
from scipy.optimize import linear_sum_assignment

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
FONTS = HERE.parent / "fonts"
OUT = HERE.parent.parent / "assets"

GRID_W, GRID_H = 300, 340          # portrait lattice
CROP = (270, 0, 1670, 1587)        # head + shoulders, same 300:340 aspect
RNG = np.random.default_rng(20261105)

W, H = 1180, 610                   # banner size
SCALE = 1.3                        # px per lattice cell
PX, PY = 44, 102                   # portrait origin inside the banner

# Loop timeline (seconds). Uneven phases need explicit keyTimes.
INTRO = 3.2
HOLD_PORTRAIT, HOLD_LOGO, MORPH = 3.0, 2.0, 1.3
TIMES = np.cumsum([0, HOLD_PORTRAIT, MORPH, HOLD_LOGO, MORPH, HOLD_LOGO, MORPH, HOLD_LOGO, MORPH])
PERIOD = float(TIMES[-1])          # 14.2 s

N_TRAVELLERS = 900
N_BANDS = 94
N_INTRO_GROUPS = 60
DRIFT = 0.42
LOGO_BOX = 220                     # logo size in lattice cells


@dataclass(frozen=True)
class Theme:
    name: str
    page: str
    window: str
    bar: str
    frame: str
    border: str
    fg: str
    label: str
    leader: str
    chrome: str
    portrait: str
    accent: str
    accent_soft: str
    live: str


THEMES = [
    Theme("dark", "#0d1117", "#0b0d10", "#101318", "#0e1115", "#262b33", "#e6e2d8", "#8b929c",
          "#3a4049", "#c9ced6", "#e8dcc4", "#c8a96a", "rgba(200,169,106,0.10)", "#d0574b"),
    Theme("light", "#ffffff", "#fbfaf7", "#f3f1ec", "#f6f4ef", "#dcd8cf", "#1c1f24", "#5d646e",
          "#c4beb3", "#2b3038", "#2a241b", "#8a6a2c", "rgba(138,106,44,0.08)", "#b3372d"),
]

LOCALES = json.loads((HERE / "profile.json").read_text(encoding="utf-8"))


# --------------------------------------------------------------------------- portrait

def segment(rgb: np.ndarray) -> np.ndarray:
    """Subject mask. The wall is bright and nearly neutral (with a warm light
    leak on the left), so a pixel belongs to the subject when it is clearly
    darker than the wall or clearly more saturated (skin). Then: close, fill
    holes, keep the largest component."""
    px = rgb.astype(float)
    lum = px.mean(axis=2)
    chroma = px.max(axis=2) - px.min(axis=2)
    border = np.concatenate([lum[:12].ravel(), lum[:, -12:].ravel()])
    wall_lum = np.median(border)
    mask = (lum < wall_lum - 40) | (chroma > 45)
    mask = ndimage.binary_opening(mask, iterations=2)
    mask = ndimage.binary_closing(mask, iterations=6)
    mask = ndimage.binary_fill_holes(mask)
    labels, n = ndimage.label(mask)
    if n:
        sizes = ndimage.sum(mask, labels, range(1, n + 1))
        mask = labels == (1 + int(np.argmax(sizes)))
    return ndimage.binary_fill_holes(mask)


def enhance(img: Image.Image) -> np.ndarray:
    img = ImageOps.autocontrast(img, cutoff=1)
    img = ImageEnhance.Contrast(img).enhance(1.3)
    img = img.filter(ImageFilter.UnsharpMask(radius=3, percent=140, threshold=0))
    return np.asarray(img, dtype=float) / 255.0


def dither(values: np.ndarray) -> np.ndarray:
    """1-bit Floyd–Steinberg, serpentine scan. `values` in [0, 1]; 1 = dot."""
    v = values.astype(float).copy()
    h, w = v.shape
    out = np.zeros((h, w), dtype=bool)
    for y in range(h):
        xs = range(w) if y % 2 == 0 else range(w - 1, -1, -1)
        d = 1 if y % 2 == 0 else -1
        for x in xs:
            old = v[y, x]
            new = 1.0 if old >= 0.5 else 0.0
            out[y, x] = new > 0
            err = old - new
            if 0 <= x + d < w:
                v[y, x + d] += err * 7 / 16
            if y + 1 < h:
                if 0 <= x - d < w:
                    v[y + 1, x - d] += err * 3 / 16
                v[y + 1, x] += err * 5 / 16
                if 0 <= x + d < w:
                    v[y + 1, x + d] += err * 1 / 16
    return out


def build_portraits(photo: Path) -> None:
    src = Image.open(photo).convert("RGB").crop(CROP)
    rgb = np.asarray(src)
    mask_full = segment(rgb)
    mask = np.asarray(Image.fromarray(mask_full.astype(np.uint8) * 255).resize((GRID_W, GRID_H), Image.LANCZOS)) > 127
    gray = enhance(src.convert("L").resize((GRID_W, GRID_H), Image.LANCZOS))

    # Dark: dots draw the lit subject on the panel. A small floor keeps black
    # clothing readable as texture instead of vanishing into the background.
    lit = np.where(mask, 0.10 + 0.90 * gray, 0.0)
    dark = dither(lit) & mask                      # hard-clear bleed at the mask edge

    # Light: keep the background; dots draw the dark parts of the photo.
    # A gentle curve keeps the wall as a faint texture rather than noise.
    # Outside the subject the wall is damped to a faint texture; this also
    # removes the unsharp-mask halo that would otherwise outline the body.
    light = dither(np.where(mask, (1.0 - gray) ** 1.3, 0.35 * (1.0 - gray) ** 1.6))

    DATA.mkdir(exist_ok=True)
    np.save(DATA / "portrait-dark.npy", dark)
    np.save(DATA / "portrait-light.npy", light)
    np.save(DATA / "mask.npy", mask)
    print(f"portrait dots: dark={int(dark.sum())} light={int(light.sum())} mask={mask.mean():.2%}")


# --------------------------------------------------------------------------- logos

def logo_points(name: str, n: int) -> np.ndarray:
    """n blue-noise points covering the logo (k-means centroids of its pixels)."""
    m = np.asarray(Image.open(DATA / f"logo-{name}.png").convert("L"), dtype=float) / 255 > 0.5
    ys, xs = np.nonzero(m)
    pts = np.column_stack([xs, ys]).astype(float)
    # normalise to a LOGO_BOX square centred in the portrait lattice, keeping aspect
    lo, hi = pts.min(0), pts.max(0)
    span = (hi - lo).max()
    pts = (pts - (lo + hi) / 2) / span * LOGO_BOX + np.array([GRID_W / 2, GRID_H / 2])
    sample = pts[RNG.choice(len(pts), size=min(len(pts), 40000), replace=False)]
    cent, _ = kmeans2(sample, n, minit="++", iter=25, seed=7)
    return cent


def match(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Optimal transport (squared distance): returns b reordered to follow a."""
    cost = ((a[:, None, :] - b[None, :, :]) ** 2).sum(-1)
    _, cols = linear_sum_assignment(cost)
    return b[cols]


# --------------------------------------------------------------------------- svg helpers

def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def runs_path(cells: np.ndarray) -> str:
    """Horizontal runs as one path; drawn with a 1-cell stroke at y + 0.5."""
    parts = []
    for y in range(cells.shape[0]):
        row = cells[y]
        if not row.any():
            continue
        padded = np.concatenate([[0], row.astype(np.int8), [0]])
        diff = np.diff(padded)
        starts, ends = np.nonzero(diff == 1)[0], np.nonzero(diff == -1)[0]
        # first run absolute, the rest relative to the previous run's end
        prev = None
        for s, e in zip(starts, ends):
            parts.append(f"M{s} {y}h{e - s}" if prev is None else f"m{s - prev} 0h{e - s}")
            prev = e
    return "".join(parts)


def font_face() -> str:
    faces = []
    for weight, num in (("Regular", 400), ("Bold", 700)):
        data = base64.b64encode((FONTS / f"JetBrainsMono-{weight}.subset.woff2").read_bytes()).decode()
        faces.append(f"@font-face{{font-family:'JBM';font-weight:{num};src:url(data:font/woff2;base64,{data}) format('woff2')}}")
    return "".join(faces)


def kt(*seconds: float) -> str:
    return ";".join(f"{s / PERIOD:.4f}".rstrip("0").rstrip(".") if s else "0" for s in seconds)


# --------------------------------------------------------------------------- layers

def portrait_layers(cells: np.ndarray, theme: Theme, logo_centroid: np.ndarray) -> tuple[str, str, dict]:
    ys, xs = np.nonzero(cells)
    n = len(xs)

    # Intro: random interleaved groups — every group is scattered over the whole
    # portrait, so dots appear everywhere at once and thicken together.
    group = RNG.integers(0, N_INTRO_GROUPS, n)
    intro = []
    for g in range(N_INTRO_GROUPS):
        sel = np.zeros_like(cells)
        sel[ys[group == g], xs[group == g]] = True
        begin = 0.25 + 2.0 * g / N_INTRO_GROUPS + RNG.uniform(0, 0.08)
        intro.append(
            f'<path d="{runs_path(sel)}" opacity="0"><animate attributeName="opacity" values="0;1" '
            f'begin="{begin:.2f}s" dur="0.55s" fill="freeze"/></path>'
        )

    # Loop: drift bands. Grouping happens on noisy positions; without the noise
    # the quantised linear drift recreates a square grid (blocky dissolve).
    pts = np.column_stack([xs, ys]).astype(float)
    noisy = pts + RNG.normal(0, 4.0, pts.shape)
    _, labels = kmeans2(noisy, N_BANDS, minit="++", iter=20, seed=3)
    bands = []
    t0, t1, t2, t3 = TIMES[1], TIMES[2], TIMES[7], TIMES[8]
    for b in range(N_BANDS):
        idx = labels == b
        if not idx.any():
            continue
        sel = np.zeros_like(cells)
        sel[ys[idx], xs[idx]] = True
        c = pts[idx].mean(0)
        dx, dy = DRIFT * (logo_centroid - c)
        j0, j1 = RNG.uniform(-0.25, 0.25, 2)
        a, bb = t0 + j0, t1 + j0 * 0.5
        cc, d = t2 + j1, t3 - 0.15 + j1 * 0.4
        times = kt(0, a, bb, cc, d, PERIOD)
        bands.append(
            f'<g><path d="{runs_path(sel)}"/>'
            f'<animateTransform attributeName="transform" type="translate" dur="{PERIOD}s" begin="{INTRO}s" '
            f'repeatCount="indefinite" keyTimes="{times}" values="0 0;0 0;{dx:.1f} {dy:.1f};{dx:.1f} {dy:.1f};0 0;0 0" '
            f'calcMode="spline" keySplines=".5 0 .5 1;.55 0 .25 1;.5 0 .5 1;.55 0 .25 1;.5 0 .5 1"/>'
            f'<animate attributeName="opacity" dur="{PERIOD}s" begin="{INTRO}s" repeatCount="indefinite" '
            f'keyTimes="{times}" values="1;1;0;0;1;1" calcMode="spline" '
            f'keySplines=".5 0 .5 1;.4 0 .6 1;.5 0 .5 1;.4 0 .6 1;.5 0 .5 1"/></g>'
        )

    metrics = {
        "dots": n,
        "intro_evenness": intro_evenness(cells, ys, xs, group),
        "band_straightness": straightness(cells.shape, ys, xs, labels),
    }
    return "".join(intro), "".join(bands), metrics


def travellers(sources: np.ndarray, logos: list[np.ndarray], theme: Theme) -> str:
    l1 = match(sources, logos[0])
    l2 = match(l1, logos[1])
    l3 = match(l2, logos[2])
    T = TIMES
    out = []
    size = 2.1
    for i in range(N_TRAVELLERS):
        j = RNG.uniform(-0.12, 0.12, 4)
        keys = [0, T[1] + j[0], T[2] + j[0], T[3] + j[1], T[4] + j[1], T[5] + j[2], T[6] + j[2], T[7] + j[3], PERIOD]
        keys[1] = max(keys[1], 0.01)
        pos = [sources[i], sources[i], l1[i], l1[i], l2[i], l2[i], l3[i], l3[i], sources[i]]
        vals = ";".join(f"{p[0]:.1f} {p[1]:.1f}" for p in pos)
        out.append(
            f'<rect x="-{size / 2}" y="-{size / 2}" width="{size}" height="{size}">'
            f'<animateTransform attributeName="transform" type="translate" dur="{PERIOD}s" begin="{INTRO}s" '
            f'repeatCount="indefinite" calcMode="spline" keyTimes="{kt(*keys)}" values="{vals}" '
            f'keySplines="{";".join([".45 0 .25 1"] * 8)}"/></rect>'
        )
    return "".join(out)


def intro_evenness(cells, ys, xs, group) -> float:
    """CV of revealed fraction across 10x10 tiles when half the groups are in (≈0 = even)."""
    half = group < N_INTRO_GROUPS // 2
    ty, tx = (ys * 10 // cells.shape[0]), (xs * 10 // cells.shape[1])
    fr = []
    for a in range(10):
        for b in range(10):
            m = (ty == a) & (tx == b)
            if m.sum() > 40:
                fr.append(half[m].mean())
    fr = np.array(fr)
    return float(fr.std() / fr.mean())


def straightness(shape, ys, xs, labels) -> float:
    """Share of band-boundary cells lying on straight runs ≥ 8 cells (≈0 organic, high = grid)."""
    lab = -np.ones(shape, dtype=int)
    lab[ys, xs] = labels
    # nearest-label fill so the boundary is defined everywhere inside the portrait
    idx = ndimage.distance_transform_edt(lab < 0, return_distances=False, return_indices=True)
    full = lab[idx[0], idx[1]]
    hb = full[:, 1:] != full[:, :-1]
    vb = full[1:, :] != full[:-1, :]
    total = hb.sum() + vb.sum()

    def long_runs(b, axis):
        b = b if axis == 0 else b.T
        count = 0
        for col in b.T:
            padded = np.concatenate([[0], col.astype(np.int8), [0]])
            d = np.diff(padded)
            s, e = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
            count += sum(int(e_ - s_) for s_, e_ in zip(s, e) if e_ - s_ >= 8)
        return count

    return float((long_runs(hb, 0) + long_runs(vb, 1)) / max(total, 1))


# --------------------------------------------------------------------------- panel

def info_panel(theme: Theme, P: dict) -> str:
    x0, x1 = 492, 1146
    cw = 14 * 0.6
    out = []
    y = 94
    out.append(f'<text x="{x0}" y="{y}" font-size="13" fill="{theme.chrome}" letter-spacing="1.6" font-weight="700">{esc(P["ui"]["info"])}</text>')
    # LIVE badge
    live = P["ui"]["live"]
    bw = 38 + len(live) * 7.2 + len(live) * 1.2
    bx = x1 - bw
    out.append(
        f'<rect x="{bx:.1f}" y="{y - 14}" width="{bw:.1f}" height="20" rx="10" fill="none" stroke="{theme.live}" stroke-opacity=".55"/>'
        f'<circle cx="{bx + 14}" cy="{y - 4}" r="3.5" fill="{theme.live}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>'
        f'<circle cx="{bx + 14}" cy="{y - 4}" r="3.5" fill="none" stroke="{theme.live}"><animate attributeName="r" values="3.5;8" dur="1.6s" repeatCount="indefinite"/>'
        f'<animate attributeName="opacity" values=".7;0" dur="1.6s" repeatCount="indefinite"/></circle>'
        f'<text x="{bx + 25}" y="{y}" font-size="12" fill="{theme.live}" letter-spacing="1.2" font-weight="700">{esc(live)}</text>'
    )
    out.append(f'<path d="M{x0} {y + 14}H{x1}" stroke="{theme.border}"/>')
    y += 44
    i = 0
    for section in P["rows"]:
        for label, value, *flags in section:
            highlight = "accent" in flags
            chars_total = int((x1 - x0) / cw)
            dots = max(3, chars_total - len(label) - len(value) - 2)
            vx = x1 - len(value) * cw
            delay = 0.35 + i * 0.07
            out.append(
                f'<g opacity="0"><animate attributeName="opacity" values="0;1" begin="{delay:.2f}s" dur=".45s" fill="freeze"/>'
                f'<text x="{x0}" y="{y}" font-size="14" fill="{theme.label}">{esc(label)}</text>'
                f'<text x="{x0 + (len(label) + 1) * cw:.1f}" y="{y}" font-size="14" fill="{theme.leader}" '
                f'textLength="{dots * cw:.1f}" lengthAdjust="spacingAndGlyphs">{"." * dots}</text>'
                f'<text x="{vx:.1f}" y="{y}" font-size="14" fill="{theme.accent if highlight else theme.fg}" '
                f'textLength="{len(value) * cw:.1f}" lengthAdjust="spacingAndGlyphs">{esc(value)}</text></g>'
            )
            y += 23
            i += 1
        y += 13
    # handle pill
    handle = P["handle"]
    pw = len(handle) * cw + 32
    py = y + 2
    out.append(
        f'<g opacity="0"><animate attributeName="opacity" values="0;1" begin="{0.35 + i * 0.07:.2f}s" dur=".45s" fill="freeze"/>'
        f'<rect x="{x0}" y="{py}" width="{pw:.1f}" height="30" rx="15" fill="{theme.accent_soft}" stroke="{theme.accent}" stroke-opacity=".7"/>'
        f'<text x="{x0 + 16}" y="{py + 20}" font-size="14" fill="{theme.accent}" font-weight="700">{esc(handle)}</text>'
        f'<text x="{x1}" y="{py + 20}" font-size="11.5" fill="{theme.label}" text-anchor="end">{esc(P["ui"]["footnote"])}</text></g>'
    )
    return "".join(out)


# --------------------------------------------------------------------------- compose

def render(theme: Theme, logos: list[np.ndarray], P: dict) -> tuple[str, dict]:
    global RNG
    RNG = np.random.default_rng(20261105)  # identical portrait in every locale
    cells = np.load(DATA / f"portrait-{theme.name}.npy")
    centroid = logos[0].mean(0)
    intro, bands, metrics = portrait_layers(cells, theme, centroid)
    ys, xs = np.nonzero(cells)
    pick = RNG.choice(len(xs), N_TRAVELLERS, replace=False)
    sources = np.column_stack([xs[pick], ys[pick]]).astype(float) + 0.5

    fx, fy, fw, fh = 28, 64, 432, 522
    corner = 12
    ticks = "".join(
        f'<path d="M{x + sx * corner} {y}H{x}V{y + sy * corner}" stroke="{theme.chrome}" stroke-opacity=".55" fill="none"/>'
        for x, y, sx, sy in ((fx + 8, fy + 8, 1, 1), (fx + fw - 8, fy + 8, -1, 1), (fx + 8, fy + fh - 8, 1, -1), (fx + fw - 8, fy + fh - 8, -1, -1))
    )
    portrait_tf = f"translate({PX} {PY + 0.5 * SCALE}) scale({SCALE})"

    body = f"""
<rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="14" fill="{theme.window}" stroke="{theme.border}"/>
<path d="M14 .5H{W - 14}A13.5 13.5 0 0 1 {W - .5} 14V40H.5V14A13.5 13.5 0 0 1 14 .5Z" fill="{theme.bar}"/>
<path d="M.5 40.5H{W - .5}" stroke="{theme.border}"/>
{''.join(f'<circle cx="{24 + k * 18}" cy="20.5" r="5.5" fill="{theme.border}"/>' for k in range(3))}
<text x="{W / 2}" y="25" font-size="12.5" fill="{theme.label}" text-anchor="middle">{esc(P["ui"]["title"])}</text>
<rect x="{fx + .5}" y="{fy + .5}" width="{fw - 1}" height="{fh - 1}" rx="8" fill="{theme.frame}" stroke="{theme.border}"/>
{ticks}
<text x="{fx + 24}" y="{fy + 30}" font-size="11.5" fill="{theme.chrome}" letter-spacing="1.4" font-weight="700">{esc(P["ui"]["visual"])}</text>
<text x="{fx + fw - 24}" y="{fy + 30}" font-size="11" fill="{theme.label}" text-anchor="end">{GRID_W}×{GRID_H} · 1-bit</text>
<text x="{fx + 24}" y="{fy + fh - 20}" font-size="11" fill="{theme.label}">{esc(P["coords"])}</text>
<text x="{fx + fw - 24}" y="{fy + fh - 20}" font-size="11" fill="{theme.label}" text-anchor="end">{esc(P["ui"]["method"])}</text>
<g transform="{portrait_tf}" stroke="{theme.portrait}" stroke-width="1" shape-rendering="crispEdges" fill="none">
  <g><set attributeName="display" to="none" begin="{INTRO}s" fill="freeze"/>{intro}</g>
  <g display="none"><set attributeName="display" to="inline" begin="{INTRO}s" fill="freeze"/>{bands}</g>
</g>
<g transform="translate({PX} {PY}) scale({SCALE})" fill="{theme.accent}" opacity="0" shape-rendering="crispEdges">
  <animate attributeName="opacity" dur="{PERIOD}s" begin="{INTRO}s" repeatCount="indefinite"
    keyTimes="{kt(0, TIMES[1], TIMES[2], TIMES[7], PERIOD)}" values="0;0;1;1;0" calcMode="spline"
    keySplines=".5 0 .5 1;.4 0 .6 1;.5 0 .5 1;.4 0 .6 1"/>
  {travellers(sources, logos, theme)}
</g>
{info_panel(theme, P)}
"""
    desc = (
        P["ui"]["desc"] + " "
        + "; ".join(f"{label}: {value}" for section in P["rows"] for label, value, *_ in section)
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t d">'
        f'<title id="t">{esc(P["name"])} — {esc(P["role"])}</title><desc id="d">{esc(desc)}</desc>'
        f"<style>{font_face()}text{{font-family:'JBM',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}}</style>"
        f"{body}</svg>\n"
    )
    return svg, metrics


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--photo", type=Path)
    ap.add_argument("--out", type=Path, default=OUT)
    args = ap.parse_args()
    if args.photo:
        build_portraits(args.photo)
    logos = [logo_points(name, N_TRAVELLERS) for name in ("react", "typescript", "code")]
    args.out.mkdir(parents=True, exist_ok=True)
    for lang, P in LOCALES.items():
        suffix = "" if lang == "en" else f".{lang}"
        for theme in THEMES:
            svg, metrics = render(theme, logos, P)
            path = args.out / f"banner-{theme.name}{suffix}.svg"
            path.write_text(svg, encoding="utf-8")
            print(f"{path.name}: {len(svg.encode()) / 1024:.0f} KB · " + " · ".join(f"{k}={v:.3f}" if isinstance(v, float) else f"{k}={v}" for k, v in metrics.items()))


if __name__ == "__main__":
    main()
