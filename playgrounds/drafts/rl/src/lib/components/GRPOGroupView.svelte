<script lang="ts">
  import type { Rollout } from '$lib/rlhf';

  let {
    rollouts,
    groupAdvantages
  }: {
    rollouts: Rollout[];
    groupAdvantages: number[];
  } = $props();

  function barWidth(reward: number): string {
    return `${Math.max(reward * 100, 2)}%`;
  }

  function advantageColor(adv: number): string {
    if (adv > 0.3) return '#10B981';
    if (adv > 0) return '#6ee7b7';
    if (adv > -0.3) return '#fca5a5';
    return '#EF4444';
  }

  function advantageBg(adv: number): string {
    if (adv > 0) return 'rgba(16, 185, 129, 0.08)';
    return 'rgba(239, 68, 68, 0.08)';
  }
</script>

<div class="space-y-1">
  <div class="mb-2 grid grid-cols-[1fr_60px_80px_60px] gap-1 text-[9px] font-semibold uppercase text-gray-400">
    <span>Sample</span>
    <span class="text-center">Reward</span>
    <span class="text-center">Relative Adv.</span>
    <span class="text-center">Signal</span>
  </div>
  
  {#each rollouts as rollout, i}
    {@const adv = groupAdvantages[i] ?? 0}
    <div 
      class="grid grid-cols-[1fr_60px_80px_60px] items-center gap-1 rounded-md p-1.5 transition-colors"
      style="background: {advantageBg(adv)}"
    >
      <!-- Tokens -->
      <div class="mono flex flex-wrap gap-0.5 text-[10px]">
        {#each rollout.tokens as token}
          <span class="rounded bg-white/60 px-1 py-0.5">{token}</span>
        {/each}
      </div>

      <!-- Reward bar -->
      <div class="flex items-center gap-1">
        <div class="h-3 w-full rounded-full bg-gray-100">
          <div 
            class="h-3 rounded-full transition-all"
            style="width: {barWidth(rollout.reward)}; background-color: {advantageColor(adv)}"
          ></div>
        </div>
      </div>

      <!-- Advantage value -->
      <div class="mono text-center text-[10px] font-semibold" style="color: {advantageColor(adv)}">
        {adv > 0 ? '+' : ''}{adv.toFixed(2)}
      </div>

      <!-- Signal direction -->
      <div class="text-center text-sm">
        {#if adv > 0.3}
          <span class="text-green-500">⬆⬆</span>
        {:else if adv > 0}
          <span class="text-green-400">⬆</span>
        {:else if adv > -0.3}
          <span class="text-red-400">⬇</span>
        {:else}
          <span class="text-red-500">⬇⬇</span>
        {/if}
      </div>
    </div>
  {/each}

  <!-- Group stats -->
  <div class="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-[9px] text-gray-500">
    <span>Mean reward: <strong class="mono">{(rollouts.reduce((s, r) => s + r.reward, 0) / rollouts.length).toFixed(3)}</strong></span>
    <span>Above avg: <strong class="text-green-600">{groupAdvantages.filter(a => a > 0).length}</strong> / {rollouts.length}</span>
  </div>
</div>
