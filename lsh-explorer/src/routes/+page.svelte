<script lang="ts">
  import { runPipeline, sCurveData, sCurve, type PipelineResult } from '$lib/lsh';
  import ShingleView from '$lib/components/ShingleView.svelte';
  import MinhashView from '$lib/components/MinhashView.svelte';
  import BandingView from '$lib/components/BandingView.svelte';
  import CandidateView from '$lib/components/CandidateView.svelte';
  import SCurveChart from '$lib/components/SCurveChart.svelte';
  import Article from '$lib/components/Article.svelte';

  let texts = $state([
    'The cat sat on the mat',
    'The cat sat on a mat',
    'Dogs run in the park',
    'The cat plays on the mat'
  ]);

  let k = $state(3);
  let signatureLength = $state(20);
  let numBands = $state(5);

  let rowsPerBand = $derived(Math.floor(signatureLength / numBands));
  let pipeline = $derived(runPipeline(texts, k, signatureLength, numBands));

  let hoveredShingle: string | null = $state(null);
  let expandedStage: string | null = $state(null);

  function toggleStage(stage: string) {
    expandedStage = expandedStage === stage ? null : stage;
  }
</script>

<div id="app" class="min-w-[1100px]">
  <!-- Top Bar -->
  <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
    <div class="flex items-center gap-6 px-8 py-3">
      <div class="text-lg font-bold text-gray-800">
        <span class="text-[var(--lsh-primary)]">LSH</span> E<span class="text-sm">XPLAINER</span>
      </div>

      <div class="flex items-center gap-6 text-sm">
        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">k (shingle size)</span>
          <input type="range" min="2" max="5" bind:value={k} class="w-20" />
          <span class="mono w-4 text-center font-medium">{k}</span>
        </label>

        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">Signature length</span>
          <input type="range" min="10" max="100" step="5" bind:value={signatureLength} class="w-24" />
          <span class="mono w-6 text-center font-medium">{signatureLength}</span>
        </label>

        <label class="flex items-center gap-2">
          <span class="font-medium text-gray-600">Bands (b)</span>
          <input type="range" min="1" max={signatureLength} step="1" bind:value={numBands} class="w-24" />
          <span class="mono w-4 text-center font-medium">{numBands}</span>
        </label>

        <div class="text-xs text-gray-500">
          r = {rowsPerBand} rows/band
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="px-8 py-6">
    <!-- Input Sentences -->
    <section class="mb-6">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Input Documents</h2>
      <div class="grid grid-cols-2 gap-3">
        {#each texts as text, i}
          <div class="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style="background-color: {pipeline.documents[i]?.color}"
            >
              {pipeline.documents[i]?.label}
            </span>
            <input
              type="text"
              bind:value={texts[i]}
              class="mono w-full border-none bg-transparent text-sm outline-none"
            />
          </div>
        {/each}
      </div>
    </section>

    <!-- Pipeline Stages -->
    <div class="grid grid-cols-4 gap-4">
      <!-- Stage 1: Shingles -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          onclick={() => toggleStage('shingles')}
          class="mb-3 flex w-full items-center justify-between text-left"
        >
          <h3 class="text-sm font-semibold text-gray-700">1. k-Shingling</h3>
          <span class="text-xs text-gray-400">{expandedStage === 'shingles' ? '▼' : '▶'}</span>
        </button>
        <ShingleView
          documents={pipeline.documents}
          {k}
          bind:hoveredShingle
          expanded={expandedStage === 'shingles'}
        />
      </div>

      <!-- Stage 2: MinHash -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          onclick={() => toggleStage('minhash')}
          class="mb-3 flex w-full items-center justify-between text-left"
        >
          <h3 class="text-sm font-semibold text-gray-700">2. MinHash Signatures</h3>
          <span class="text-xs text-gray-400">{expandedStage === 'minhash' ? '▼' : '▶'}</span>
        </button>
        <MinhashView
          documents={pipeline.documents}
          vocab={pipeline.vocab}
          expanded={expandedStage === 'minhash'}
        />
      </div>

      <!-- Stage 3: Banding -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          onclick={() => toggleStage('banding')}
          class="mb-3 flex w-full items-center justify-between text-left"
        >
          <h3 class="text-sm font-semibold text-gray-700">3. Banding + Buckets</h3>
          <span class="text-xs text-gray-400">{expandedStage === 'banding' ? '▼' : '▶'}</span>
        </button>
        <BandingView
          documents={pipeline.documents}
          {numBands}
          expanded={expandedStage === 'banding'}
        />
      </div>

      <!-- Stage 4: Candidates -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          onclick={() => toggleStage('candidates')}
          class="mb-3 flex w-full items-center justify-between text-left"
        >
          <h3 class="text-sm font-semibold text-gray-700">4. Candidate Pairs</h3>
          <span class="text-xs text-gray-400">{expandedStage === 'candidates' ? '▼' : '▶'}</span>
        </button>
        <CandidateView
          documents={pipeline.documents}
          candidatePairs={pipeline.candidatePairs}
          pairSimilarities={pipeline.pairSimilarities}
          expanded={expandedStage === 'candidates'}
        />
      </div>
    </div>

    <!-- S-Curve -->
    <section class="mt-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        S-Curve: P(candidate) = 1 − (1 − s<sup>r</sup>)<sup>b</sup>
        <span class="ml-2 font-normal normal-case text-gray-400">b={numBands}, r={rowsPerBand}</span>
      </h2>
      <SCurveChart
        {numBands}
        {rowsPerBand}
        pairSimilarities={pipeline.pairSimilarities}
        documents={pipeline.documents}
      />
    </section>

    <!-- Article -->
    <Article />
  </main>
</div>
