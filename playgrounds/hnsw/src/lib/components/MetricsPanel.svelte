<script lang="ts">
  import type { SearchMetrics, BuildPhase } from '$lib/hnsw';

  let { 
    metrics,
    buildPhase = { stage: 'idle', progress: 0 } as BuildPhase,
    stage = 'idle'
  }: { 
    metrics: SearchMetrics | null;
    buildPhase?: BuildPhase;
    stage?: string;
  } = $props();

  const stageLabels: Record<string, string> = {
    idle: 'Ready',
    ivf: 'Partitioning',
    pq: 'Compressing',
    hnsw: 'Navigating',
    exact: 'Reranking',
    complete: 'Complete'
  };

  const stageColors: Record<string, string> = {
    idle: 'text-gray-500',
    ivf: 'text-blue-500',
    pq: 'text-green-500',
    hnsw: 'text-purple-500',
    exact: 'text-orange-500',
    complete: 'text-green-600'
  };

  const buildLabels: Record<string, string> = {
    idle: 'Not Built',
    kmeans: 'Building IVF...',
    pq: 'Training PQ...',
    hnsw: 'Building Graph...',
    complete: 'Index Ready'
  };

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatNum(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
  <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
    4. Search Metrics
  </h3>

  <!-- Current Stage -->
  <div class="mb-4 rounded-lg bg-gray-50 p-3 text-center">
    {#if buildPhase.stage !== 'complete' && buildPhase.stage !== 'idle'}
      <!-- Show build status -->
      <div class="text-xs text-gray-400">Build Status</div>
      <div class="text-lg font-bold text-indigo-600">{buildLabels[buildPhase.stage]}</div>
      {#if buildPhase.hnsw}
        <div class="mt-1 text-xs text-gray-500 font-mono">
          {buildPhase.hnsw.insertedPoints}/{buildPhase.hnsw.totalPoints} nodes
        </div>
      {:else if buildPhase.kmeans}
        <div class="mt-1 text-xs text-gray-500 font-mono">
          iter {buildPhase.kmeans.iteration}/{buildPhase.kmeans.maxIterations}
        </div>
      {:else if buildPhase.pq}
        <div class="mt-1 text-xs text-gray-500 font-mono">
          {buildPhase.pq.trainedSubspaces}/{buildPhase.pq.totalSubspaces} subspaces
        </div>
      {/if}
    {:else if buildPhase.stage === 'idle'}
      <div class="text-xs text-gray-400">Status</div>
      <div class="text-lg font-bold text-gray-400">Not Built</div>
      <div class="text-xs text-gray-400 mt-1">Click "Build Index" to start</div>
    {:else}
      <div class="text-xs text-gray-400">Current Stage</div>
      <div class="text-lg font-bold {stageColors[stage]}">{stageLabels[stage] || 'Ready'}</div>
    {/if}
  </div>

  <!-- Metrics Grid -->
  {#if metrics}
    <div class="grid grid-cols-2 gap-3 text-xs">
      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">Total Vectors</div>
        <div class="mono text-base font-semibold text-gray-700">{formatNum(metrics.totalVectors)}</div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">IVF Candidates</div>
        <div class="mono text-base font-semibold text-blue-600">{formatNum(metrics.ivfCandidates)}</div>
        <div class="text-[10px] text-gray-400">
          {((metrics.ivfCandidates / metrics.totalVectors) * 100).toFixed(1)}% of total
        </div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">PQ Comparisons</div>
        <div class="mono text-base font-semibold text-green-600">{formatNum(metrics.pqComparisons)}</div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">HNSW Nodes</div>
        <div class="mono text-base font-semibold text-purple-600">{formatNum(metrics.hnswNodesVisited)}</div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">Original Memory</div>
        <div class="mono text-base font-semibold text-gray-700">{formatBytes(metrics.memoryOriginal)}</div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">Compressed Memory</div>
        <div class="mono text-base font-semibold text-green-600">{formatBytes(metrics.memoryCompressed)}</div>
        <div class="text-[10px] text-green-500">
          {((1 - metrics.memoryCompressed / metrics.memoryOriginal) * 100).toFixed(0)}% saved
        </div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">Latency</div>
        <div class="mono text-base font-semibold text-orange-600">{metrics.latency}ms</div>
      </div>

      <div class="rounded-lg border border-gray-100 p-2">
        <div class="text-gray-400">Recall</div>
        <div class="mono text-base font-semibold text-green-600">{(metrics.recall * 100).toFixed(1)}%</div>
      </div>
    </div>

    <!-- Funnel -->
    <div class="mt-4">
      <div class="text-xs text-gray-400 mb-2">Search Space Reduction</div>
      <div class="relative h-8 w-full overflow-hidden rounded-full bg-gray-100">
        <div class="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
          style="width: {Math.min(100, (metrics.ivfCandidates / metrics.totalVectors) * 100)}%"></div>
        <div class="absolute top-0 h-full bg-green-500 transition-all duration-500"
          style="left: {Math.min(100, (metrics.ivfCandidates / metrics.totalVectors) * 100)}%; width: {Math.min(100 - (metrics.ivfCandidates / metrics.totalVectors) * 100, ((metrics.pqComparisons) / metrics.totalVectors) * 100)}%"></div>
        <div class="absolute top-0 h-full bg-purple-500 transition-all duration-500"
          style="left: {Math.min(100, ((metrics.ivfCandidates + metrics.pqComparisons) / metrics.totalVectors) * 100)}%; width: {Math.min(100 - ((metrics.ivfCandidates + metrics.pqComparisons) / metrics.totalVectors) * 100, (metrics.hnswNodesVisited / metrics.totalVectors) * 100)}%"></div>
      </div>
      <div class="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>100%</span><span>IVF</span><span>PQ</span><span>HNSW</span><span>Final</span>
      </div>
    </div>
  {:else if buildPhase.stage === 'complete'}
    <div class="text-center text-sm text-gray-400 py-8">
      Run a search to see metrics
    </div>
  {:else}
    <div class="text-center text-sm text-gray-400 py-8">
      Build the index first
    </div>
  {/if}
</div>
