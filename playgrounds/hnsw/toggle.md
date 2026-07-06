# Proposal: Step-by-Step Build Mode Toggle

## Overview

Add a toggle switch that lets users choose between:
- **Auto mode** (current): Build runs continuously with animated delays
- **Step mode** (new): Build pauses after each visible step, user clicks "Next Step" to advance

This turns the build animation into an interactive tutorial where users control the pace.

---

## UX Design

### Toggle Placement

Inside the `BuildProgress` component, next to the "Skip →" link:

```
┌─ INDEX CONSTRUCTION ────────────────────────────── [Step-by-step ●○] ─ Skip → ─┐
│  [████████░░░░░░░░░░░░░░░░░]  K-Means (iter 3/10)                               │
│  [K-Means ●━━━━━━━●]──[PQ Train ○────○]──[HNSW Build ○────○]                    │
│                                                                                   │
│  IVF: K-Means Clustering                              [ ◀ Prev ] [ Next Step ▶ ] │
│  Running k-means to partition vectors...                                          │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Behavior

| Mode | What Happens |
|------|-------------|
| **Auto** (default) | Current behavior — `buildIndex()` runs with `await sleep(ms)` between frames |
| **Step-by-step** | Build pauses after each iteration/batch. A "Next Step ▶" button advances one step. "◀ Prev" goes back (replay from snapshot). |

### States in Step Mode

```
[idle] → click "Build Index" → [paused at k-means iter 0]
  → click "Next Step" → [paused at k-means iter 1]
  → click "Next Step" → [paused at k-means iter 2]
  ...
  → click "Next Step" → [paused at PQ subspace 1]
  → click "Next Step" → [paused at PQ subspace 2]
  ...
  → click "Next Step" → [paused at HNSW batch 1]
  ...
  → click "Next Step" → [complete]
```

### Step Granularity

| Stage | What Counts as One Step |
|-------|------------------------|
| **K-Means** | One iteration (assign + update centroids) |
| **PQ Training** | One subspace codebook trained |
| **HNSW Build** | One batch of nodes inserted (~10 nodes) |

With 150 vectors, 6 partitions, 8 subspaces, that's:
- K-means: ~10-12 steps (iterations)
- PQ: 8 steps (one per subspace)
- HNSW: ~15 steps (150/10 batches)
- **Total: ~33-35 steps** (manageable for manual clicking)

---

## Implementation Plan

### Changes to `BuildProgress.svelte`

```svelte
<!-- New props -->
let { 
  buildPhase,
  onSkip,
  stepMode,          // NEW: boolean
  onToggleStepMode,  // NEW: () => void
  onNextStep,        // NEW: () => void
  onPrevStep,        // NEW: () => void
  canGoBack,         // NEW: boolean
  isPaused           // NEW: boolean (true when waiting for user in step mode)
}: Props = $props();
```

Add to template:
```svelte
<!-- Toggle -->
<label class="flex items-center gap-1.5 text-xs">
  <span class="text-gray-500">Step-by-step</span>
  <button 
    onclick={onToggleStepMode}
    class="relative w-8 h-4 rounded-full transition-colors
      {stepMode ? 'bg-indigo-500' : 'bg-gray-300'}"
  >
    <span class="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform
      {stepMode ? 'translate-x-4' : ''}" />
  </button>
</label>

<!-- Step controls (shown when paused in step mode) -->
{#if stepMode && isPaused}
  <div class="flex gap-2 mt-2 justify-center">
    <button onclick={onPrevStep} disabled={!canGoBack}
      class="rounded bg-gray-100 px-3 py-1 text-xs font-medium disabled:opacity-30">
      ◀ Prev
    </button>
    <button onclick={onNextStep}
      class="rounded bg-indigo-500 px-4 py-1 text-xs font-semibold text-white hover:bg-indigo-600">
      Next Step ▶
    </button>
  </div>
{/if}
```

### Changes to `+page.svelte` — Build Controller

The core idea: instead of `await sleep(ms)`, use a **pause mechanism** that resolves only when the user clicks "Next Step":

```typescript
// ─── Step Mode State ─────────────────────────────────────────────────────────
let stepMode = $state(false);
let isPaused = $state(false);
let stepResolver: (() => void) | null = null;
let buildSnapshots: BuildPhase[] = $state([]); // for "Prev" navigation
let currentSnapshotIdx = $state(0);

// Pause-or-sleep: in step mode, wait for user click; in auto mode, just sleep
function pauseOrSleep(ms: number): Promise<void> {
  if (stepMode) {
    isPaused = true;
    return new Promise<void>(resolve => {
      stepResolver = resolve;
    });
  }
  return sleep(ms);
}

function nextStep() {
  if (stepResolver) {
    isPaused = false;
    const resolve = stepResolver;
    stepResolver = null;
    resolve();
  }
}

function prevStep() {
  if (currentSnapshotIdx > 0) {
    currentSnapshotIdx--;
    // Restore state from snapshot
    const snap = buildSnapshots[currentSnapshotIdx];
    buildPhase = snap;
    // Restore clusters/nodes/points from associated snapshot data
    restoreSnapshot(currentSnapshotIdx);
  }
}
```

Then in `buildIndex()`, replace every `await sleep(280)` with:

```typescript
// Save snapshot for "Prev" navigation
buildSnapshots.push(structuredClone(buildPhase));
currentSnapshotIdx = buildSnapshots.length - 1;

await pauseOrSleep(280);
if (skipRequested) break;
```

### Snapshot Storage (for "Prev" button)

Each snapshot stores:
```typescript
interface BuildSnapshot {
  buildPhase: BuildPhase;
  clusters: Cluster[];
  points: Point[];  // with clusterId assignments
  nodes: HNSWNode[];
}
```

This allows "Prev" to rewind to any previous state. Since we have ~35 steps max with small data (150 vectors), memory is negligible.

### Changes to `+page.svelte` — Toggle Handler

```typescript
function toggleStepMode() {
  stepMode = !stepMode;
  // If we're currently building in auto mode and switch to step, pause immediately
  if (stepMode && isBuilding && !isPaused) {
    // The next pauseOrSleep call will pause
  }
  // If we switch from step to auto while paused, auto-advance
  if (!stepMode && isPaused) {
    nextStep(); // Resume
  }
}
```

---

## Interaction Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Toggle OFF (Auto Mode)                      │
│  Click "Build Index" → runs continuously → "Index Built!"     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Toggle ON (Step Mode)                       │
│                                                               │
│  Click "Build Index"                                          │
│       ↓                                                       │
│  [PAUSED] k-means iter 0 — centroids placed                  │
│       ↓ click "Next Step"                                     │
│  [PAUSED] k-means iter 1 — points assigned, centroids moved  │
│       ↓ click "Next Step"                                     │
│  [PAUSED] k-means iter 2 — ...                                │
│       ↓ ... (can click "◀ Prev" to go back)                   │
│  [PAUSED] PQ subspace 1 trained                               │
│       ↓ click "Next Step"                                     │
│  [PAUSED] PQ subspace 2 trained                               │
│       ↓ ...                                                   │
│  [PAUSED] HNSW batch 1: 10 nodes inserted                    │
│       ↓ click "Next Step"                                     │
│  [PAUSED] HNSW batch 2: 20 nodes inserted                    │
│       ↓ ...                                                   │
│  "Index Built!" (step mode ends)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Edge Cases

1. **Toggle mid-build (Auto→Step)**: Next frame pauses. User can then step manually.
2. **Toggle mid-build (Step→Auto)**: Immediately resumes continuous playback.
3. **"Skip" while in step mode**: Instant-completes as usual.
4. **"Prev" at first step**: Disabled (grayed out).
5. **Parameter change while paused**: Shows "Parameters changed" warning, paused state preserved.
6. **Rapid "Next Step" clicks**: Each click advances exactly one step (no double-advance).

---

## Visual Enhancements in Step Mode

When paused, add subtle indicators to the panels:

- **IVF Panel**: Flash/pulse the centroids that just moved
- **PQ Panel**: Highlight the subspace block that just trained with a brief glow
- **HNSW Panel**: Flash the newly-inserted nodes in green with a brief scale animation

These are purely CSS transitions triggered by the step — no extra JS needed.

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/lib/components/BuildProgress.svelte` | Add toggle switch + step controls (Prev/Next buttons) |
| `src/routes/+page.svelte` | Add `stepMode`, `isPaused`, `stepResolver`, `buildSnapshots` state; refactor `buildIndex()` to use `pauseOrSleep()`; add `nextStep()`, `prevStep()`, `toggleStepMode()` |

No changes needed to IVFView, PQView, or HNSWView — they already reactively render based on `buildPhase` state.

---

## Effort Estimate

| Task | Effort |
|------|--------|
| Toggle UI in BuildProgress | ~30 min |
| `pauseOrSleep()` + resolver mechanism | ~45 min |
| Snapshot storage + "Prev" navigation | ~1 hr |
| Auto↔Step toggle mid-build transitions | ~30 min |
| Testing edge cases | ~30 min |
| **Total** | **~3 hrs** |
