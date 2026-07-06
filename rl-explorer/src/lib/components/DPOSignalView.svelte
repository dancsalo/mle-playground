<script lang="ts">
  import type { Rollout } from '$lib/rlhf';

  let {
    chosen,
    rejected
  }: {
    chosen: Rollout;
    rejected: Rollout;
  } = $props();
</script>

<div class="space-y-3">
  <!-- Balance/tug-of-war visualization -->
  <div class="rounded-lg border border-emerald-100 bg-gradient-to-r from-green-50 via-white to-red-50 p-4">
    <div class="mb-2 text-center text-[10px] font-semibold uppercase text-gray-500">Preference Signal</div>
    
    <!-- Chosen -->
    <div class="mb-3">
      <div class="mb-1 flex items-center gap-2">
        <span class="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">↑ CHOSEN</span>
        <span class="mono text-[10px] text-green-600">r={chosen.reward.toFixed(3)}</span>
      </div>
      <div class="mono flex flex-wrap gap-0.5 rounded-md border border-green-200 bg-green-50/50 p-2 text-[11px]">
        {#each chosen.tokens as token}
          <span class="rounded bg-green-100/60 px-1.5 py-0.5">{token}</span>
        {/each}
      </div>
    </div>

    <!-- VS indicator -->
    <div class="relative my-2 flex items-center justify-center">
      <div class="absolute inset-x-0 top-1/2 h-px bg-gray-200"></div>
      <span class="relative z-10 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-gray-400 shadow-sm">vs</span>
    </div>

    <!-- Rejected -->
    <div>
      <div class="mb-1 flex items-center gap-2">
        <span class="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">↓ REJECTED</span>
        <span class="mono text-[10px] text-red-600">r={rejected.reward.toFixed(3)}</span>
      </div>
      <div class="mono flex flex-wrap gap-0.5 rounded-md border border-red-200 bg-red-50/50 p-2 text-[11px]">
        {#each rejected.tokens as token}
          <span class="rounded bg-red-100/60 px-1.5 py-0.5">{token}</span>
        {/each}
      </div>
    </div>
  </div>

  <!-- Mechanism explanation -->
  <div class="rounded border border-gray-100 bg-gray-50 p-2 text-[10px] text-gray-600">
    <strong>DPO mechanism:</strong> Increases probability of chosen tokens while decreasing rejected tokens.
    No explicit reward model — learns directly from preference pairs.
  </div>

  <!-- Reward gap -->
  <div class="flex items-center justify-between text-[10px]">
    <span class="text-gray-500">Reward gap:</span>
    <span class="mono font-semibold text-indigo-600">
      Δ = {(chosen.reward - rejected.reward).toFixed(3)}
    </span>
  </div>
</div>
