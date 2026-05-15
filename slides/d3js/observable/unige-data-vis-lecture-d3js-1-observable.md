# Session 1 — SVG by hand: drawing a mass spectrum (Observable HQ cells)

Paste each block below into its own cell on **observablehq.com**, in order.
Blocks marked *(Markdown)* are Markdown cells; the rest are JavaScript cells.

There is **no D3 in this notebook** — that is deliberate. Everything here is the
plain SVG from Session 1. We use Observable's built-in `svg` template literal,
which needs no import.

The notebook has two parts:

- **Part 1 — worked example.** Basic shapes, then a full stick plot built from a
  real spectrum. This mirrors the live demo — read it, run it, change things.
- **Part 2 — exercise.** You are given three peaks. You build the spectrum
  yourself: write the two scale functions, map peaks to `<line>`s, draw the axis.

---

## Cell 1 — Title *(Markdown)*

```md
# SVG by hand: drawing a mass spectrum

Session 1 of the D3.js module · UniGE Data Visualisation.

A tandem mass spectrum is, at heart, **an array of `(m/z, intensity)` pairs**.
A stick plot draws it with two of the most accurate visual encodings there are:
**position** (m/z) and **length** (intensity).

In this notebook we draw one — with plain SVG, no D3. Next session, D3's scales
and axes will do the fiddly arithmetic for us.
```

---

## Cell 2 — Part 1 header *(Markdown)*

```md
## Part 1 — Worked example

Start with the four basic shapes, then build the full stick plot. Try editing
the numbers and watch the picture react — that reactivity is the whole point of
a notebook.
```

---

## Cell 3 — The four basic shapes *(JavaScript)*

```js
svg`<svg viewBox="0 0 270 200" width="270">
  <rect x="20" y="20" width="90" height="55" fill="#1F3A5F" />
  <circle cx="190" cy="48" r="32" fill="#CF0063" />
  <ellipse cx="65" cy="140" rx="45" ry="28" fill="#2C5AA0" />
  <line x1="135" y1="105" x2="240" y2="170" stroke="#E07A00" stroke-width="6" />
</svg>`
```

---

## Cell 4 — A reminder about the coordinate system *(Markdown)*

```md
**Remember:** the origin `(0, 0)` is the **top-left** corner. `x` grows to the
right; `y` grows **downward**. So a *bigger* intensity must map to a *smaller*
`y` pixel — we will "flip y" on purpose in `y()` below.
```

---

## Cell 5 — The data: a real spectrum *(JavaScript)*

```js
peaks = [
  { mz:  147.1128, intensity:  2500 },
  { mz:  185.1648, intensity:   600 },
  { mz:  213.1597, intensity:  1200 },
  { mz:  218.1499, intensity:   900 },
  { mz:  327.2027, intensity:   800 },
  { mz:  365.2183, intensity:  4000 },
  { mz:  456.2453, intensity:  2200 },
  { mz:  494.2609, intensity: 10000 },
  { mz:  569.3293, intensity:  1500 },
  { mz:  595.3086, intensity:  6500 },
  { mz:  652.3664, intensity:   500 },
  { mz:  670.3770, intensity:  3000 },
  { mz:  708.3927, intensity:  7800 },
  { mz:  799.4196, intensity:  1800 },
  { mz:  837.4352, intensity:  5200 },
  { mz:  946.4880, intensity:  1000 },
  { mz:  951.4782, intensity:  3300 },
  { mz: 1050.5466, intensity:  1400 }
]
```

---

## Cell 6 — Layout: the margin convention *(JavaScript)*

```js
layout = {
  const W = 640, H = 320;
  const m = { top: 30, right: 20, bottom: 50, left: 56 };
  return {
    W, H, m,
    plotW: W - m.left - m.right,   // width of the drawable area
    plotH: H - m.top - m.bottom    // height of the drawable area
  };
}
```

---

## Cell 7 — The domains (data units) *(JavaScript)*

```js
mzMin = 100
```

```js
mzMax = 1100
```

```js
iMax = Math.max(...peaks.map(p => p.intensity))
```

---

## Cell 8 — The two "scales", built by hand *(JavaScript)*

```js
// m/z  ->  horizontal pixel
x = mz => layout.m.left + (mz - mzMin) / (mzMax - mzMin) * layout.plotW
```

```js
// intensity  ->  vertical pixel  (note the flip: 0 sits at the bottom)
y = i => layout.m.top + layout.plotH - (i / iMax) * layout.plotH
```

---

## Cell 9 — A control, just to feel the reactivity *(JavaScript)*

```js
viewof peakWidth = Inputs.range([1, 8], { value: 2, step: 0.5, label: "Peak width (px)" })
```

---

## Cell 10 — The stick plot *(JavaScript)*

```js
chart = {
  const { W, H, m } = layout;

  // one <line> per peak — this is the "one datum, one mark" recipe
  const sticks = peaks.map(p =>
    svg`<line
      x1=${x(p.mz)} y1=${y(0)}
      x2=${x(p.mz)} y2=${y(p.intensity)}
      stroke=${p.intensity === iMax ? "#CF0063" : "#1F3A5F"}
      stroke-width=${peakWidth} />`
  );

  return svg`<svg viewBox="0 0 ${W} ${H}" width=${W}
                  style="max-width:100%;height:auto;background:#fafafa;border-radius:8px">
    <line x1=${m.left} y1=${y(0)} x2=${W - m.right} y2=${y(0)}
          stroke="#4A4A4A" stroke-width="1.5" />
    <line x1=${m.left} y1=${m.top} x2=${m.left} y2=${y(0)}
          stroke="#4A4A4A" stroke-width="1.5" />
    ${sticks}
    <text x=${(m.left + W - m.right) / 2} y=${H - 14}
          text-anchor="middle" font-size="14" fill="#4A4A4A">m/z &#8594;</text>
    <text x=${m.left} y=${m.top - 10}
          font-size="13" fill="#CF0063">base peak in pink</text>
  </svg>`;
}
```

---

## Cell 11 — Part 2 header *(Markdown)*

```md
## Part 2 — Your turn

You are given **three peaks** below. Build the stick plot yourself. The layout
(`myLayout`) is done for you — you only need to write the two scale functions
and the chart.

The grid you are drawing into:

- **m/z** runs from **100 to 1000**  →  horizontal pixels `myLayout.m.left` to `myLayout.W - myLayout.m.right`
- **intensity** runs from **0 to 100**  →  vertical pixels (remember the flip!)

Fill in the three cells marked `TODO`. When it works, you should see three
vertical lines — a short one on the left, the tallest in the middle, a medium
one on the right — sitting on a baseline.
```

---

## Cell 12 — The data you are given *(JavaScript)*

```js
myPeaks = [
  { mz: 200, intensity: 30 },
  { mz: 500, intensity: 100 },
  { mz: 850, intensity: 55 }
]
```

---

## Cell 13 — Layout (done for you) *(JavaScript)*

```js
myLayout = {
  const W = 520, H = 260;
  const m = { top: 24, right: 20, bottom: 40, left: 48 };
  return { W, H, m, plotW: W - m.left - m.right, plotH: H - m.top - m.bottom };
}
```

---

## Cell 14 — TODO: the x scale *(JavaScript)*

```js
// TODO: map an m/z value (100..1000) to a horizontal pixel.
// Range: myLayout.m.left  ..  myLayout.m.left + myLayout.plotW
// Hint: look at how `x` was written in Cell 8.
myX = mz => {
  return 0; // <-- replace this
}
```

---

## Cell 15 — TODO: the y scale *(JavaScript)*

```js
// TODO: map an intensity (0..100) to a vertical pixel.
// Remember the flip: intensity 0 -> the bottom, intensity 100 -> the top.
// Range bottom: myLayout.m.top + myLayout.plotH    Range top: myLayout.m.top
myY = i => {
  return 0; // <-- replace this
}
```

---

## Cell 16 — TODO: the chart *(JavaScript)*

```js
myChart = {
  const { W, H, m } = myLayout;

  // TODO 1: build one <line> per peak in myPeaks, using myX and myY.
  //         Each peak goes from y(0) up to y(peak.intensity).
  const sticks = myPeaks.map(p =>
    svg`<line x1=${0} y1=${0} x2=${0} y2=${0} stroke="#1F3A5F" stroke-width="3" />`
  );

  // TODO 2: the baseline runs along y = myY(0), from m.left to W - m.right.
  return svg`<svg viewBox="0 0 ${W} ${H}" width=${W}
                  style="background:#fafafa;border-radius:8px">
    ${sticks}
    <text x=${(m.left + W - m.right) / 2} y=${H - 12}
          text-anchor="middle" font-size="13" fill="#4A4A4A">m/z &#8594;</text>
  </svg>`;
}
```

---

## Cell 17 — Hints *(Markdown)*

```md
<details>
<summary>Stuck? Open for hints.</summary>

- **myX** has the same shape as the `x` function in Cell 8 — only the
  domain changes (here m/z runs 100 to 1000).
- **myY** has the same shape as the `y` function in Cell 8, with the
  intensity domain 0 to 100. Do not forget the y-flip.
- In **myChart**, each stick is a line at `x = myX(p.mz)`, running from
  `myY(0)` down to `myY(p.intensity)`. Build them with `myPeaks.map(...)`,
  exactly like Cell 10.
- Add the baseline as one more line at `y = myY(0)`, from the left margin
  across to `W - m.right`.

</details>
```

---

## Cell 18 — Solution *(Markdown — for the instructor, or after you have tried)*

````md
<details>
<summary>Full solution</summary>

```js
myX = mz => myLayout.m.left + (mz - 100) / (1000 - 100) * myLayout.plotW
```

```js
myY = i => myLayout.m.top + myLayout.plotH - (i / 100) * myLayout.plotH
```

```js
myChart = {
  const { W, H, m } = myLayout;
  const sticks = myPeaks.map(p =>
    svg`<line x1=${myX(p.mz)} y1=${myY(0)} x2=${myX(p.mz)} y2=${myY(p.intensity)}
             stroke="#1F3A5F" stroke-width="3" />`
  );
  return svg`<svg viewBox="0 0 ${W} ${H}" width=${W}
                  style="background:#fafafa;border-radius:8px">
    <line x1=${m.left} y1=${myY(0)} x2=${W - m.right} y2=${myY(0)}
          stroke="#4A4A4A" stroke-width="1.5" />
    ${sticks}
    <text x=${(m.left + W - m.right) / 2} y=${H - 12}
          text-anchor="middle" font-size="13" fill="#4A4A4A">m/z &#8594;</text>
  </svg>`;
}
```

</details>
````

---

## Notes for the lecture

- **Why no D3?** Session 1 is deliberately D3-free. Everything here is the SVG
  from the slides. The `svg` template literal is Observable's built-in (from
  `htl`) — it builds real SVG DOM nodes, and an *array* of them (`sticks`) can
  be dropped straight into another `svg` template. That array interpolation is
  the notebook-friendly version of the `.map()` on the slides.
- **The two scales are the lesson.** `x` and `y` in Cell 8 are hand-written
  linear scales. Point out that `y` flips the axis. In Session 2, `d3.scaleLinear()`
  replaces both — same idea, plus nice rounded domains and `.invert()`.
- **The y-flip is the predictable stumbling block.** In Part 2, the most common
  bug is `myY` without the flip (spectrum drawn upside-down, hanging from the
  top). That mistake is *useful* — let them hit it, then ask why.
- **Reactivity demo:** drag the *Peak width* slider (Cell 9) and note that only
  the picture updates, not the data. Good moment to contrast with a static
  script.
- **Domains differ between the parts on purpose:** Part 1 uses m/z 100–1100 and
  real intensities; Part 2 uses m/z 100–1000 and intensity 0–100 so the
  arithmetic is doable in your head while you debug.
- **Timing:** Part 1 can be walked through in ~3 min as the live demo's notebook
  twin. Part 2 is ~5 min started in class, finished as homework.
- **Bridge to Session 2:** keep this notebook open next week — the first thing
  D3 does is replace Cells 7–8 with two lines of `d3.scaleLinear()`.
