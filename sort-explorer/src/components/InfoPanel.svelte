<script>
  import { comparisons, swaps, currentStep, selectedAlgorithm } from '../stores/sortStore.js';
  import { algorithms } from '../algorithms/index.js';

  $: algo = algorithms[$selectedAlgorithm];
</script>

<div class="info-panel">
  <div class="stats">
    <div class="stat">
      <span class="label">Comparisons</span>
      <span class="value">{$comparisons}</span>
    </div>
    <div class="stat">
      <span class="label">Swaps</span>
      <span class="value">{$swaps}</span>
    </div>
    <div class="stat">
      <span class="label">Steps</span>
      <span class="value">{$currentStep}</span>
    </div>
  </div>

  <div class="complexity">
    <h3>{algo.name}</h3>
    <table>
      <tr><td>Best</td><td class="mono">{algo.best}</td></tr>
      <tr><td>Average</td><td class="mono">{algo.avg}</td></tr>
      <tr><td>Worst</td><td class="mono">{algo.worst}</td></tr>
      <tr><td>Space</td><td class="mono">{algo.space}</td></tr>
      <tr><td>Stable</td><td>{algo.stable ? '✅ Yes' : '❌ No'}</td></tr>
    </table>
  </div>

  <div class="legend">
    <div class="legend-item"><span class="swatch" style="background:#6366f1"></span> Default</div>
    <div class="legend-item"><span class="swatch" style="background:#fbbf24"></span> Comparing</div>
    <div class="legend-item"><span class="swatch" style="background:#f87171"></span> Swapping</div>
    <div class="legend-item"><span class="swatch" style="background:#a78bfa"></span> Pivot</div>
    <div class="legend-item"><span class="swatch" style="background:#60a5fa"></span> Active</div>
    <div class="legend-item"><span class="swatch" style="background:#4ade80"></span> Sorted</div>
  </div>
</div>

<style>
  .info-panel {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .stats {
    display: flex;
    gap: 1.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat .label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .stat .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #e2e8f0;
    font-family: monospace;
  }

  .complexity h3 {
    margin: 0 0 0.5rem;
    color: #e2e8f0;
    font-size: 1rem;
  }

  table {
    font-size: 0.8rem;
    color: #cbd5e1;
  }

  td {
    padding: 0.15rem 0.75rem 0.15rem 0;
  }

  .mono {
    font-family: monospace;
    color: #a78bfa;
  }

  .legend {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: #cbd5e1;
  }

  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    display: inline-block;
  }
</style>
