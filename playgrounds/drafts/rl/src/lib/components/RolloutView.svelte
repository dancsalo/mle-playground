<script lang="ts">
  import type { Rollout } from '$lib/rlhf';

  let { 
    rollouts, 
    algorithm,
    color = '#6366F1',
    showAdvantage = false,
    chosen = null,
    rejected = null
  }: {
    rollouts: Rollout[];
    algorithm: string;
    color?: string;
    showAdvantage?: boolean;
    chosen?: Rollout | null;
    rejected?: Rollout | null;
  } = $props();

  let hoveredRollout: number | null = $state(null);
  let hoveredToken: { rolloutIdx: number; tokenIdx: number } | null = $state(null);

  function rewardColor(reward: number): string {
    if (reward >= 0.7) return '#10B981';
    if (reward >= 0.4) return '#F59E0B';
    return '#EF4444';
  }

  function advantageColor(adv: number): string {
    if (adv > 0.3) return '#10B981';
    if (adv > 0) return '#86efac';
    if (adv > -0.3) return '#fca5a5';
    return '#EF4444';
  }

  function isChosen(rollout: Rollout): boolean {
    return chosen !== null && rollout.tokens.join(' ') === chosen.tokens.join(' ');
  }

  function isRejected(rollout: Rollout): boolean {
    return rejected !== null && rollout.tokens.join(' ') === rejected.tokens.join(' ');
  }
</script>

<div class="space-y-1.5">
  {#each rollouts as rollout, i}
    {@const isC = isChosen(rollout)}
    {@const isR = isRejected(rollout)}
    <div 
      class="group relative rounded-lg border p-2 transition-all duration-200"
      class:border-green-300={isC}
      class:bg-green-50={isC}
      class:border-red-300={isR}
      class:bg-red-50={isR}
      class:border-gray-150={!isC && !isR}
      class:hover:border-indigo-200={!isC && !isR}
      onmouseenter={() => hoveredRollout = i}
      onmouseleave={() => hoveredRollout = null}
    >
      <!-- Reward badge -->
      <div class="mb-1 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          {#if isC}
            <span class="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">CHOSEN</span>
          {/if}
          {#if isR}
            <span class="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">REJECTED</span>
          {/if}
          <span class="text-[10px] text-gray-400">#{i + 1}</span>
        </div>
        <div class="flex items-center gap-2">
          {#if showAdvantage && rollout.advantage !== undefined}
            <span 
              class="mono rounded px-1.5 py-0.5 text-[9px] font-semibold"
              style="color: {advantageColor(rollout.advantage)}; background: {advantageColor(rollout.advantage)}15"
            >
              adv: {rollout.advantage > 0 ? '+' : ''}{rollout.advantage.toFixed(2)}
            </span>
          {/if}
          <span 
            class="mono rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style="background-color: {rewardColor(rollout.reward)}"
          >
            r={rollout.reward.toFixed(2)}
          </span>
        </div>
      </div>

      <!-- Tokens -->
      <div class="flex flex-wrap gap-0.5">
        {#each rollout.tokens as token, j}
          <span 
            class="token-highlight mono cursor-default rounded px-1.5 py-0.5 text-[11px]"
            class:bg-indigo-100={hoveredToken?.rolloutIdx === i && hoveredToken?.tokenIdx === j}
            onmouseenter={() => hoveredToken = { rolloutIdx: i, tokenIdx: j }}
            onmouseleave={() => hoveredToken = null}
          >
            {token}
          </span>
        {/each}
      </div>

      <!-- Token tooltip -->
      {#if hoveredToken && hoveredToken.rolloutIdx === i}
        <div class="mono mt-1 border-t border-gray-100 pt-1 text-[9px] text-gray-500">
          P({rollout.tokens[hoveredToken.tokenIdx]}) = {Math.exp(rollout.logProbs[hoveredToken.tokenIdx]).toFixed(4)}
          | logP = {rollout.logProbs[hoveredToken.tokenIdx].toFixed(3)}
        </div>
      {/if}
    </div>
  {/each}
</div>
