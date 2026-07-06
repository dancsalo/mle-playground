<script>
  import { arraySize, speed, isRunning, isPaused } from '../stores/sortStore.js';

  export let onStart = () => {};
  export let onPause = () => {};
  export let onReset = () => {};
  export let onStep = () => {};
</script>

<div class="controls">
  <div class="sliders">
    <label>
      Size: {$arraySize}
      <input type="range" min="5" max="100" bind:value={$arraySize} disabled={$isRunning} />
    </label>
    <label>
      Speed: {$speed}ms
      <input type="range" min="5" max="500" step="5" bind:value={$speed} />
    </label>
  </div>

  <div class="buttons">
    {#if !$isRunning}
      <button class="btn primary" on:click={onStart}>▶ Start</button>
    {:else if $isPaused}
      <button class="btn primary" on:click={onPause}>▶ Resume</button>
    {:else}
      <button class="btn warning" on:click={onPause}>⏸ Pause</button>
    {/if}
    <button class="btn" on:click={onStep} disabled={!$isPaused && $isRunning}>⏭ Step</button>
    <button class="btn danger" on:click={onReset}>↺ Reset</button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .sliders {
    display: flex;
    gap: 1.5rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e2e8f0;
    font-size: 0.85rem;
  }

  input[type="range"] {
    width: 120px;
    accent-color: #6366f1;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    background: #334155;
    color: #e2e8f0;
    transition: background 0.2s;
  }

  .btn:hover { background: #475569; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn.primary { background: #4f46e5; }
  .btn.primary:hover { background: #6366f1; }
  .btn.warning { background: #d97706; }
  .btn.warning:hover { background: #f59e0b; }
  .btn.danger { background: #dc2626; }
  .btn.danger:hover { background: #ef4444; }
</style>
