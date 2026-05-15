# Peptide-spectrum viewer

The application for the **D3.js module** of the UniGE Data Visualisation course.
It starts life in Session 2 as an annotated tandem-mass-spectrum viewer, and
Session 3 grows it into a spectrum-similarity network.

## Run it

You need [Node.js](https://nodejs.org) (version 18 or newer).

```bash
npm install     # once, to fetch d3, Vite and TypeScript
npm run dev     # starts the dev server and opens the browser
```

Edit any file in `src/` and the page reloads itself.

```bash
npm run typecheck   # check the TypeScript types without running anything
npm run build       # type-check + produce a static build in dist/
```

## What is where

| File | What it does |
|---|---|
| `src/types.ts` | The data model: `Peak`, `Spectrum`, `Peptide`, `FragmentIon`, `Annotation`. |
| `src/mgf.ts` | Parses an `.mgf` file (plain text) into a `Spectrum`. |
| `src/fragments.ts` | **Given to you.** Predicts the b/y fragment-ion ladder of a peptide. |
| `src/match.ts` | Matches observed peaks to theoretical ions, within a mass tolerance. |
| `src/spectrumChart.ts` | The D3 component: scales, axes, the data-join, the annotated spectrum. |
| `src/main.ts` | Wires it together. **The exercise knob (`TOLERANCE_DA`) lives here.** |

## The Session 2 exercise

1. Open `src/main.ts` and change `TOLERANCE_DA`. Watch the match count in the
   page footer, and the colours in the chart, react. Find the point where good
   matches start to drop, and the point where false matches creep in.
2. *(Stretch)* In `src/spectrumChart.ts`, add the signed mass error to each
   peak's hover tooltip, or give b-ion and y-ion labels slightly different
   vertical offsets so crowded regions stay readable.
