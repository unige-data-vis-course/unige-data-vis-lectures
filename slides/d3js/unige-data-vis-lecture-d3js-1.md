---
marp: true
theme: unige
paginate: true
size: 16:9
header: 'Data Visualisation · D3.js'
footer: 'UniGE · D3.js · SVG (1/3)'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# SVG — the substrate of D3

## D3.js Module · Session 1 of 3

Data Visualisation · Theory & Practice
University of Geneva · *Alexandre Masselot*

<!--
Welcome to the first of three sessions on D3.js. A warning up front: today we
will not write a single line of D3. Today is entirely about SVG — the thing D3
draws on. By the end you will have hand-drawn a real mass spectrum, peak by
peak, and you will understand exactly what D3 is going to automate for you next
week. ~45 minutes, one live demo in the middle, hands-on notebook at the end.
-->

---

# Where this module sits

- This module is **3 × 45 min**: lecture + live demo, building **one TypeScript application** across all three sessions.
- The running dataset: **tandem mass spectra** of peptides.

<div class="note">

**Today, Session 1 — SVG only. No D3 yet.** You cannot do D3 without SVG, so we start at the foundation.

</div>

<!--
Connect back explicitly to the graphs module: they have already seen force
layouts conceptually. D3 was the "we'll get there" tool. Now we're here.
Emphasise the through-line: one app, one dataset, grown over three weeks —
this is the software-craftsmanship angle of the course, not three throwaway
demos. But today is deliberately narrow: just SVG.
-->

---

# Today's path

1. **Why SVG?** — three ways to draw in a browser, and why one of them is built for data
2. **SVG fundamentals** — the canvas, the coordinate system, shapes, groups, styling
3. **From shapes to data** — one data point, one element
4. **Our data** — what a tandem mass spectrum is, and the `.mgf` file format
5. **Live demo** — from an `.mgf` file to a stick plot, drawn by hand
6. **Hands-on** — your Observable notebook

<!--
Set expectations. Five stops plus a hands-on. The demo is the centre of
gravity — everything before it is preparation, everything after it is
reflection and practice.
-->

---

<!-- _class: lead -->

# 1 · Why SVG?

Three ways to draw in a browser — and why data visualisation picks one of them.

---

# Three ways to draw in a browser

<div class="columns">
<div>

**HTML + CSS**
Boxes, text, flow layout. Great for documents and UI. Awkward for arbitrary geometry.

**Canvas** `<canvas>`
A bitmap you paint pixels onto with JavaScript. Fast for *thousands* of marks.

**SVG** `<svg>`
Scalable Vector Graphics. Shapes are **elements in the DOM** — like HTML, but for graphics.

</div>
<div>

<svg viewBox="0 0 300 230" width="300">
  <rect x="10" y="10" width="280" height="64" fill="#F4F5F7" stroke="#D8DBE0"/>
  <text x="20" y="38" font-size="15" fill="#1F3A5F" font-weight="700">HTML/CSS</text>
  <text x="20" y="60" font-size="13" fill="#4A4A4A">boxes &amp; text, flow layout</text>
  <rect x="10" y="84" width="280" height="64" fill="#F4F5F7" stroke="#D8DBE0"/>
  <text x="20" y="112" font-size="15" fill="#1F3A5F" font-weight="700">Canvas</text>
  <text x="20" y="134" font-size="13" fill="#4A4A4A">one bitmap, paint pixels, no memory</text>
  <rect x="10" y="158" width="280" height="64" fill="#FCEEDD" stroke="#E07A00" stroke-width="2"/>
  <text x="20" y="186" font-size="15" fill="#CF0063" font-weight="700">SVG  ← our choice</text>
  <text x="20" y="208" font-size="13" fill="#4A4A4A">every shape is a DOM element</text>
</svg>

</div>
</div>

<!--
Don't dwell on HTML/CSS. The real contrast is Canvas vs SVG, next slide. Plant
the key phrase here: in SVG, every shape is a DOM element. That single fact is
why D3 exists.
-->

---

# Canvas vs SVG: whiteboard vs pegboard

<div class="columns">
<div class="panel panel-intuition">

#### Intuition

**Canvas is a whiteboard.** You draw a circle; the board now holds *pixels*. It has forgotten there was ever a circle. To "move" it, you erase and redraw everything.

**SVG is a pegboard.** Each shape is a peg you hang. It stays an *object* — you can grab it, move it, recolour it, ask where it is.

</div>
<div class="panel panel-formal">

#### Formal

Canvas is an **immediate-mode** API: `ctx.arc(...)` executes and returns nothing to hold onto.

SVG is **retained-mode**: `<circle>` persists as a node in the document tree. It can be selected, styled with CSS, bound to data, and updated in place.

</div>
</div>

<div class="takeaway">

**Retained mode is the whole point.** It is what makes a shape *addressable* — and addressable shapes are what you bind data to.

</div>

<!--
This is the analogy-then-formal slide — spend a real minute here. The whiteboard
vs pegboard image should stick. Ask the room: if you have 10,000 points and
need to recolour one on hover, which model do you want? (Pegboard.) If you have
2 million points scrolling at 60fps? (Whiteboard/Canvas — but that's not today.)
For data viz at our scale, SVG wins because of addressability.
-->

---

# Why "every mark is an object" matters

For a chart, addressability buys you three things:

- **Select it later** — `document.querySelector`, or D3's selections next week.
- **Style it with CSS** — `fill`, `stroke`, hover states, transitions; no redraw code.
- **Bind it to data** — the element can *carry* its datum. One peak ↔ one `<line>`.

<div class="note">

D3 = **D**ata-**D**riven **D**ocuments. It is, almost literally, a library for keeping an array of data in sync with an array of SVG elements. SVG is the half we learn today.

</div>

<div class="ref">Bostock, Ogievetsky &amp; Heer (2011), "D³ Data-Driven Documents", IEEE TVCG.</div>

<!--
Land the definition of D3 here so next week has a running start. We are
learning the "Documents" half today. The "Data-Driven" half — the join — is
Session 2. Note the third bullet ("one peak, one line") — it's the seed we
plant now and harvest in the "From shapes to data" section.
-->

---

<!-- _class: lead -->

# 2 · SVG fundamentals

The canvas, the coordinate system, the shapes you will actually use.

---

# The `<svg>` canvas — and a coordinate system that bites

<div class="columns wide-right">
<div>

```svg
<svg width="400" height="260">
  <!-- shapes go here -->
</svg>
```

- The origin **(0, 0)** is the **top-left** corner.
- **x** grows to the **right** — as expected.
- **y** grows **downward** — *not* as expected.

Every plot you build will **flip y**: screen-down vs data-up.

</div>
<div>

<svg viewBox="0 0 420 260" width="420">
  <rect x="40" y="24" width="340" height="200" fill="#F4F5F7" stroke="#D8DBE0"/>
  <line x1="40" y1="24" x2="350" y2="24" stroke="#1F3A5F" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="40" y1="24" x2="40" y2="205" stroke="#1F3A5F" stroke-width="2" marker-end="url(#arrow)"/>
  <circle cx="40" cy="24" r="4" fill="#CF0063"/>
  <text x="48" y="18" font-size="13" fill="#CF0063">(0, 0)</text>
  <text x="300" y="18" font-size="13" fill="#1F3A5F">x →</text>
  <text x="6" y="130" font-size="13" fill="#1F3A5F">y ↓</text>
  <circle cx="250" cy="150" r="5" fill="#E07A00"/>
  <text x="258" y="155" font-size="13" fill="#4A4A4A">(210, 126)</text>
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#1F3A5F"/>
    </marker>
  </defs>
</svg>

</div>
</div>

<!--
The y-down coordinate system is THE thing students trip on for the rest of the
module. Say it out loud, point at the diagram: a bigger y means lower on the
screen. So when intensity goes UP, the y pixel goes DOWN. We will flip y by hand
in today's demo, and d3.scaleLinear will flip it for us next week. Foreshadow
that now.
-->

---

# `width`/`height` vs `viewBox`

<div class="columns">
<div>

**`width` / `height`**
How big the SVG is **on the page**, in CSS pixels.

**`viewBox="minX minY w h"`**
The **internal coordinate system** the shapes are drawn in.

Separating the two means your drawing is **resolution-independent** — the "scalable" in SVG.

</div>
<div>

```svg
<svg width="600" height="300"
     viewBox="0 0 200 100">
  <!-- I draw in a 200×100 world... -->
  <circle cx="100" cy="50" r="40"/>
  <!-- ...it displays at 600×300. -->
</svg>
```

<div class="note small">

Rule of thumb: pick a `viewBox` that matches your data's natural units, set `width`/`height` for the page, and let the browser scale.

</div>

</div>
</div>

<!--
Quick slide. The mental model: viewBox is the world you draw in; width/height
is the window onto it. This is why an SVG looks crisp at any zoom. We will use
viewBox in the demo so our coordinates can be "nice".
-->

---

# Basic shapes

<div class="columns">
<div>

```svg
<rect x="20" y="20"
      width="90" height="55"/>

<circle cx="190" cy="48" r="32"/>

<ellipse cx="65" cy="140"
         rx="45" ry="28"/>

<line x1="135" y1="105"
      x2="240" y2="170"/>
```

Each shape is **positioned by attributes**. No layout engine — you say exactly where it goes.

</div>
<div>

<svg viewBox="0 0 270 200" width="270">
  <rect x="20" y="20" width="90" height="55" fill="#1F3A5F"/>
  <circle cx="190" cy="48" r="32" fill="#CF0063"/>
  <ellipse cx="65" cy="140" rx="45" ry="28" fill="#2C5AA0"/>
  <line x1="135" y1="105" x2="240" y2="170" stroke="#E07A00" stroke-width="6"/>
</svg>

</div>
</div>

<!--
Keep this brisk — it's a reference slide. The one idea to state: there is no
layout engine. Unlike HTML, nothing flows. You give coordinates, the shape
appears there. That is a burden and a gift: total control.
-->

---

# `<line>` — the building block of a spectrum

<div class="columns wide-right">
<div>

A `<line>` needs four numbers:
`x1, y1` → `x2, y2`.

A **mass spectrum** is nothing more than a row of vertical lines:

- **x** position → **m/z**
- **height** → **intensity**

Hold that thought — it is literally today's demo.

</div>
<div>

<svg viewBox="0 0 300 180" width="300">
  <line x1="20" y1="155" x2="285" y2="155" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="60"  y1="155" x2="60"  y2="70"  stroke="#1F3A5F" stroke-width="3"/>
  <line x1="110" y1="155" x2="110" y2="105" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="160" y1="155" x2="160" y2="35"  stroke="#1F3A5F" stroke-width="3"/>
  <line x1="210" y1="155" x2="210" y2="90"  stroke="#1F3A5F" stroke-width="3"/>
  <line x1="255" y1="155" x2="255" y2="120" stroke="#1F3A5F" stroke-width="3"/>
  <text x="150" y="175" font-size="13" fill="#4A4A4A" text-anchor="middle">m/z →</text>
</svg>

</div>
</div>

<!--
This is the hinge of the lecture. A spectrum = a row of vertical lines. x is
m/z, height is intensity. Everything from here builds toward drawing exactly
this from a real file. Make sure nobody is lost on this slide.
-->

---

# `<text>` — labels need anchoring

<div class="columns">
<div>

```svg
<text x="100" y="40"
      text-anchor="middle">
  m/z 494.3
</text>
```

- `x, y` is the text's **baseline** anchor point, not its top-left.
- `text-anchor`: `start` · `middle` · `end` — which part of the text sits at `x`.

Axis labels, peak labels, titles — all `<text>`.

</div>
<div>

<svg viewBox="0 0 280 180" width="280">
  <line x1="140" y1="10" x2="140" y2="170" stroke="#D8DBE0" stroke-width="1"/>
  <line x1="20" y1="45" x2="260" y2="45" stroke="#D8DBE0" stroke-width="1"/>
  <text x="140" y="45" font-size="15" fill="#1F3A5F" text-anchor="start">start</text>
  <line x1="20" y1="95" x2="260" y2="95" stroke="#D8DBE0" stroke-width="1"/>
  <text x="140" y="95" font-size="15" fill="#1F3A5F" text-anchor="middle">middle</text>
  <line x1="20" y1="145" x2="260" y2="145" stroke="#D8DBE0" stroke-width="1"/>
  <text x="140" y="145" font-size="15" fill="#1F3A5F" text-anchor="end">end</text>
  <circle cx="140" cy="45" r="3" fill="#CF0063"/>
  <circle cx="140" cy="95" r="3" fill="#CF0063"/>
  <circle cx="140" cy="145" r="3" fill="#CF0063"/>
</svg>

</div>
</div>

<!--
The gotcha: (x,y) is the baseline anchor, not the top-left like a rect. The pink
dots show the anchor point; text-anchor decides whether the string starts,
centres, or ends there. Students will get this wrong on axis labels — show them
now so they recognise it later.
-->

---

# `<path>` — the universal shape

<div class="columns">
<div>

`<path>` draws anything: lines, curves, areas. It has one attribute, `d`, written in a mini-language:

- `M x y` — **move** to a point
- `L x y` — **line** to a point
- `C ...` — Bézier **curve**
- `Z` — **close** the shape

</div>
<div>

```svg
<path d="M 20 120
         L 80 40
         L 140 90
         L 200 30
         L 260 70" />
```

<svg viewBox="0 0 280 150" width="280">
  <path d="M 20 120 L 80 40 L 140 90 L 200 30 L 260 70"
        fill="none" stroke="#CF0063" stroke-width="3"/>
</svg>

</div>
</div>

<div class="note small">

You will rarely hand-write `d`. D3's **shape generators** (`d3.line`, `d3.area`) build these strings for you — Session 2.

</div>

<!--
Don't go deep on path syntax — they only need to recognise it. The honest
message: you almost never write the d-string by hand; D3 generates it. But
when a chart breaks, you'll be glad you can read it. Move on quickly.
-->

---

# `<g>` and `transform` — grouping and moving

<div class="columns">
<div>

`<g>` groups elements. A `transform` on the group moves **everything inside** together:

- `translate(x, y)` — shift
- `scale(s)` — resize
- `rotate(deg)` — turn

The **margin convention** — translating a `<g>` inward to leave room for axes — is the first thing you do in every D3 chart.

</div>
<div>

```svg
<g transform="translate(40, 30)">
  <circle cx="0" cy="0" r="20"/>
  <circle cx="50" cy="0" r="20"/>
  <circle cx="25" cy="40" r="20"/>
</g>
```

<svg viewBox="0 0 200 140" width="200">
  <rect x="0" y="0" width="200" height="140" fill="#F4F5F7" stroke="#D8DBE0"/>
  <g transform="translate(60, 45)">
    <circle cx="0" cy="0" r="20" fill="#2C5AA0"/>
    <circle cx="50" cy="0" r="20" fill="#2C5AA0"/>
    <circle cx="25" cy="40" r="20" fill="#2C5AA0"/>
  </g>
</svg>

</div>
</div>

<!--
Two ideas: (1) a group lets you move many things as one; (2) name-drop the
margin convention because it's the very first line of real chart code and we'll
use it in the demo — translate a <g> in by the left/top margins so axes have
room. Don't over-explain; we'll do it live.
-->

---

# Styling: presentation attributes vs CSS

<div class="columns">
<div>

**As attributes** — on the element:
```svg
<line x1="10" y1="90" x2="10" y2="20"
      stroke="#1F3A5F" stroke-width="3"/>
```

**As CSS** — by selector:
```css
.peak { stroke: #1F3A5F;
        stroke-width: 3; }
.peak:hover { stroke: #CF0063; }
```

</div>
<div>

Key properties for us:

- `fill` — interior colour
- `stroke`, `stroke-width` — outline
- `opacity` — transparency
- `fill: none` — common for lines &amp; axes

<div class="note small">

CSS wins for **states** (`:hover`) and consistency. Attributes win for **per-datum** values. D3 lets you set either — you'll mix both.

</div>

</div>
</div>

<!--
The practical rule: things that are the same for every mark -> CSS class.
Things that differ per datum (a peak's exact height) -> attribute, usually set
by D3. Mention fill="none" specifically because students forget it and get
black-filled paths. Quick slide.
-->

---

<!-- _class: lead -->

# 3 · From shapes to data

The one idea that turns "drawing" into "data visualisation".

---

# One data point → one element

<div class="columns">
<div class="panel panel-intuition">

#### Intuition

You have an **array of data**. You want an **array of shapes**. Visualisation is just a faithful translation between the two:

> every datum gets exactly one mark, and the datum decides what the mark looks like.

</div>
<div class="panel panel-formal">

#### Formal

```js
const data = [12, 27, 9, 31, 18];

// one number  ->  one <line>
data.map((value, i) =>
  `<line x1=${i*40} y1=100
         x2=${i*40} y2=${100 - value} />`
);
```

The array's **length** sets how many elements; each **value** sets an attribute.

</div>
</div>

<!--
This is the conceptual climax of the lecture. Say it plainly: a chart is a
faithful map from an array of data to an array of marks. Today we do that map
by hand with .map() and a template string. It works — and it exposes exactly
what the join will formalise. The students should feel "oh, that's all a chart
is" right now.
-->

---

# This is the seed of two big ideas

<div class="columns">
<div>

**The D3 data-join** *(Session 2)*
Today we `.map()` data to strings by hand. D3's `selection.data().join()` does the same translation — but also handles data that **changes**: points added, removed, updated.

</div>
<div>

**The grammar of graphics** *(course-wide)*
"One datum → one mark, attributes driven by data" *is* the grammar: a **mark** type, plus **mappings** from data fields to visual channels.

</div>
</div>

<div class="takeaway">

**Hold onto this:** everything in D3 is a more powerful version of the `.map()` you can already write today.

</div>

<div class="ref">Wilkinson (2005), <em>The Grammar of Graphics</em>, Springer · Bostock et al. (2011), IEEE TVCG.</div>

<!--
Tie the lecture to the rest of the course. The join (next week) and the grammar
of graphics (the spine of the whole course) are both just this .map() idea,
formalised. Reassure them: nothing in D3 is magic — it's this, with bookkeeping.
End of section; next we meet the data itself.
-->

---

<!-- _class: lead -->

# 4 · Our data — tandem mass spectra

The dataset we will carry through all three sessions.

---

# What is a tandem mass spectrum?

<div class="columns wide-left">
<div>

A mass spectrometer **weighs molecules**. *Tandem* MS (MS/MS) does it twice:

1. Pick one molecule — the **precursor**.
2. **Smash it** into fragments.
3. Weigh every fragment.

The result is a list of peaks: each peak is an **(m/z, intensity)** pair. The *pattern* of fragment masses is a fingerprint of the molecule.

</div>
<div>

<svg viewBox="0 0 280 190" width="280">
  <line x1="20" y1="160" x2="265" y2="160" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="55"  y1="160" x2="55"  y2="115" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="95"  y1="160" x2="95"  y2="60"  stroke="#1F3A5F" stroke-width="3"/>
  <line x1="135" y1="160" x2="135" y2="100" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="175" y1="160" x2="175" y2="35"  stroke="#1F3A5F" stroke-width="3"/>
  <line x1="215" y1="160" x2="215" y2="90"  stroke="#1F3A5F" stroke-width="3"/>
  <line x1="245" y1="160" x2="245" y2="125" stroke="#1F3A5F" stroke-width="3"/>
  <text x="142" y="182" font-size="13" fill="#4A4A4A" text-anchor="middle">m/z →</text>
  <text x="175" y="28" font-size="11" fill="#CF0063" text-anchor="middle">a fragment</text>
</svg>

</div>
</div>

<div class="biology">

**For a peptide**, the molecule fragments along its backbone. The gaps between fragment peaks spell out the **amino-acid sequence** — that is how proteins are identified from spectra.

</div>

<div class="ref">Fragment-ion nomenclature: Roepstorff &amp; Fohlman (1984), <em>Biomed. Mass Spectrom.</em></div>

<!--
Keep the physics light — they have a biology background, so the "weigh, smash,
weigh again" framing lands. The key takeaway is the last line: a peak list is
an (m/z, intensity) array, and for peptides the pattern encodes sequence. We do
NOT annotate peaks today — that is the centrepiece of Session 2. Today the
spectrum is just our data shape.
-->

---

# Why peptides are our running thread

- **Shotgun proteomics** cuts proteins into peptides, runs them through MS/MS, and identifies them from their spectra — millions of spectra per experiment.
- Our dataset: tandem mass spectra of a **tryptic digest of BSA** (bovine serum albumin) — the universal teaching standard in proteomics.

<div class="note">

**The arc of the module:**
Session 1 — *draw* a spectrum (today) → Session 2 — *match* it to a peptide → Session 3 — a *network* of spectra linked by similarity.

</div>

<!--
Motivate the dataset choice. BSA tryptic digest is to proteomics what iris is to
ML — everyone knows it, it's clean, identifications are known. Lay out the
three-session arc so they see today is step one of something cumulative, not a
standalone toy.
-->

---

# The `.mgf` file format — it is just text

<div class="columns wide-right">
<div>

**MGF** = Mascot Generic Format.

- One spectrum per `BEGIN IONS` / `END IONS` block.
- Header lines: the precursor (`PEPMASS`, `CHARGE`, `TITLE`).
- Then one line per peak: `m/z  intensity`.

No magic. A text file you could parse with `.split("\n")`.

</div>
<div>

```text
BEGIN IONS
TITLE=LVNELTEFAK [M+2H]2+
PEPMASS=582.3190
CHARGE=2+
147.1128 2500.0
213.1597 1200.0
365.2183 4000.0
494.2609 10000.0
595.3086 6500.0
708.3927 7800.0
...
END IONS
```

</div>
</div>

<div class="ref">File: <code>data/example-spectrum.mgf</code> · MGF spec: Matrix Science (Mascot) documentation.</div>

<!--
Open the real file (data/example-spectrum.mgf) in the editor if you can — show
them it is genuinely plain text. The reassurance for a class with shaky JS: you
already know how to read this. Header lines, then "number space number". The
peptide is LVNELTEFAK, a real BSA peptide; the masses are real arithmetic.
-->

---

# A spectrum is an array of `(m/z, intensity)` pairs

<div class="columns">
<div>

Parsed into JavaScript, the file becomes exactly the data shape from Section 3:

```js
const peaks = [
  { mz: 147.1128, intensity:  2500 },
  { mz: 365.2183, intensity:  4000 },
  { mz: 494.2609, intensity: 10000 },
  { mz: 595.3086, intensity:  6500 },
  // ...
];
```

</div>
<div>

And the recipe is the one we already know:

```js
peaks.map(p =>
  `<line
     x1=${x(p.mz)} y1=${y(0)}
     x2=${x(p.mz)} y2=${y(p.intensity)}
   />`
);
```

**One peak → one `<line>`.** All that is missing: the functions `x()` and `y()`.

</div>
</div>

<!--
Close the loop tightly. The data section and the shapes section meet here: a
spectrum IS the array-of-objects from slide "One data point -> one element".
The only gap is x() and y() — the mapping from data units to pixels. That gap
is what we fill, by hand, in the demo. Then d3.scaleLinear fills it for us in
Session 2.
-->

---

<!-- _class: lead -->

# 5 · Live demo

From an `.mgf` file to an SVG stick plot — drawn by hand.

---

<!-- _class: demo -->

# Demo: the target

<div class="columns wide-right">
<div>

We will build **this**, live, from `example-spectrum.mgf`:

1. Parse the file → `peaks` array
2. Set up margins (the `<g>` convention)
3. Build `x()` and `y()` by hand
4. `.map()` peaks → `<line>` elements
5. Draw the baseline axis

</div>
<div>

<svg viewBox="0 0 640 320" width="640">
  <line x1="56" y1="270" x2="620" y2="270" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="56" y1="30"  x2="56"  y2="270" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="83"  y1="270" x2="83"  y2="210" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="120" y1="270" x2="120" y2="241" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="206" y1="270" x2="206" y2="174" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="257" y1="270" x2="257" y2="217" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="278" y1="270" x2="278" y2="30"  stroke="#CF0063" stroke-width="2.5"/>
  <line x1="321" y1="270" x2="321" y2="234" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="335" y1="270" x2="335" y2="114" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="378" y1="270" x2="378" y2="198" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="399" y1="270" x2="399" y2="83"  stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="472" y1="270" x2="472" y2="145" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="536" y1="270" x2="536" y2="191" stroke="#1F3A5F" stroke-width="2.5"/>
  <line x1="592" y1="270" x2="592" y2="236" stroke="#1F3A5F" stroke-width="2.5"/>
  <text x="338" y="296" font-size="14" fill="#4A4A4A" text-anchor="middle">m/z →</text>
  <text x="278" y="22" font-size="11" fill="#CF0063" text-anchor="middle">base peak</text>
</svg>

</div>
</div>

<!--
Switch to the editor / Observable now. This slide is the fallback picture if the
live coding goes sideways. Walk the five steps before you start typing so the
room has a map. Target: ~8 minutes of live coding. The notebook on the next
hands-on slide is the same code, so you can literally demo from it.
-->

---

<!-- _class: demo -->

# Demo: the code that matters

```js
const W = 640, H = 320;
const m = { top: 30, right: 20, bottom: 50, left: 56 };
const plotW = W - m.left - m.right;
const plotH = H - m.top - m.bottom;

const mzMin = 100, mzMax = 1100;
const iMax  = Math.max(...peaks.map(p => p.intensity));

// our hand-built "scales": data units -> pixels
const x = mz => m.left + (mz - mzMin) / (mzMax - mzMin) * plotW;
const y = i  => m.top  + plotH - (i / iMax) * plotH;   // <-- the y-flip

const sticks = peaks.map(p =>
  `<line x1=${x(p.mz)} y1=${y(0)} x2=${x(p.mz)} y2=${y(p.intensity)}
         stroke="#1F3A5F" stroke-width="2" />`
).join("");
```

<!--
The two lines to point at: x() and y(). These ARE scales — we just wrote them
by hand. Highlight the y-flip: y(0) is the bottom, y(iMax) is the top, because
SVG's y grows downward. Everything else is the .map() from Section 3. Keep the
live version close to this; resist adding features.
-->

---

# The catch — and next session to come

<div class="columns">
<div>

**What we did by hand:**

- Wrote `x()` and `y()` ourselves
- Hard-coded the domain `100 … 1100`
- Flipped `y` manually
- No tick marks, no axis labels

</div>
<div>

**What D3 gives you in Session 2:**

- `d3.scaleLinear()` — `x` and `y`, with nice rounded domains
- `d3.axisBottom()` — ticks and labels for free
- `selection.join()` — the `.map()`, but reactive

</div>
</div>

<div class="takeaway">

**You just hand-built the machinery D3 ships.** Next week is not new magic — it is this, made robust.

</div>

<!--
The reflective beat. Students should leave understanding that D3 is not a black
box: they have now implemented its core by hand. scaleLinear = our x()/y();
axisBottom = the ticks we skipped; join = our .map() plus change-tracking. This
framing pays off all module.
-->

---

<!-- _class: lead -->

# 6 · Why a stick plot?

A two-minute detour into perception — because the encoding was not an accident.

---

# Position and length are pre-attentive

<div class="columns wide-left">
<div>

Some visual properties are read **pre-attentively** — in under ~250 ms, in parallel, before conscious effort.

A stick plot encodes:

- **m/z → horizontal position**
- **intensity → length**

Both are pre-attentive. You see the tall peak *before* you decide to look for it.

</div>
<div>

<svg viewBox="0 0 280 200" width="280">
  <line x1="20" y1="170" x2="265" y2="170" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="50"  y1="170" x2="50"  y2="130" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="85"  y1="170" x2="85"  y2="110" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="120" y1="170" x2="120" y2="140" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="155" y1="170" x2="155" y2="30"  stroke="#CF0063" stroke-width="3"/>
  <line x1="190" y1="170" x2="190" y2="120" stroke="#1F3A5F" stroke-width="3"/>
  <line x1="225" y1="170" x2="225" y2="150" stroke="#1F3A5F" stroke-width="3"/>
  <text x="155" y="22" font-size="11" fill="#CF0063" text-anchor="middle">found it instantly</text>
</svg>

</div>
</div>

<!--
The pink peak: nobody had to search for it. That's pre-attentive processing —
length pops out. Contrast with asking "which peak's LABEL contains the letter
A" — that needs serial, attentive reading. Encodings that exploit pre-attentive
channels let the data speak before the viewer works.
-->

---

# Cleveland &amp; McGill: not all encodings are equal

Ranked by how **accurately** humans decode them:

| Rank | Encoding | Used by the stick plot? |
|---|---|---|
| 1 | Position on a common scale | ✅ m/z, and peak tops |
| 2 | Length | ✅ intensity |
| 3 | Angle / slope | — |
| 4 | Area | — |
| 5 | Colour / shading | — (we add it later, for *category*, not magnitude) |

<div class="takeaway">

The humble stick plot uses the **two most accurate encodings there are**. That is why it has been the standard for mass spectra for decades.

</div>

<div class="ref">Cleveland &amp; McGill (1984), "Graphical Perception", <em>JASA</em> · Munzner (2014), <em>Visualization Analysis &amp; Design</em>.</div>

<!--
Tie the cognition back to the design. The stick plot wasn't chosen by accident
or habit — it sits on top of Cleveland & McGill's ranking. Note the colour row:
colour is weak for MAGNITUDE but fine for CATEGORY — which is exactly how we'll
use it in Session 3 (colour = peptide identity). Foreshadow that.
-->

---

# Your turn — the Observable notebook

<div class="columns">
<div>

**Observable HQ** = a reactive JavaScript notebook in the browser. Zero setup, instant feedback — the perfect sketchpad before we move to the TypeScript app.

Open: `observable/unige-data-vis-lecture-d3js-1-observable.md` and paste the cells into a new notebook at **observablehq.com**.

</div>
<div>

**Part 1 — worked example**
SVG shapes, then a stick plot built from a real spectrum. The demo, in your hands.

**Part 2 — exercise**
You are given three peaks. Draw the spectrum **by hand**: build `x()` and `y()`, map peaks to `<line>`s, add the baseline.

</div>
</div>

<!--
Hand over. Have them at least fork the notebook and run Part 1 before they
leave, so any setup friction surfaces now. Part 2 is the real practice and can
finish as homework. Stress: no D3 in this notebook — that's deliberate, it's
all the SVG we did today.
-->

---

# Before next session

- **Finish** Part 2 of the Observable notebook — a working 3-peak stick plot.
- **Open** `data/example-spectrum.mgf` in a text editor and read it. Convince yourself it is just text.
- **Optional but recommended:** install **Node.js** — Session 2 moves into a TypeScript application.
- Bring a laptop. Session 2 is hands-on from the first minute.

<!--
Concrete, short homework list. The Node install is "optional but recommended"
so nobody is blocked, but flag that Session 2 ramps up — we leave the
zero-setup notebook world and start the real app.
-->

---

# Recap

- **SVG is retained mode** — every mark is a DOM element you can address, style, and bind data to. That is why D3 is built on it.
- The **coordinate system** has y growing *down* — you will flip it in every chart.
- A chart is a **faithful map**: one datum → one mark, attributes driven by data.
- A **tandem mass spectrum** is just an array of `(m/z, intensity)` pairs — and a stick plot draws it with the two most accurate visual encodings there are.

<div class="takeaway">

**Today you hand-built a chart. Next week, D3 makes it robust — and we start matching spectra to peptides.**

</div>

<!--
The four load-bearing ideas. If a student remembers only these, the lecture
worked. End on the bridge to Session 2: same dataset, same picture, but now
with D3's scales/axes/join — and the new biology, peptide-spectrum matching.
-->

---

# References &amp; further reading

- Bostock, M., Ogievetsky, V., Heer, J. (2011). **D³: Data-Driven Documents.** *IEEE TVCG* 17(12).
- Wilkinson, L. (2005). **The Grammar of Graphics** (2nd ed.). Springer.
- Cleveland, W. S., McGill, R. (1984). **Graphical Perception.** *JASA* 79(387).
- Munzner, T. (2014). **Visualization Analysis &amp; Design.** CRC Press. *(marks &amp; channels)*
- Roepstorff, P., Fohlman, J. (1984). **Proposal for peptide fragment nomenclature.** *Biomed. Mass Spectrom.* 11(11).
- **MDN SVG reference** — developer.mozilla.org/en-US/docs/Web/SVG
- **Observable HQ** — observablehq.com · **MGF format** — Matrix Science (Mascot) docs.

<!--
Real references, course-appropriate. The D3 paper and Grammar of Graphics anchor
the tooling; Cleveland & McGill and Munzner anchor the perception thread;
Roepstorff & Fohlman is the MS/MS nomenclature they'll need in Session 2. MDN
and Observable are the practical links.
-->

