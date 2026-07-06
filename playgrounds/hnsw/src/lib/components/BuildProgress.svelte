<script lang="ts">
  import type { BuildPhase } from '$lib/hnsw';

  let { 
    buildPhase,
    onSkip,
    // Playback controls
    stepMode = false,
    isPaused = false,
    isPlaying = false,
    onToggleStepMode = () => {},
    onPlay = () => {},
    onPause = () => {},
    onNextStep = () => {},
    onPrevStep = () => {},
    onFastForward = () => {},
    canGoBack = false,
    canGoForward = true,
    currentStepNum = 0,
    totalSteps = 0
  }: { 
    buildPhase: BuildPhase;
    onSkip: () => void;
    stepMode?: boolean;
    isPaused?: boolean;
    isPlaying?: boolean;
    onToggleStepMode?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onNextStep?: () => void;
    onPrevStep?: () => void;
    onFastForward?: () => void;
    canGoBack?: boolean;
    canGoForward?: boolean;
    currentStepNum?: number;
    totalSteps?: number;
  } = $props();

  const stageNames: Record<string, string> = {
    idle: 'Ready to Build',
    kmeans: 'IVF: K-Means Clustering',
    pq: 'PQ: Codebook Training',
    hnsw: 'HNSW: Graph Construction',
    complete: 'Index Built!'
  };

  const stageDescriptions: Record<string, string> = {
    idle: 'Click "Build Index" to start constructing the search index',
    kmeans: 'Running k-means to partition vectors into clusters...',
    pq: 'Training product quantization codebooks for compression...',
    hnsw: 'Inserting nodes and connecting nearest neighbors...',
    complete: 'Index ready — you can now run queries!'
  };

  function getDetailText(): string {
    if (buildPhase.stage === 'kmeans' && buildPhase.kmeans) {
      const k = buildPhase.kmeans;
      return `Iteration ${k.iteration}/${k.maxIterations}${k.converged ? ' (converged!)' : ''}`;
    }
    if (buildPhase.stage === 'pq' && buildPhase.pq) {
      return `Subspace ${buildPhase.pq.trainedSubspaces}/${buildPhase.pq.totalSubspaces}`;
    }
    if (buildPhase.stage === 'hnsw' && buildPhase.hnsw) {
      const h = buildPhase.hnsw;
      return `Nodes: ${h.insertedPoints}/${h.totalPoints} • Edges: ${h.edgeCount} • Layers: ${h.currentLayer + 1}`;
    }
    return '';
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4">
  <!-- Header row -->
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
      Index Construction
    </h3>
    <div class="flex items-center gap-3">
      <!-- Step-by-step toggle -->
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <span class="text-[10px] font-medium text-gray-500">Step-by-step</span>
        <button 
          onclick={onToggleStepMode}
          class="relative w-7 h-3.5 rounded-full transition-colors {stepMode ? 'bg-indigo-500' : 'bg-gray-300'}"
          aria-label="Toggle step mode"
        >
          <span class="absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform
            {stepMode ? 'translate-x-3.5' : ''}" />
        </button>
      </label>
      <!-- Skip -->
      {#if buildPhase.stage !== 'idle' && buildPhase.stage !== 'complete'}
        <button 
          onclick={onSkip}
          class="text-[10px] text-gray-400 hover:text-gray-600 underline"
        >
          Skip →
        </button>
      {/if}
    </div>
  </div>

  <!-- Progress bar -->
  <div class="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100 mb-2">
    <div 
      class="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out
        {buildPhase.stage === 'complete' ? 'bg-green-500' : 'bg-indigo-500'}"
      style="width: {buildPhase.progress * 100}%"
    ></div>
  </div>

  <!-- Stage indicators -->
  <div class="flex items-center gap-1 mb-2">
    {#each ['kmeans', 'pq', 'hnsw'] as stage, i}
      {@const stageIdx = ['kmeans', 'pq', 'hnsw'].indexOf(buildPhase.stage)}
      {@const isActive = buildPhase.stage === stage}
      {@const isDone = stageIdx > i || buildPhase.stage === 'complete'}
      <div class="flex flex-1 items-center">
        <div 
          class="flex h-6 flex-1 items-center justify-center rounded-md text-[10px] font-semibold transition-all
            {isActive ? 'bg-indigo-500 text-white shadow-sm' : 
             isDone ? 'bg-green-100 text-green-700' : 
             'bg-gray-50 text-gray-400'}"
        >
          {stage === 'kmeans' ? 'K-Means' : stage === 'pq' ? 'PQ Train' : 'HNSW Build'}
        </div>
        {#if i < 2}
          <div class="h-0.5 w-2 {isDone ? 'bg-green-300' : 'bg-gray-200'}"></div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Description + detail -->
  <div class="text-center mb-2">
    <div class="text-xs font-medium text-gray-700">
      {stageNames[buildPhase.stage]}
    </div>
    {#if getDetailText()}
      <div class="text-[10px] font-mono text-indigo-600 mt-0.5">
        {getDetailText()}
      </div>
    {/if}
  </div>

  <!-- ═══ Playback Controls (shown when step mode is on OR building) ═══ -->
  {#if stepMode && (buildPhase.stage !== 'idle' || isPaused || isPlaying)}
    <div class="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
      <!-- Prev -->
      <button 
        onclick={onPrevStep} 
        disabled={!canGoBack}
        class="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous step"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
      </button>

      <!-- Play / Pause -->
      {#if isPaused || !isPlaying}
        <button 
          onclick={onPlay}
          disabled={!canGoForward}
          class="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
          title="Play"
        >
          <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
        </button>
      {:else}
        <button 
          onclick={onPause}
          class="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm transition-colors"
          title="Pause"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.5 3a1.5 1.5 0 00-1.5 1.5v11a1.5 1.5 0 003 0v-11A1.5 1.5 0 005.5 3zm9 0a1.5 1.5 0 00-1.5 1.5v11a1.5 1.5 0 003 0v-11A1.5 1.5 0 0014.5 3z" clip-rule="evenodd"/></svg>
        </button>
      {/if}

      <!-- Next -->
      <button 
        onclick={onNextStep} 
        disabled={!canGoForward}
        class="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Next step"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
      </button>

      <!-- Fast-forward (skip to end) -->
      <button 
        onclick={onFastForward}
        disabled={!canGoForward}
        class="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Fast-forward to end"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z"/></svg>
      </button>

      <!-- Step counter -->
      {#if totalSteps > 0}
        <span class="ml-2 text-[10px] font-mono text-gray-400">
          {currentStepNum}/{totalSteps}
        </span>
      {/if}
    </div>
  {/if}
</div>
