# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Teaching materials for the D3.js module of the UniGE Data Visualisation course — three sessions of Marp slide decks and a companion TypeScript/D3 web app that evolves across sessions. The app is a peptide tandem-mass-spectrum viewer (Session 2) that grows into a spectrum-similarity network (Session 3).

## Commands

### Slides (Marp)

```bash
# Install Marp CLI once globally
npm install -g @marp-team/marp-cli

# Build a single deck to HTML (from slides/d3js/)
marp unige-data-vis-lecture-d3js-1.md

# Live preview while editing
marp -p -w unige-data-vis-lecture-d3js-2.md

# Export to PDF
marp unige-data-vis-lecture-d3js-3.md --pdf
```

The custom course theme lives in `themes/unige.css` and is referenced as `theme: unige` in each deck's front matter. `marp.config.js` registers it automatically.

### Apps

**Session 2 — spectrum viewer (`app_one/`)**

```bash
cd app_one
npm install        # once
npm run dev        # Vite dev server with HMR
npm run typecheck  # tsc --noEmit only
npm run build      # typecheck + static build → dist/
```

**Session 3 — spectrum network (`app_network/`)**

```bash
cd app_network
npm install        # once
npm run dev        # Vite dev server with HMR (fetches from data-service)
npm run typecheck  # tsc --noEmit only
npm run build      # typecheck + static build → dist/
```

The network app fetches spectra from the data-service at `http://localhost:8081/spectra`. Start the service separately when running locally:

```bash
cd data-service
node server.js     # serves GET /spectra and GET /health on port 8081
```

### Docker (full stack)

```bash
# From slides/d3js/
docker compose up --build   # builds both containers, opens on :8080
docker compose down
```

The data-service runs on host port `8081`; nginx serves the built app on port `8080`.

## Architecture

### App source (`app_network/src/`)

The network app is wired in layers; `main.ts` is the entry point that connects them all:

| File | Role |
|---|---|
| `types.ts` | Shared data model: `Peak`, `Spectrum`, `Peptide`, `FragmentIon`, `Annotation`, and the Session 3 graph types (`SpectrumNode`, `SimilarityLink`, `SpectrumGraph`). |
| `mgf.ts` | Parses MGF text (plain-text mass-spec format) into `Spectrum[]`. |
| `api.ts` | Fetches MGF text from the data-service and calls `mgf.ts`. |
| `fragments.ts` | Predicts theoretical b/y fragment-ion ladders from a peptide sequence. Pre-written; students don't modify it. |
| `match.ts` | Matches observed peaks to theoretical ions within a dalton tolerance (`TOLERANCE_DA` in `main.ts`). |
| `spectrumChart.ts` | D3 component: scales, axes, data-join, annotated bar chart. Used for the detail panel in both sessions. |
| `similarity.ts` | Computes pairwise cosine similarities between spectra (O(N²), runs once on load). |
| `network.ts` | `computeSimilarities` + `graphFromSimilarities` — builds the `SpectrumGraph` from cached similarities at a given threshold. |
| `networkChart.ts` | D3 force-directed graph: nodes coloured by peptide identity, draggable, click triggers detail view. |

### Session exercise knobs (in `main.ts`)

- `TOLERANCE_DA` — annotation tolerance for the spectrum detail view (Session 2 exercise).
- `INITIAL_THRESHOLD` — cosine similarity cutoff for the network (Session 3 exercise; also exposed as a live slider).

### Data service (`data-service/`)

Zero-dependency Node.js HTTP server (`server.js`). Reads `spectra.mgf` at startup and serves it verbatim. No framework, no npm dependencies.

### Observable versions (`observable/`)

Markdown notebooks (`*.md`) that mirror the lecture content for Observable Framework. Separate from the Vite app.
