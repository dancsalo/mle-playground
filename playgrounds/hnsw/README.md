# HNSW Explorer

Interactive SvelteKit app for visualizing an approximate nearest neighbor pipeline using IVF, PQ, and HNSW.

## Tech stack

- SvelteKit
- Vite
- TypeScript
- D3
- Tailwind CSS

## Prerequisites

- Node.js 20+ recommended
- npm

## Install

```bash
npm install
```

## Run locally

Start the development server:

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

To automatically open the browser:

```bash
npm run dev -- --open
```

## Build for production

```bash
npm run build
```

The production build is generated in SvelteKit/Vite output directories.

## Preview the production build locally

```bash
npm run preview
```

## Useful scripts

```bash
npm run dev          # start dev server
npm run build        # create production build
npm run preview      # preview production build locally
npm run check        # run Svelte/TypeScript checks
npm run check:watch  # run checks in watch mode
```

## Project structure

```text
src/routes/+page.svelte          main app UI
src/lib/components/              visualization panels and controls
src/lib/hnsw.ts                  data generation and ANN simulation logic
```

## Notes

- This repo uses `@sveltejs/adapter-auto`, which is convenient for local development and can be adapted later for deployment targets.
- The app is primarily a local interactive visualization for exploring index build and search behavior.
