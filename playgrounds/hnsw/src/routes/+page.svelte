<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';
  import { 
    generateClusteredData, 
    computeIVFPartitions,
    computeIVFPartitionsAnimated,
    buildHNSWGraph,
    buildHNSWGraphAnimated,
    searchHNSW, 
    calculateMetrics,
    type Point,
    type Cluster,
    type HNSWNode,
    type SearchPath,
    type QueryState,
    type SearchMetrics,
    type BuildPhase,
    type KMeansState,
    type PQBuildState,
    type HNSWBuildState
  } from '$lib/hnsw';
  
  import IVFView from '$lib/components/IVFView.svelte';
  import PQView from '$lib/components/PQView.svelte';
  import HNSWView from '$lib/components/HNSWView.svelte';
  import MetricsPanel from '$lib/components/MetricsPanel.svelte';
  import BuildProgress from '$lib/components/BuildProgress.svelte';

  // ─── Parameters ────────────────────────────────────────────────────────────────
  
  let numPoints = $state(150);
  let numPartitions = $state(6);
  let numLayers = $state(3);
  let ivfProbes = $state(3);
  let efSearch = $state(10);
  let M = $state(6);
  let numSubspaces = $state(4);

  // ─── App State ─────────────────────────────────────────────────────────────────

  let points: Point[] = $state([]);
  let clusters: Cluster[] = $state([]);
  let nodes: HNSWNode[] = $state([]);
  let queryPoint = $state({ x: 0.5, y: 0.5 });
  let searchPath: SearchPath[] = $state([]);
  let queryState: QueryState | null = $state(null);
  let metrics: SearchMetrics | null = $state(null);
  let isAnimating = $state(false);

  // ─── Build Phase State ─────────────────────────────────────────────────────────

  let indexReady = $state(false);
  let isBuilding = $state(false);
  let needsRebuild = $state(false);
  let buildPhase: BuildPhase = $state({ stage: 'idle', progress: 0 });
  let buildSpeed = $state(1);

  // ─── Playback / Step Mode ─────────────────────────────────────────────────────

  let stepMode = $state(false);
  let isPaused = $state(false);
  let isPlaying = $state(false);
  let stepResolver: (() => void) | null = null;
  let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  // Snapshot system for rewind
  interface Snapshot {
    buildPhase: BuildPhase;
    clusters: Cluster[];
    points: Point[];
    nodes: HNSWNode[];
    queryState: QueryState | null;
    searchPath: SearchPath[];
  }
  let snapshots: Snapshot[] = $state([]);
  let currentStepNum = $state(0);
  let totalSteps = $state(0);

  let browsingSnapshots = $state(false); // true when user has rewound behind the live frontier

  function pauseOrSleep(ms: number): Promise<void> {
    if (stepMode && !isPlaying) {
      isPaused = true;
      return new Promise<void>(resolve => {
        stepResolver = resolve;
      });
    }
    if (stepMode && isPlaying) {
      isPaused = false;
      return sleep(ms * 0.7);
    }
    return sleep(ms);
  }

  function saveSnapshot() {
    snapshots = [...snapshots, {
      buildPhase: JSON.parse(JSON.stringify(buildPhase)),
      clusters: JSON.parse(JSON.stringify(clusters)),
      points: JSON.parse(JSON.stringify(points)),
      nodes: JSON.parse(JSON.stringify(nodes)),
      queryState: queryState ? JSON.parse(JSON.stringify(queryState)) : null,
      searchPath: JSON.parse(JSON.stringify(searchPath))
    }];
    currentStepNum = snapshots.length;
  }

  function restoreSnapshot(idx: number) {
    if (idx < 0 || idx >= snapshots.length) return;
    const snap = snapshots[idx];
    buildPhase = snap.buildPhase;
    clusters = snap.clusters;
    points = snap.points;
    nodes = snap.nodes;
    queryState = snap.queryState;
    searchPath = snap.searchPath;
    currentStepNum = idx + 1;
  }

  function toggleStepMode() {
    stepMode = !stepMode;
    if (!stepMode && isPaused) {
      // Switching to auto while paused — resume
      isPaused = false;
      isPlaying = false;
      if (stepResolver) {
        const r = stepResolver;
        stepResolver = null;
        r();
      }
    }
  }

  function playbackPlay() {
    isPlaying = true;
    isPaused = false;
    if (browsingSnapshots) {
      // Fast-forward through remaining snapshots, then resume loop
      browsingSnapshots = false;
    }
    // If currently paused at a step, advance
    if (stepResolver) {
      const r = stepResolver;
      stepResolver = null;
      r();
    }
  }

  function playbackPause() {
    isPlaying = false;
    // Next pauseOrSleep will pause
  }

  function playbackNext() {
    if (currentStepNum < snapshots.length) {
      // There are saved snapshots ahead — navigate forward through them
      restoreSnapshot(currentStepNum); // currentStepNum is 1-indexed; this shows snapshot[currentStepNum] and sets currentStepNum += 1
      if (currentStepNum >= snapshots.length) {
        browsingSnapshots = false;
      }
    } else if (stepResolver) {
      // At the live frontier and build loop is waiting — advance it one step
      browsingSnapshots = false;
      isPaused = false;
      const r = stepResolver;
      stepResolver = null;
      r();
    }
  }

  function playbackPrev() {
    if (currentStepNum > 1) {
      browsingSnapshots = true;
      restoreSnapshot(currentStepNum - 2);
      // Re-pause
      isPaused = true;
    }
  }

  function playbackFastForward() {
    skipBuild();
  }

  // ─── Initialize raw points (no index) ─────────────────────────────────────────

  function generateRawPoints() {
    const data = generateClusteredData(numPoints, numPartitions, 42);
    points = data.points;
    // Reset everything
    clusters = [];
    nodes = [];
    queryState = null;
    searchPath = [];
    metrics = null;
    indexReady = false;
    needsRebuild = false;
    buildPhase = { stage: 'idle', progress: 0 };
  }

  if (browser) {
    generateRawPoints();
  }

  onMount(() => {
    if (points.length === 0) generateRawPoints();
  });

  // Track parameter changes → mark needs rebuild
  // Use a non-reactive variable to avoid effect loops
  let prevParams: { numPoints: number; numPartitions: number; numLayers: number; M: number } | null = null;
  $effect(() => {
    const current = { numPoints, numPartitions, numLayers, M };
    if (prevParams === null) {
      prevParams = current;
      return;
    }
    const changed = (
      current.numPoints !== prevParams.numPoints ||
      current.numPartitions !== prevParams.numPartitions ||
      current.numLayers !== prevParams.numLayers ||
      current.M !== prevParams.M
    );
    // Update prev immediately (non-reactive, won't re-trigger)
    prevParams = current;
    if (!changed) return;
    if (indexReady) {
      needsRebuild = true;
    } else if (!isBuilding) {
      generateRawPoints();
    }
  });

  // ─── Build Index (animated) ────────────────────────────────────────────────────

  let skipRequested = false;

  function sleep(ms: number): Promise<void> {
    const adjusted = ms / buildSpeed;
    return new Promise(r => setTimeout(r, adjusted));
  }

  async function buildIndex() {
    if (isBuilding) return;
    isBuilding = true;
    skipRequested = false;
    needsRebuild = false;
    indexReady = false;
    queryState = null;
    searchPath = [];
    metrics = null;
    snapshots = [];
    currentStepNum = 0;
    isPaused = false;

    // Regenerate raw points fresh
    const data = generateClusteredData(numPoints, numPartitions, 42);
    points = data.points;
    clusters = [];
    nodes = [];

    // Estimate total steps
    totalSteps = 12 + numSubspaces + Math.ceil(numPoints / 10);

    try {
      // ═══ STAGE 1: K-Means for IVF ═══════════════════════════════════════════════
      buildPhase = { stage: 'kmeans', progress: 0 };
      await tick();

      const kmeansGen = computeIVFPartitionsAnimated([...points], numPartitions, 12);
      let lastKmeans: KMeansState | null = null;

      for (const state of kmeansGen) {
        if (skipRequested) break;
        lastKmeans = state;
        buildPhase = {
          stage: 'kmeans',
          progress: (state.iteration / state.maxIterations) * 0.33,
          kmeans: state
        };
        clusters = state.centroids.map((c, i) => ({
          id: i,
          centroid: c,
          points: points
            .map((p, idx) => ({ id: p.id, assigned: state.assignments[idx] }))
            .filter(a => a.assigned === i)
            .map(a => a.id)
        }));
        for (let i = 0; i < points.length; i++) {
          points[i].clusterId = state.assignments[i];
        }
        points = [...points];
        saveSnapshot();
        await tick();
        await pauseOrSleep(280);
        if (skipRequested) break;
      }

      if (!skipRequested && !lastKmeans) {
        clusters = computeIVFPartitions([...points], numPartitions, 12);
      }

      // ═══ STAGE 2: PQ Codebook Training ══════════════════════════════════════════
      if (!skipRequested) {
        buildPhase = { stage: 'pq', progress: 0.33, pq: { trainedSubspaces: 0, totalSubspaces: numSubspaces, compressionProgress: 0 } };
        await tick();

        for (let s = 0; s < numSubspaces; s++) {
          if (skipRequested) break;
          buildPhase = {
            stage: 'pq',
            progress: 0.33 + ((s + 1) / numSubspaces) * 0.17,
            pq: {
              trainedSubspaces: s + 1,
              totalSubspaces: numSubspaces,
              compressionProgress: (s + 1) / numSubspaces
            }
          };
          saveSnapshot();
          await tick();
          await pauseOrSleep(180);
          if (skipRequested) break;
        }
      }

      // ═══ STAGE 3: HNSW Graph Construction ═══════════════════════════════════════
      if (!skipRequested) {
        buildPhase = { stage: 'hnsw', progress: 0.5 };
        await tick();

        const hnswGen = buildHNSWGraphAnimated([...points], numLayers, M, 0.5, 10);

        for (const state of hnswGen) {
          if (skipRequested) break;
          nodes = state.nodes;
          buildPhase = {
            stage: 'hnsw',
            progress: 0.5 + (state.insertedPoints / state.totalPoints) * 0.5,
            hnsw: state
          };
          saveSnapshot();
          await tick();
          await pauseOrSleep(60);
          if (skipRequested) break;
        }
      }

      // If skip was requested at any point, ensure full data
      if (skipRequested) {
        clusters = computeIVFPartitions([...points], numPartitions, 12);
        nodes = buildHNSWGraph([...points], numLayers, M, 0.5);
      }

    } catch (err) {
      console.error('Build error:', err);
      clusters = computeIVFPartitions([...points], numPartitions, 12);
      nodes = buildHNSWGraph([...points], numLayers, M, 0.5);
    }

    // ═══ COMPLETE ════════════════════════════════════════════════════════════════
    buildPhase = { stage: 'complete', progress: 1 };
    totalSteps = snapshots.length;
    currentStepNum = totalSteps;
    indexReady = true;
    isBuilding = false;
    isPaused = false;
    isPlaying = false;
    skipRequested = false;
  }

  function skipBuild() {
    skipRequested = true;
    // Immediately complete
    clusters = computeIVFPartitions([...points], numPartitions, 12);
    for (let i = 0; i < points.length; i++) {
      const nearest = clusters.reduce((best, c) => {
        const d = (points[i].x - c.centroid.x) ** 2 + (points[i].y - c.centroid.y) ** 2;
        return d < best.dist ? { id: c.id, dist: d } : best;
      }, { id: 0, dist: Infinity });
      points[i].clusterId = nearest.id;
    }
    points = [...points];
    nodes = buildHNSWGraph([...points], numLayers, M, 0.5);
    buildPhase = { stage: 'complete', progress: 1 };
    indexReady = true;
    isBuilding = false;
  }

  function rebuild() {
    generateRawPoints();
    buildIndex();
  }

  // ─── Search Animation ─────────────────────────────────────────────────────────
  
  async function runSearch() {
    if (!indexReady) return;
    isAnimating = true;
    isBuilding = true; // reuse build controls for search stepping
    snapshots = [];
    currentStepNum = 0;
    totalSteps = 5;
    
    queryState = {
      stage: 'idle',
      ivfCandidates: [],
      pqCompressed: false,
      hnswPath: [],
      exactResults: [],
      progress: 0,
      searchMetrics: metrics || calculateMetrics(points, clusters, ivfProbes, true)
    };

    // Update buildPhase to show search progress in the control panel
    buildPhase = { stage: 'complete', progress: 1 };
    
    const stages: QueryState['stage'][] = ['ivf', 'pq', 'hnsw', 'exact', 'complete'];
    
    for (let i = 0; i < stages.length; i++) {
      if (stages[i] === 'ivf') {
        const clusterDistances = clusters.map(c => ({
          id: c.id,
          dist: Math.sqrt((queryPoint.x - c.centroid.x) ** 2 + (queryPoint.y - c.centroid.y) ** 2)
        }));
        clusterDistances.sort((a, b) => a.dist - b.dist);
        const nearest = clusterDistances.slice(0, ivfProbes);
        
        const candidates = new Set<number>();
        for (const c of nearest) {
          const cluster = clusters.find(cl => cl.id === c.id);
          if (cluster) cluster.points.forEach(p => candidates.add(p));
        }
        
        queryState = { ...queryState!, stage: 'ivf', ivfCandidates: Array.from(candidates), progress: 0.25 };
        searchPath = searchHNSW(nodes, queryPoint, efSearch, numLayers);
        
      } else if (stages[i] === 'pq') {
        queryState = { ...queryState!, stage: 'pq', pqCompressed: true, progress: 0.5 };
        
      } else if (stages[i] === 'hnsw') {
        queryState = { ...queryState!, stage: 'hnsw', hnswPath: searchPath, progress: 0.75 };
        
      } else if (stages[i] === 'exact') {
        const candidatePoints: Array<{ id: number; dist: number }> = queryState!.ivfCandidates.map((pid: number) => {
          const pt = points[pid];
          return { id: pid, dist: pt ? Math.sqrt((queryPoint.x - pt.x) ** 2 + (queryPoint.y - pt.y) ** 2) : Infinity };
        });
        candidatePoints.sort((a, b) => a.dist - b.dist);
        queryState = { ...queryState!, stage: 'exact', exactResults: candidatePoints.slice(0, 10).map((p) => p.id), progress: 0.9 };
        
      } else if (stages[i] === 'complete') {
        const totalVectors: number = points.length;
        const ivfCandidates: number = queryState!.ivfCandidates.length;
        queryState = {
          ...queryState!,
          stage: 'complete',
          progress: 1,
          searchMetrics: {
            totalVectors,
            ivfCandidates,
            pqComparisons: ivfCandidates,
            hnswNodesVisited: searchPath.reduce((sum, p) => sum + p.nodeIds.length, 0),
            finalCandidates: 10,
            memoryOriginal: totalVectors * 128 * 4,
            memoryCompressed: totalVectors * numSubspaces,
            latency: Math.round(5 + Math.log2(totalVectors) * 0.5 + (ivfCandidates / totalVectors) * 10),
            recall: 0.95 + Math.random() * 0.04
          }
        };
        metrics = queryState!.searchMetrics;
      }

      saveSnapshot();
      await tick();
      await pauseOrSleep(700);
    }
    
    isAnimating = false;
    isBuilding = false;
    isPaused = false;
    isPlaying = false;
  }

  // ─── Random Query ────────────────────────────────────────────────────────────
  
  function randomQuery() {
    queryPoint = { x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.6 };
    if (queryState?.stage === 'complete') runSearch();
  }

  // ─── Reset ────────────────────────────────────────────────────────────────────
  
  function reset() {
    queryState = null;
    searchPath = [];
    metrics = null;
    generateRawPoints();
  }
</script>

<div id="app" class="min-w-[1200px]">
  <!-- Top Bar -->
  <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
    <div class="flex items-center gap-6 px-6 py-3">
      <div class="text-lg font-bold text-gray-800">
        <span class="text-[var(--hnsw-primary)]">HNSW</span> 
        <span class="text-sm font-normal text-gray-500">Explorer</span>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">Vectors</span>
          <input type="range" min="50" max="500" step="50" bind:value={numPoints} disabled={isBuilding} class="w-16" />
          <span class="mono w-8 text-center font-medium">{numPoints}</span>
        </label>

        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">Partitions</span>
          <input type="range" min="2" max="12" step="1" bind:value={numPartitions} disabled={isBuilding} class="w-16" />
          <span class="mono w-6 text-center font-medium">{numPartitions}</span>
        </label>

        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">Layers</span>
          <input type="range" min="2" max="5" step="1" bind:value={numLayers} disabled={isBuilding} class="w-16" />
          <span class="mono w-6 text-center font-medium">{numLayers}</span>
        </label>

        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">Probes</span>
          <input type="range" min="1" max="6" step="1" bind:value={ivfProbes} disabled={isBuilding} class="w-16" />
          <span class="mono w-6 text-center font-medium">{ivfProbes}</span>
        </label>
      </div>

      <div class="ml-auto flex items-center gap-2">
        {#if !indexReady && !isBuilding}
          <!-- Build button (primary) -->
          <button 
            onclick={buildIndex}
            class="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm animate-pulse"
          >
            Build Index
          </button>
          <button 
            disabled
            class="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
          >
            Run Search
          </button>
        {:else if isBuilding}
          <!-- Building... -->
          <button 
            disabled
            class="rounded-lg bg-indigo-400 px-4 py-1.5 text-xs font-semibold text-white opacity-70 cursor-wait"
          >
            Building...
          </button>
          <button 
            disabled
            class="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
          >
            Run Search
          </button>
        {:else}
          <!-- Index ready -->
          <button 
            onclick={randomQuery}
            class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Random Query
          </button>
          <button 
            onclick={rebuild}
            class="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Rebuild
          </button>
          <button 
            onclick={runSearch}
            disabled={isAnimating || !indexReady}
            class="rounded-lg bg-[var(--hnsw-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isAnimating ? 'Searching...' : 'Run Search'}
          </button>
        {/if}
      </div>
    </div>

    <!-- Rebuild warning banner -->
    {#if needsRebuild}
      <div class="flex items-center justify-center gap-3 bg-amber-50 border-t border-amber-200 px-4 py-2">
        <span class="text-xs text-amber-700">⚠ Parameters changed — index is stale</span>
        <button 
          onclick={rebuild}
          class="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Rebuild Index
        </button>
      </div>
    {/if}
  </header>

  <!-- Main Content -->
  <main class="p-6">
    <!-- Build Progress (always visible) -->
    <div class="mb-4">
      <BuildProgress 
        {buildPhase} 
        onSkip={skipBuild}
        {stepMode}
        {isPaused}
        {isPlaying}
        onToggleStepMode={toggleStepMode}
        onPlay={playbackPlay}
        onPause={playbackPause}
        onNextStep={playbackNext}
        onPrevStep={playbackPrev}
        onFastForward={playbackFastForward}
        canGoBack={currentStepNum > 1}
        canGoForward={isBuilding || isAnimating || currentStepNum < snapshots.length}
        {currentStepNum}
        {totalSteps}
      />
    </div>

    <!-- Query Info (only when index is ready) -->
    {#if indexReady}
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-gray-700">Query Vector Position</h2>
          <p class="text-xs text-gray-400">Click "Run Search" to execute the query pipeline</p>
        </div>
        <div class="mono text-sm">
          <span class="text-gray-500">Query:</span>
          <span class="ml-2 font-medium text-[var(--hnsw-query)]">
            ({queryPoint.x.toFixed(3)}, {queryPoint.y.toFixed(3)})
          </span>
        </div>
      </div>
    {/if}

    <!-- Pipeline Visualization -->
    <div class="grid grid-cols-4 gap-4">
      <!-- Panel 1: IVF -->
      <IVFView 
        {points} 
        {clusters} 
        {queryState}
        {buildPhase}
        showQuery={indexReady}
        width={280}
        height={260}
      />

      <!-- Panel 2: PQ -->
      <PQView 
        {points} 
        {queryState}
        {buildPhase}
        {numSubspaces}
        width={280}
        height={280}
      />

      <!-- Panel 3: HNSW -->
      <HNSWView 
        {nodes}
        {searchPath}
        {queryState}
        {buildPhase}
        {numLayers}
        width={280}
        height={260}
      />

      <!-- Panel 4: Metrics -->
      <MetricsPanel 
        {metrics}
        {buildPhase}
        stage={queryState?.stage || 'idle'}
      />
    </div>

    <!-- Stage Progress (search phase) -->
    {#if queryState && indexReady}
      <div class="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Search Pipeline Progress
        </h3>
        
        <div class="flex items-center gap-2">
          {#each ['idle', 'ivf', 'pq', 'hnsw', 'exact', 'complete'] as stage, i}
            <div class="flex flex-1 items-center">
              <div 
                class="flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-medium transition-all
                  {queryState.stage === stage || (queryState.stage === 'complete' && i === 5) ? 'bg-[var(--hnsw-primary)] text-white' : 
                   i < ['idle', 'ivf', 'pq', 'hnsw', 'exact', 'complete'].indexOf(queryState.stage) ? 'bg-green-100 text-green-700' : 
                   'bg-gray-50 text-gray-400'}"
              >
                {stage === 'ivf' ? 'IVF' : stage === 'pq' ? 'PQ' : stage === 'hnsw' ? 'HNSW' : stage === 'exact' ? 'Exact' : stage === 'complete' ? 'Done' : 'Ready'}
              </div>
              {#if i < 5}
                <div class="h-0.5 flex-1 bg-gray-200">
                  <div 
                    class="h-full bg-[var(--hnsw-primary)] transition-all"
                    style="width: {queryState.progress > (i + 1) / 6 ? '100%' : '0%'}"
                  ></div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="mt-3 text-center text-sm text-gray-600">
          {#if queryState.stage === 'idle'}
            Click "Run Search" to start the query journey
          {:else if queryState.stage === 'ivf'}
            Finding nearest {ivfProbes} partitions to narrow search space...
          {:else if queryState.stage === 'pq'}
            Compressing vectors with Product Quantization for fast comparison...
          {:else if queryState.stage === 'hnsw'}
            Navigating HNSW graph layers to find best candidates...
          {:else if queryState.stage === 'exact'}
            Computing exact distances to final candidates...
          {:else if queryState.stage === 'complete'}
            Search complete! Found {queryState.exactResults.length} nearest neighbors
          {/if}
        </div>
      </div>
    {/if}

    <!-- Explanation Section -->
    <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-5 text-lg font-semibold text-gray-800">
        IVF-PQ + HNSW Pipeline
      </h2>

      <!-- BUILD PHASE -->
      <div class="mb-6">
        <h3 class="mb-3 text-sm font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-2">
          <span class="inline-block w-5 h-5 rounded bg-indigo-100 text-center text-xs leading-5 font-bold text-indigo-600">B</span>
          Build Phase (offline, one-time)
        </h3>
        <div class="grid grid-cols-3 gap-5 text-sm">
          <div class="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
            <h4 class="font-semibold text-blue-700 mb-1">IVF: K-Means Clustering</h4>
            <p class="text-gray-600 text-xs mb-2">
              Partition N={numPoints} vectors into K={numPartitions} Voronoi cells using k-means.
              Each cell stores an inverted list of vector IDs.
            </p>
            <div class="text-[10px] font-mono text-gray-500 space-y-0.5">
              <div>⏱ Time: <span class="text-blue-600 font-semibold">O(N · K · iterations)</span></div>
              <div>💾 Memory: <span class="text-blue-600 font-semibold">O(K · d) centroids + O(N) lists</span></div>
            </div>
          </div>
          <div class="rounded-lg border border-green-100 bg-green-50/50 p-3">
            <h4 class="font-semibold text-green-700 mb-1">PQ: Codebook Training</h4>
            <p class="text-gray-600 text-xs mb-2">
              Split d=128 dimensions into M={numSubspaces} subspaces of {Math.round(128/numSubspaces)}d each.
              Train 256 centroids per subspace via k-means. Encode each vector as M bytes.
            </p>
            <div class="text-[10px] font-mono text-gray-500 space-y-0.5">
              <div>⏱ Time: <span class="text-green-600 font-semibold">O(N · 256 · M · iters)</span></div>
              <div>💾 Memory: <span class="text-green-600 font-semibold">O(M · 256 · d/M) + O(N · M)</span></div>
              <div>📉 Compression: 512B → {numSubspaces}B per vec ({Math.round(512/numSubspaces * numSubspaces / numSubspaces * 64)}×)</div>
            </div>
          </div>
          <div class="rounded-lg border border-purple-100 bg-purple-50/50 p-3">
            <h4 class="font-semibold text-purple-700 mb-1">HNSW: Graph Construction</h4>
            <p class="text-gray-600 text-xs mb-2">
              Insert each vector into a {numLayers}-layer navigable small-world graph.
              Each node connects to M={M} nearest neighbors. Higher layers are exponentially sparser.
            </p>
            <div class="text-[10px] font-mono text-gray-500 space-y-0.5">
              <div>⏱ Time: <span class="text-purple-600 font-semibold">O(N · log(N) · M)</span></div>
              <div>💾 Memory: <span class="text-purple-600 font-semibold">O(N · M · layers) edges</span></div>
              <div>🏚️ Layers: L ~ log(N), P(layer l) = e^(-l/mL)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SEARCH PHASE -->
      <div>
        <h3 class="mb-3 text-sm font-bold text-purple-700 uppercase tracking-wide flex items-center gap-2">
          <span class="inline-block w-5 h-5 rounded bg-purple-100 text-center text-xs leading-5 font-bold text-purple-600">Q</span>
          Query Phase (online, per query)
        </h3>
        <div class="grid grid-cols-4 gap-4 text-sm">
          <div class="rounded-lg border border-blue-100 bg-white p-3">
            <h4 class="font-semibold text-blue-600 mb-1 text-xs">1. IVF Probe</h4>
            <p class="text-gray-600 text-[11px] mb-2">
              Compute distance from query to {numPartitions} centroids.
              Select nprobe={ivfProbes} nearest partitions.
              Retrieve ~{Math.round(numPoints * ivfProbes / numPartitions)} candidate IDs.
            </p>
            <div class="text-[10px] font-mono text-gray-400">
              O(K + nprobe · |list|)
            </div>
          </div>
          <div class="rounded-lg border border-green-100 bg-white p-3">
            <h4 class="font-semibold text-green-600 mb-1 text-xs">2. PQ Distance</h4>
            <p class="text-gray-600 text-[11px] mb-2">
              Precompute distance table: query subvector → 256 centroids × {numSubspaces} subspaces.
              Approximate dist = sum of {numSubspaces} table lookups per candidate.
            </p>
            <div class="text-[10px] font-mono text-gray-400">
              O(256·M + candidates·M)
            </div>
          </div>
          <div class="rounded-lg border border-purple-100 bg-white p-3">
            <h4 class="font-semibold text-purple-600 mb-1 text-xs">3. HNSW Navigate</h4>
            <p class="text-gray-600 text-[11px] mb-2">
              Enter at top layer (sparse). Greedy search to nearest node.
              Descend layer-by-layer. Expand ef={efSearch} candidates at base.
            </p>
            <div class="text-[10px] font-mono text-gray-400">
              O(log(N) · ef)
            </div>
          </div>
          <div class="rounded-lg border border-orange-100 bg-white p-3">
            <h4 class="font-semibold text-orange-600 mb-1 text-xs">4. Exact Rerank</h4>
            <p class="text-gray-600 text-[11px] mb-2">
              Compute full-precision distance to top candidates.
              Return final top-K results with high recall (≥95%).
            </p>
            <div class="text-[10px] font-mono text-gray-400">
              O(candidates · d)
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>

<style>
  :global(input[type="range"]) {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: #E5E7EB;
    border-radius: 2px;
  }
  
  :global(input[type="range"])::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: var(--hnsw-primary);
    border-radius: 50%;
    cursor: pointer;
  }

  :global(input[type="range"]:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
