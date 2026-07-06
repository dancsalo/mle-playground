<script lang="ts">
  import type { Rollout } from '$lib/rlhf';

  let {
    rollouts,
    ppoConfig
  }: {
    rollouts: Rollout[];
    ppoConfig: { clipEpsilon: number; klPenalty: number; entropyBonus: number };
  } = $props();

  // Compute which rollouts are clipped (simplified visualization)
  let avgReward = $derived(rollouts.reduce((s, r) => s + r.reward, 0) / rollouts.length);
  
  function isClipped(rollout: Rollout): boolean {
    const advantage = rollout.reward - avgReward;
    return Math.abs(advantage) > ppoConfig.clipEpsilon * 2;
  }
</script>

<div class="space-y-3">
  <!-- Force diagram: Reward vs KL -->
  <div class="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
    <div class="mb-2 text-[10px] font-semibold uppercase text-amber-700">Optimization Forces</div>
    <div class="space-y-2">
      <!-- Reward force -->
      <div class="flex items-center gap-2">
        <span class="w-20 text-[10px] text-gray-600">Reward →</span>
        <div class="relative h-4 flex-1 rounded bg-gray-100">
          <div 
            class="absolute left-0 top-0 h-4 rounded bg-green-400 transition-all"
            style="width: {Math.min(avgReward * 100, 100)}%"
          ></div>
        </div>
        <span class="mono w-10 text-right text-[10px] text-green-700">+{avgReward.toFixed(2)}</span>
      </div>

      <!-- KL penalty -->
      <div class="flex items-center gap-2">
        <span class="w-20 text-[10px] text-gray-600">← KL pen.</span>
        <div class="relative h-4 flex-1 rounded bg-gray-100">
          <div 
            class="absolute right-0 top-0 h-4 rounded bg-red-400 transition-all"
            style="width: {Math.min(ppoConfig.klPenalty * 200, 100)}%"
          ></div>
        </div>
        <span class="mono w-10 text-right text-[10px] text-red-700">-{ppoConfig.klPenalty.toFixed(2)}</span>
      </div>

      <!-- Entropy bonus -->
      <div class="flex items-center gap-2">
        <span class="w-20 text-[10px] text-gray-600">Entropy →</span>
        <div class="relative h-4 flex-1 rounded bg-gray-100">
          <div 
            class="absolute left-0 top-0 h-4 rounded bg-blue-300 transition-all"
            style="width: {Math.min(ppoConfig.entropyBonus * 500, 100)}%"
          ></div>
        </div>
        <span class="mono w-10 text-right text-[10px] text-blue-600">+{ppoConfig.entropyBonus.toFixed(3)}</span>
      </div>
    </div>
  </div>

  <!-- Clip visualization -->
  <div>
    <div class="mb-1.5 text-[10px] font-semibold uppercase text-gray-500">
      Clipping (ε = {ppoConfig.clipEpsilon})
    </div>
    <div class="space-y-1">
      {#each rollouts as rollout, i}
        {@const advantage = rollout.reward - avgReward}
        {@const clipped = isClipped(rollout)}
        <div class="flex items-center gap-2 text-[10px]">
          <span class="mono w-4 text-gray-400">#{i+1}</span>
          <div class="relative h-3 flex-1 rounded bg-gray-100">
            <!-- Clip bounds -->
            <div 
              class="absolute top-0 h-3 border-l border-r border-dashed border-gray-400"
              style="left: {(0.5 - ppoConfig.clipEpsilon) * 100}%; right: {(0.5 - ppoConfig.clipEpsilon) * 100}%"
            ></div>
            <!-- Advantage indicator -->
            <div 
              class="absolute top-0 h-3 w-1.5 rounded transition-all"
              class:bg-green-500={!clipped && advantage > 0}
              class:bg-red-400={!clipped && advantage < 0}
              class:bg-red-600={clipped}
              style="left: {Math.max(0, Math.min(95, (advantage + 1) * 50))}%"
            ></div>
          </div>
          {#if clipped}
            <span class="rounded bg-red-100 px-1 py-0.5 text-[8px] font-bold text-red-600">CLIPPED</span>
          {:else}
            <span class="rounded bg-green-100 px-1 py-0.5 text-[8px] text-green-600">OK</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
