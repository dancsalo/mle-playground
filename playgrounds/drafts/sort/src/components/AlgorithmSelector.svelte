<script>
  import { selectedAlgorithm } from '../stores/sortStore.js';
  import { algorithms } from '../algorithms/index.js';

  export let onChange = () => {};

  const algoKeys = Object.keys(algorithms);

  function handleChange(e) {
    $selectedAlgorithm = e.target.value;
    onChange();
  }
</script>

<div class="controls-row">
  <label>
    Algorithm:
    <select value={$selectedAlgorithm} on:change={handleChange}>
      {#each algoKeys as key}
        <option value={key}>{algorithms[key].name}</option>
      {/each}
    </select>
  </label>
</div>

<style>
  .controls-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e2e8f0;
    font-size: 0.9rem;
  }

  select {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: 1px solid #4338ca;
    background: #1e1b4b;
    color: #e2e8f0;
    font-size: 0.9rem;
  }
</style>
