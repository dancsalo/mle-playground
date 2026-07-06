<script lang="ts">
  import type { GCNWeights } from '$lib/gcn';

  let {
    weights,
    epoch = 0
  }: {
    weights: GCNWeights;
    epoch?: number;
  } = $props();

  function weightColor(v: number): string {
    const abs = Math.min(Math.abs(v), 1);
    if (v > 0) return `rgba(59, 130, 246, ${abs})`;
    return `rgba(239, 68, 68, ${abs})`;
  }

  let showLayer = $state<1 | 2>(1);
  let displayWeights = $derived(showLayer === 1 ? weights.W1 : weights.W2);
  let displayBias = $derived(showLayer === 1 ? weights.b1 : weights.b2);
</script>

<div class="rounded-lg border border-purple-200 bg-purple-50/30 p-3">
  <div class="mb-2 flex items-center gap-2">
    <div class="h-2 w-2 rounded-full bg-purple-500"></div>
    <span class="text-[10px] font-bold uppercase text-purple-700">
      Learned Weights
    </span>
    <div class="ml-auto flex gap-1">
      <button
        class="rounded px-1.5 py-0.5 text-[8px] font-medium transition-colors"
        class:bg-purple-500={showLayer === 1}
        class:text-white={showLayer === 1}
        class:bg-purple-100={showLayer !== 1}
        class:text-purple-700={showLayer !== 1}
        onclick={() => showLayer = 1}
      >W¹ ({weights.W1.length}×{weights.W1[0].length})</button>
      <button
        class="rounded px-1.5 py-0.5 text-[8px] font-medium transition-colors"
        class:bg-purple-500={showLayer === 2}
        class:text-white={showLayer === 2}
        class:bg-purple-100={showLayer !== 2}
        class:text-purple-700={showLayer !== 2}
        onclick={() => showLayer = 2}
      >W² ({weights.W2.length}×{weights.W2[0].length})</button>
    </div>
  </div>

  <!-- Weight matrix heatmap -->
  <div class="overflow-x-auto">
    <div class="inline-flex flex-col gap-px">
      {#each displayWeights as row, i}
        <div class="flex gap-px">
          {#each row as val}
            <div
              class="feature-cell h-4 w-4 rounded-sm"
              style="background-color: {weightColor(val)}"
              title={val.toFixed(4)}
            ></div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Bias -->
  <div class="mt-2 flex items-center gap-1">
    <span class="text-[8px] text-gray-500">bias:</span>
    <div class="flex gap-px">
      {#each displayBias as val}
        <div
          class="flex h-4 w-7 items-center justify-center rounded-sm text-[7px]"
          style="background-color: {weightColor(val)}; color: {Math.abs(val) > 0.4 ? 'white' : '#374151'}"
        >
          {val.toFixed(2)}
        </div>
      {/each}
    </div>
  </div>

  <div class="mt-1 flex items-center justify-between text-[8px] text-gray-400">
    <span>
      <span class="inline-block h-2 w-2 rounded-sm" style="background: rgba(59,130,246,0.7)"></span> positive
      <span class="ml-1 inline-block h-2 w-2 rounded-sm" style="background: rgba(239,68,68,0.7)"></span> negative
    </span>
    <span class="mono">epoch {epoch}</span>
  </div>
</div>
