<script lang="ts">
  import type { TrainingStep } from '$lib/rlhf';

  let {
    history,
    algorithm,
    color = '#6366F1'
  }: {
    history: TrainingStep[];
    algorithm: string;
    color?: string;
  } = $props();

  let expanded = $state(false);

  function rewardDelta(step: TrainingStep, prev: TrainingStep | null): string {
    if (!prev) return '—';
    const d = step.avgReward - prev.avgReward;
    return d > 0 ? `+${d.toFixed(3)}` : d.toFixed(3);
  }
</script>

<div class="rounded-lg border border-gray-100 bg-white">
  <button 
    class="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
    onclick={() => expanded = !expanded}
  >
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
      {algorithm} Step History ({history.length} steps)
    </span>
    <span class="text-xs text-gray-400">{expanded ? '▼' : '▶'}</span>
  </button>
  
  {#if expanded && history.length > 0}
    <div class="max-h-60 overflow-y-auto border-t border-gray-100 p-2">
      <table class="w-full text-[10px]">
        <thead>
          <tr class="border-b border-gray-100 text-gray-400">
            <th class="p-1 text-left font-medium">Step</th>
            <th class="p-1 text-right font-medium">Reward</th>
            <th class="p-1 text-right font-medium">Δ Reward</th>
            <th class="p-1 text-right font-medium">KL</th>
            <th class="p-1 text-right font-medium">Entropy</th>
            <th class="p-1 text-left font-medium">Best</th>
          </tr>
        </thead>
        <tbody>
          {#each history as step, i}
            {@const prev = i > 0 ? history[i-1] : null}
            {@const bestRollout = [...step.rollouts].sort((a, b) => b.reward - a.reward)[0]}
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="mono p-1 font-medium" style="color: {color}">{step.stepNumber}</td>
              <td class="mono p-1 text-right">{step.avgReward.toFixed(3)}</td>
              <td class="mono p-1 text-right" class:text-green-600={prev && step.avgReward > prev.avgReward} class:text-red-500={prev && step.avgReward < prev.avgReward}>
                {rewardDelta(step, prev)}
              </td>
              <td class="mono p-1 text-right">{step.klDivergence.toFixed(4)}</td>
              <td class="mono p-1 text-right">{step.entropy.toFixed(3)}</td>
              <td class="mono max-w-[120px] truncate p-1 text-gray-600">
                {bestRollout?.tokens.join(' ')}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if expanded}
    <div class="p-3 text-center text-[10px] text-gray-400">No steps yet</div>
  {/if}
</div>
