# Proposal: "Build Index" Phase for HNSW Explorer

## Overview

Add a **construction/build phase** that animates index creation before allowing the user to run queries. This transforms the app from a "search-only" demo into a full **build → query** educational tool, teaching users that ANN indexes require upfront construction time.

---

## UX Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Current flow:                                                       │
│  [Page loads] → data pre-built → [Run Search] → animation           │
│                                                                      │
│  Proposed flow:                                                      │
│  [Page loads] → raw points shown → [Build Index] → animated build   │
│                                     → index ready → [Run Search]     │
└─────────────────────────────────────────────────────────────────────┘
```

### Two-Phase Button Bar

| State | Primary Button | Secondary Button | Behavior |
|-------|---------------|-----------------|----------|
| **Unbuilt** | `Build Index` (blue) | `Run Search` (disabled, grayed) | Sliders active |
| **Building** | `Building...` (disabled, pulsing) | `Run Search` (disabled) | Sliders locked |
| **Ready** | `Rebuild` (outline) | `Run Search` (purple, enabled) | Sliders trigger rebuild prompt |
| **Searching** | `Rebuild` (disabled) | `Searching...` (disabled) | — |

---

## Animation: Build Phase

The build animation plays across all 4 panels simultaneously, split into 3 stages:

### Stage 1: K-Means for IVF (Panel 1) — ~3 seconds

**What the user sees:**
1. **t=0s** — Raw points appear (all gray, no clusters)
2. **t=0.3s** — K random points flash as initial centroids (★ markers)
3. **t=0.6s–2.5s** — Iterate (5–8 visible iterations):
   - Points color-assign to nearest centroid (Voronoi-style coloring radiates outward)
   - Centroids shift toward cluster mean (animated position transition)
   - Cluster boundaries (circles) appear and resize each iteration
4. **t=2.5s–3s** — Final partition locks in, Voronoi-boundaries solidify

**Panel 4 (Metrics)** shows during this stage:
- "Building IVF..." with iteration counter: `k-means iter 3/10`
- Live count: `6 partitions forming...`

### Stage 2: PQ Codebook Training (Panel 2) — ~2 seconds

**What the user sees:**
1. **t=0s** — The "Original (float32)" bar is full; compressed bar is empty
2. **t=0.5s** — Subspace blocks appear one-by-one (left → right, staggered 150ms each)
3. **t=1.0s** — Each block fills with a "training" animation:
   - Small dots scatter inside each block, then converge to 256 cluster positions
   - Block turns green once its codebook is trained
4. **t=1.5s** — The compressed bar grows from 0 → final size
5. **t=2s** — "64× compression" badge fades in

### Stage 3: HNSW Graph Construction (Panel 3) — ~4 seconds

**What the user sees:**
1. **t=0s** — Empty planes (3D parallelograms) visible but no nodes
2. **t=0.5s** — Layer 0 (base): nodes inserted one-at-a-time in batches:
   - Each new node appears with a brief "pop" animation
   - Edges extend to nearest M neighbors (animated line-draw)
   - Fast: ~15 visible insertions over 1.5s (sampling every Nth point)
3. **t=2s** — Layer 1: fewer nodes promote up (line connects node in L0 to its copy in L1)
   - Promotion shown as a dot rising from L0 → L1
   - Edges form between L1 nodes
4. **t=3s** — Layer 2+: very sparse, 2–5 nodes promote with edges
5. **t=3.5s** — Final flash: all edges briefly glow, then settle to normal opacity
6. **t=4s** — "Index ready" indicator

**Panel 4 (Metrics)** shows:
- "Building HNSW..." 
- Live stats: `Nodes inserted: 87/150`, `Edges: 342`, `Layers: 3`

---

## Implementation Plan

### New Files

```
src/lib/components/BuildProgress.svelte   — progress overlay/panel for build stage
```

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/hnsw.ts` | Add `computeIVFPartitionsIterative()` that yields per-iteration state; add `buildHNSWGraphIncremental()` that yields per-insertion state |
| `src/routes/+page.svelte` | Add `buildPhase` state machine; split `initializeData()` into `generateRawPoints()` + `buildIndex()` |
| `src/lib/components/IVFView.svelte` | Accept `buildState` prop for partial centroid/assignment data during animation |
| `src/lib/components/HNSWView.svelte` | Accept `buildState` prop for incremental node/edge insertion |
| `src/lib/components/PQView.svelte` | Accept `buildState` prop for staged codebook training |

### New Types

```typescript
// Build phase state
interface BuildPhase {
  stage: 'idle' | 'kmeans' | 'pq' | 'hnsw' | 'complete';
  progress: number; // 0–1 overall

  // k-means state (for IVFView)
  kmeans?: {
    iteration: number;
    maxIterations: number;
    centroids: { x: number; y: number }[];
    assignments: number[]; // per-point cluster assignment
    converged: boolean;
  };

  // PQ state (for PQView)
  pq?: {
    trainedSubspaces: number; // how many subspaces are done
    totalSubspaces: number;
    compressionProgress: number; // 0–1
  };

  // HNSW state (for HNSWView)
  hnsw?: {
    insertedNodes: number;
    totalNodes: number;
    currentLayer: number;
    edgeCount: number;
    lastInsertedId: number; // for highlight
    promotions: { fromLayer: number; toLayer: number; pointId: number }[];
  };
}
```

### Key Engine Functions

```typescript
// Yields state after each k-means iteration (for animation)
export function* computeIVFPartitionsAnimated(
  points: Point[],
  numPartitions: number,
  maxIterations: number
): Generator<BuildPhase['kmeans']> {
  // ... init centroids
  for (let iter = 0; iter < maxIterations; iter++) {
    // assign + update
    yield { iteration: iter, maxIterations, centroids, assignments, converged };
  }
}

// Yields state after each node insertion (batched for perf)
export function* buildHNSWGraphAnimated(
  points: Point[],
  numLayers: number,
  M: number,
  batchSize: number = 5
): Generator<{ nodes: HNSWNode[]; lastBatch: number[]; edgeCount: number }> {
  // ... insert nodes in batches, yield after each batch
}
```

### Animation Controller (in +page.svelte)

```typescript
async function buildIndex() {
  buildPhase = { stage: 'kmeans', progress: 0 };

  // Stage 1: Animated k-means
  const kmeansGen = computeIVFPartitionsAnimated(points, numPartitions, 10);
  for (const state of kmeansGen) {
    buildPhase = { ...buildPhase, kmeans: state, progress: state.iteration / 30 };
    await tick(); // let Svelte render
    await sleep(300); // visible pause per iteration
  }

  // Stage 2: PQ training
  buildPhase = { ...buildPhase, stage: 'pq', progress: 0.33 };
  for (let s = 0; s < numSubspaces; s++) {
    buildPhase.pq = { trainedSubspaces: s + 1, totalSubspaces: numSubspaces, compressionProgress: (s+1)/numSubspaces };
    await tick();
    await sleep(200);
  }

  // Stage 3: HNSW construction
  buildPhase = { ...buildPhase, stage: 'hnsw', progress: 0.66 };
  const hnswGen = buildHNSWGraphAnimated(points, numLayers, M, 5);
  for (const state of hnswGen) {
    buildPhase.hnsw = { insertedNodes: state.lastBatch.length, ... };
    nodes = state.nodes; // live-update the HNSWView
    await tick();
    await sleep(80);
  }

  buildPhase = { stage: 'complete', progress: 1 };
  indexReady = true;
}
```

---

## Visual Mockup (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HNSW Explorer   [Vectors ●━━ 150]  [Partitions ●━━ 6]  [Layers ●━━ 3]     │
│                                          [Build Index]  [Run Search (disabled)]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──── 1. IVF ────────┐ ┌──── 2. PQ ─────────┐ ┌──── 3. HNSW ──────┐ ┌────┐│
│ │                     │ │                     │ │                    │ │ 4. ││
│ │   ○ ○    ○          │ │  ▓▓▓▓▓▓▓▓▓  75 KB  │ │  ┌─────────┐ L2   │ │    ││
│ │  ○  ★○  ○           │ │                     │ │  │  (empty) │      │ │Bld ││
│ │   ○○  ○ ○           │ │  ░  1.2 KB          │ │  └─────────┘      │ │    ││
│ │      ○              │ │                     │ │  ┌───────────┐ L1  │ │ing ││
│ │  ★  ○○ ○ ★          │ │  [ ][ ][ ][ ][ ]   │ │  │  (empty)  │     │ │    ││
│ │   ○ ○   ○           │ │  s1 s2 s3 s4 s5    │ │  └───────────┘     │ │... ││
│ │                     │ │                     │ │  ┌─────────────┐L0 │ │    ││
│ │ k-means iter 3/10   │ │  Training...        │ │  │ ●→●→● ...  │   │ │    ││
│ │ ★ = initial centroid│ │                     │ │  └─────────────┘   │ │    ││
│ └─────────────────────┘ └─────────────────────┘ └────────────────────┘ └────┘│
│                                                                              │
│ ┌─ BUILD PROGRESS ─────────────────────────────────────────────────────────┐ │
│ │  [████████████░░░░░░░░░░░░░░░░░░░░░░░]  Stage: K-Means (iter 3/10)      │ │
│ │   IVF ●━━━━━━━━━━●  PQ ○─────────○  HNSW ○─────────○                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Timing Budget

| Stage | Duration | Speed Control |
|-------|----------|---------------|
| K-Means | ~3s (300ms × 10 iters) | Skip button / speed slider |
| PQ Training | ~2s (200ms × 8 subspaces + transitions) | |
| HNSW Build | ~4s (80ms × 50 batches) | |
| **Total** | **~9s** | "Skip Build" button instant-completes |

A **speed slider** (1×, 2×, 5×, instant) lets impatient users skip ahead while learners watch at full speed.

---

## Edge Cases & UX Details

1. **Parameter changes after build** — Show a yellow banner: "Parameters changed — Rebuild required" with a `Rebuild` button. The search button becomes disabled again.

2. **Skip Build** — A small "Skip →" link below the progress bar that instant-completes all stages (runs the non-animated versions of the functions).

3. **Replay** — After build completes, a small "↺ Replay Build" link appears so users can watch it again.

4. **Mobile** — On narrow viewports, stack the 4 panels 2×2 and keep the same animation but with smaller SVGs.

5. **First-load hint** — Subtle pulsing glow on the "Build Index" button with tooltip: "Click to build the search index before querying"

---

## Effort Estimate

| Task | Effort |
|------|--------|
| Generator functions in `hnsw.ts` | ~2 hrs |
| `BuildProgress.svelte` component | ~1 hr |
| State machine in `+page.svelte` | ~1.5 hrs |
| IVFView animated centroid convergence | ~1.5 hrs |
| PQView staged training animation | ~1 hr |
| HNSWView incremental insertion | ~2 hrs |
| Speed control + skip + edge cases | ~1 hr |
| **Total** | **~10 hrs** |

---

## Summary

This feature turns a static "here's a pre-built index" demo into an interactive **"watch the index being constructed"** experience. Users will understand *why* ANN search is fast — because expensive work (k-means, codebook training, graph building) happens at index time, not query time. The two-button UX (`Build Index` → `Run Search`) makes this temporal separation explicit and tactile.
