<script>
  import BarChart from './components/BarChart.svelte';
  import Controls from './components/Controls.svelte';
  import AlgorithmSelector from './components/AlgorithmSelector.svelte';
  import InfoPanel from './components/InfoPanel.svelte';
  import AlgorithmDescription from './components/AlgorithmDescription.svelte';
  import {
    arraySize, speed, isRunning, isPaused,
    comparisons, swaps, currentStep,
    arrayState, highlights,
    generateArray, resetStats
  } from './stores/sortStore.js';
  import { algorithms } from './algorithms/index.js';
  import { selectedAlgorithm } from './stores/sortStore.js';
  import { onMount } from 'svelte';

  let generator = null;
  let animationTimer = null;

  onMount(() => {
    generateArray($arraySize);
  });

  // Regenerate array when size changes
  $: if ($arraySize) {
    if (!$isRunning) generateArray($arraySize);
  }

  function handleAlgorithmChange() {
    handleReset();
  }

  function handleStart() {
    if ($isRunning && !$isPaused) return;

    if (!$isRunning) {
      const algo = algorithms[$selectedAlgorithm];
      generator = algo.fn($arrayState);
      resetStats();
      $isRunning = true;
      $isPaused = false;
    } else {
      $isPaused = false;
    }

    runAnimation();
  }

  function runAnimation() {
    if (animationTimer) clearInterval(animationTimer);
    animationTimer = setInterval(() => {
      if ($isPaused) {
        clearInterval(animationTimer);
        return;
      }
      advanceStep();
    }, $speed);
  }

  // Update interval when speed changes
  $: if ($isRunning && !$isPaused && animationTimer) {
    clearInterval(animationTimer);
    animationTimer = setInterval(() => {
      if ($isPaused) { clearInterval(animationTimer); return; }
      advanceStep();
    }, $speed);
  }

  function advanceStep() {
    if (!generator) return;
    const { value, done } = generator.next();

    if (done || !value) {
      $isRunning = false;
      $isPaused = false;
      $highlights = { comparing: [], swapping: [], sorted: Array.from({ length: $arrayState.length }, (_, i) => i), pivot: null, active: [] };
      if (animationTimer) clearInterval(animationTimer);
      return;
    }

    $currentStep++;

    if (value.type === 'compare') $comparisons++;
    if (value.type === 'swap') $swaps++;

    $arrayState = value.array;
    $highlights = {
      comparing: value.type === 'compare' ? value.indices : [],
      swapping: value.type === 'swap' ? value.indices : [],
      sorted: value.sorted || [],
      pivot: value.pivot ?? null,
      active: value.active || [],
    };

    if (value.type === 'done') {
      $isRunning = false;
      $isPaused = false;
      $highlights = { comparing: [], swapping: [], sorted: value.sorted, pivot: null, active: [] };
      if (animationTimer) clearInterval(animationTimer);
    }
  }

  function handlePause() {
    $isPaused = !$isPaused;
    if (!$isPaused) runAnimation();
  }

  function handleStep() {
    if (!$isRunning) {
      handleStart();
      $isPaused = true;
      if (animationTimer) clearInterval(animationTimer);
    }
    advanceStep();
  }

  function handleReset() {
    if (animationTimer) clearInterval(animationTimer);
    $isRunning = false;
    $isPaused = false;
    generator = null;
    generateArray($arraySize);
  }
</script>

<main>
  <header>
    <h1>🔀 Sort Explorer</h1>
    <p class="subtitle">Interactive sorting algorithm visualizer</p>
  </header>

  <section class="selector">
    <AlgorithmSelector onChange={handleAlgorithmChange} />
  </section>

  <section class="visualization">
    <BarChart />
  </section>

  <section class="controls">
    <Controls
      onStart={handleStart}
      onPause={handlePause}
      onReset={handleReset}
      onStep={handleStep}
    />
  </section>

  <section class="info">
    <InfoPanel />
  </section>

  <section class="description">
    <AlgorithmDescription />
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  header {
    text-align: center;
  }

  h1 {
    color: #e2e8f0;
    margin: 0;
    font-size: 2rem;
  }

  .subtitle {
    color: #64748b;
    margin: 0.25rem 0 0;
    font-size: 1rem;
  }

  section {
    width: 100%;
  }
</style>
