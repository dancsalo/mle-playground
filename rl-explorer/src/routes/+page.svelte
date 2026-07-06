<script lang="ts">
  import {
    createSimulation,
    trainStep,
    SCENARIOS,
    generateRollouts,
    avgKL,
    avgEntropy,
    topK,
    DEFAULT_PPO_CONFIG,
    DEFAULT_DPO_CONFIG,
    DEFAULT_GRPO_CONFIG,
    type SimulationState,
    type Algorithm,
    type PPOConfig,
    type DPOConfig,
    type GRPOConfig
  } from '$lib/rlhf';
  import TokenDistChart from '$lib/components/TokenDistChart.svelte';
  import RolloutView from '$lib/components/RolloutView.svelte';
  import KLGauge from '$lib/components/KLGauge.svelte';
  import TimelineChart from '$lib/components/TimelineChart.svelte';
  import GRPOGroupView from '$lib/components/GRPOGroupView.svelte';
  import PPOSignalView from '$lib/components/PPOSignalView.svelte';
  import DPOSignalView from '$lib/components/DPOSignalView.svelte';
  import StepHistory from '$lib/components/StepHistory.svelte';
  import EntropyView from '$lib/components/EntropyView.svelte';

  // ─── State ─────────────────────────────────────────────────────────────────
  let scenarioIndex = $state(0);
  let sim = $state(createSimulation(0));
  let numRollouts = $state(6);
  let autoTraining = $state(false);
  let autoInterval: ReturnType<typeof setInterval> | null = null;
  let speed = $state(1000); // ms between auto steps
  let selectedPosition = $state(0);

  // Algorithm configs
  let ppoConfig = $state<PPOConfig>({ ...DEFAULT_PPO_CONFIG });
  let dpoConfig = $state<DPOConfig>({ ...DEFAULT_DPO_CONFIG });
  let grpoConfig = $state<GRPOConfig>({ ...DEFAULT_GRPO_CONFIG });

  // Expanded panels
  let expandedPanel = $state<string | null>(null);

  // ─── Derived ───────────────────────────────────────────────────────────────
  let scenario = $derived(SCENARIOS[scenarioIndex]);
  let latestPPO = $derived(sim.history.PPO[sim.history.PPO.length - 1] ?? null);
  let latestDPO = $derived(sim.history.DPO[sim.history.DPO.length - 1] ?? null);
  let latestGRPO = $derived(sim.history.GRPO[sim.history.GRPO.length - 1] ?? null);

  let ppoKL = $derived(latestPPO?.klDivergence ?? 0);
  let dpoKL = $derived(latestDPO?.klDivergence ?? 0);
  let grpoKL = $derived(latestGRPO?.klDivergence ?? 0);

  // ─── Actions ───────────────────────────────────────────────────────────────
  function doStep() {
    sim = trainStep(sim, scenarioIndex, ppoConfig, dpoConfig, grpoConfig, numRollouts);
  }

  function reset() {
    stopAuto();
    sim = createSimulation(scenarioIndex);
  }

  function changeScenario(idx: number) {
    scenarioIndex = idx;
    reset();
  }

  function startAuto() {
    autoTraining = true;
    autoInterval = setInterval(doStep, speed);
  }

  function stopAuto() {
    autoTraining = false;
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
  }

  function toggleAuto() {
    if (autoTraining) stopAuto();
    else startAuto();
  }

  function togglePanel(panel: string) {
    expandedPanel = expandedPanel === panel ? null : panel;
  }

  // Clean up on destroy
  $effect(() => {
    return () => {
      if (autoInterval) clearInterval(autoInterval);
    };
  });
</script>

<div id="app" class="min-w-[1200px]">
  <!-- Top Bar -->
  <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
    <div class="flex items-center gap-6 px-6 py-3">
      <div class="text-lg font-bold text-gray-800">
        <span class="text-[var(--rl-primary)]">RL</span> E<span class="text-sm">XPLORER</span>
        <span class="ml-2 text-[10px] font-normal text-gray-400">PPO · DPO · GRPO</span>
      </div>

      <!-- Scenario selector -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-xs font-medium text-gray-500">Prompt:</span>
        <select 
          class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"
          onchange={(e) => changeScenario(Number((e.target as HTMLSelectElement).value))}
        >
          {#each SCENARIOS as s, i}
            <option value={i} selected={i === scenarioIndex}>"{s.prompt}"</option>
          {/each}
        </select>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-1.5 text-xs">
          <span class="text-gray-500">Rollouts:</span>
          <input type="range" min="3" max="10" bind:value={numRollouts} class="w-16" />
          <span class="mono w-3 font-medium">{numRollouts}</span>
        </label>

        <label class="flex items-center gap-1.5 text-xs">
          <span class="text-gray-500">Speed:</span>
          <input type="range" min="200" max="3000" step="100" bind:value={speed} class="w-16" />
          <span class="mono w-8 text-[10px]">{speed}ms</span>
        </label>
      </div>

      <!-- Action buttons -->
      <div class="ml-auto flex items-center gap-2">
        <span class="mono rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Step {sim.stepCount}
        </span>

        <button 
          onclick={doStep}
          class="step-btn rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          ⏩ Apply One Update
        </button>

        <button 
          onclick={toggleAuto}
          class="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          class:bg-red-100={autoTraining}
          class:text-red-700={autoTraining}
          class:bg-gray-100={!autoTraining}
          class:text-gray-700={!autoTraining}
        >
          {autoTraining ? '⏸ Stop' : '▶ Auto'}
        </button>

        <button 
          onclick={reset}
          class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="px-6 py-4">
    <!-- Prompt Display -->
    <section class="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
      <div class="flex items-center gap-3">
        <span class="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase text-indigo-700">Prompt</span>
        <span class="text-base font-medium text-gray-800">"{scenario.prompt}"</span>
        <span class="ml-auto text-[10px] text-gray-400">
          Vocab: {scenario.vocab.length} tokens · {scenario.positions} positions
        </span>
      </div>
    </section>

    <!-- Three-Column Algorithm Comparison -->
    <div class="grid grid-cols-3 gap-4">
      
      <!-- ═══════════════ PPO Column ═══════════════ -->
      <div class="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/20 p-3">
        <div class="flex items-center gap-2 border-b border-amber-100 pb-2">
          <div class="h-3 w-3 rounded-full bg-amber-500"></div>
          <h2 class="text-sm font-bold text-amber-800">PPO</h2>
          <span class="text-[9px] text-amber-600">Proximal Policy Optimization</span>
        </div>

        <!-- PPO Rollouts -->
        {#if latestPPO}
          <div>
            <button onclick={() => togglePanel('ppo-rollouts')} class="mb-1 flex w-full items-center justify-between text-left">
              <span class="text-[10px] font-semibold uppercase text-gray-500">Rollouts</span>
              <span class="text-[10px] text-gray-400">{expandedPanel === 'ppo-rollouts' ? '▼' : '▶'}</span>
            </button>
            {#if expandedPanel === 'ppo-rollouts'}
              <RolloutView rollouts={latestPPO.rollouts} algorithm="PPO" color="#F59E0B" showAdvantage={true} />
            {:else}
              <div class="mono rounded-md bg-white/60 p-2 text-[10px] text-gray-600">
                {latestPPO.rollouts.length} rollouts · avg reward: {latestPPO.avgReward.toFixed(3)}
                <br/>Best: "{[...latestPPO.rollouts].sort((a,b) => b.reward - a.reward)[0]?.tokens.join(' ')}"
              </div>
            {/if}
          </div>

          <!-- PPO Signal -->
          <PPOSignalView rollouts={latestPPO.rollouts} ppoConfig={ppoConfig} />

          <!-- PPO Token Distribution -->
          <div>
            <div class="mb-1 flex items-center gap-2">
              <span class="text-[10px] font-semibold uppercase text-gray-500">Distribution (pos {selectedPosition + 1})</span>
              <div class="flex gap-0.5">
                {#each Array(scenario.positions) as _, i}
                  <button 
                    class="h-4 w-4 rounded text-[8px] transition-colors"
                    class:bg-amber-500={selectedPosition === i}
                    class:text-white={selectedPosition === i}
                    class:bg-gray-100={selectedPosition !== i}
                    onclick={() => selectedPosition = i}
                  >{i+1}</button>
                {/each}
              </div>
            </div>
            <TokenDistChart 
              oldDist={latestPPO.oldPolicy.distributions[selectedPosition]}
              newDist={latestPPO.newPolicy.distributions[selectedPosition]}
              label="Before → After"
              color="#F59E0B"
            />
          </div>
        {:else}
          <div class="py-8 text-center text-xs text-gray-400">Click "Apply One Update" to start training</div>
        {/if}

        <!-- PPO KL Gauge -->
        <KLGauge klValue={ppoKL} label="KL from Reference" />

        <!-- PPO Entropy -->
        {#if latestPPO}
          <EntropyView policy={latestPPO.newPolicy} vocab={scenario.vocab} positions={scenario.positions} />
        {/if}

        <!-- PPO Timeline -->
        <TimelineChart history={sim.history.PPO} color="#F59E0B" algorithm="PPO" />

        <!-- PPO History -->
        <StepHistory history={sim.history.PPO} algorithm="PPO" color="#F59E0B" />
      </div>

      <!-- ═══════════════ DPO Column ═══════════════ -->
      <div class="space-y-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/20 p-3">
        <div class="flex items-center gap-2 border-b border-emerald-100 pb-2">
          <div class="h-3 w-3 rounded-full bg-emerald-500"></div>
          <h2 class="text-sm font-bold text-emerald-800">DPO</h2>
          <span class="text-[9px] text-emerald-600">Direct Preference Optimization</span>
        </div>

        <!-- DPO Rollouts -->
        {#if latestDPO}
          <div>
            <button onclick={() => togglePanel('dpo-rollouts')} class="mb-1 flex w-full items-center justify-between text-left">
              <span class="text-[10px] font-semibold uppercase text-gray-500">Rollouts</span>
              <span class="text-[10px] text-gray-400">{expandedPanel === 'dpo-rollouts' ? '▼' : '▶'}</span>
            </button>
            {#if expandedPanel === 'dpo-rollouts'}
              <RolloutView 
                rollouts={latestDPO.rollouts} 
                algorithm="DPO" 
                color="#10B981" 
                chosen={latestDPO.chosen}
                rejected={latestDPO.rejected}
              />
            {:else}
              <div class="mono rounded-md bg-white/60 p-2 text-[10px] text-gray-600">
                {latestDPO.rollouts.length} rollouts · avg reward: {latestDPO.avgReward.toFixed(3)}
                <br/>Best: "{[...latestDPO.rollouts].sort((a,b) => b.reward - a.reward)[0]?.tokens.join(' ')}"
              </div>
            {/if}
          </div>

          <!-- DPO Signal -->
          {#if latestDPO.chosen && latestDPO.rejected}
            <DPOSignalView chosen={latestDPO.chosen} rejected={latestDPO.rejected} />
          {/if}

          <!-- DPO Token Distribution -->
          <div>
            <div class="mb-1 flex items-center gap-2">
              <span class="text-[10px] font-semibold uppercase text-gray-500">Distribution (pos {selectedPosition + 1})</span>
            </div>
            <TokenDistChart 
              oldDist={latestDPO.oldPolicy.distributions[selectedPosition]}
              newDist={latestDPO.newPolicy.distributions[selectedPosition]}
              label="Before → After"
              color="#10B981"
            />
          </div>
        {:else}
          <div class="py-8 text-center text-xs text-gray-400">Click "Apply One Update" to start training</div>
        {/if}

        <!-- DPO KL Gauge -->
        <KLGauge klValue={dpoKL} label="KL from Reference" />

        <!-- DPO Entropy -->
        {#if latestDPO}
          <EntropyView policy={latestDPO.newPolicy} vocab={scenario.vocab} positions={scenario.positions} />
        {/if}

        <!-- DPO Timeline -->
        <TimelineChart history={sim.history.DPO} color="#10B981" algorithm="DPO" />

        <!-- DPO History -->
        <StepHistory history={sim.history.DPO} algorithm="DPO" color="#10B981" />
      </div>

      <!-- ═══════════════ GRPO Column ═══════════════ -->
      <div class="space-y-3 rounded-xl border-2 border-violet-200 bg-violet-50/20 p-3">
        <div class="flex items-center gap-2 border-b border-violet-100 pb-2">
          <div class="h-3 w-3 rounded-full bg-violet-500"></div>
          <h2 class="text-sm font-bold text-violet-800">GRPO</h2>
          <span class="text-[9px] text-violet-600">Group Relative Policy Optimization</span>
        </div>

        <!-- GRPO Rollouts -->
        {#if latestGRPO}
          <div>
            <button onclick={() => togglePanel('grpo-rollouts')} class="mb-1 flex w-full items-center justify-between text-left">
              <span class="text-[10px] font-semibold uppercase text-gray-500">Group Rollouts</span>
              <span class="text-[10px] text-gray-400">{expandedPanel === 'grpo-rollouts' ? '▼' : '▶'}</span>
            </button>
            {#if expandedPanel === 'grpo-rollouts'}
              <RolloutView rollouts={latestGRPO.rollouts} algorithm="GRPO" color="#8B5CF6" showAdvantage={true} />
            {:else}
              <div class="mono rounded-md bg-white/60 p-2 text-[10px] text-gray-600">
                {latestGRPO.rollouts.length} samples · avg reward: {latestGRPO.avgReward.toFixed(3)}
              </div>
            {/if}
          </div>

          <!-- GRPO Group View -->
          {#if latestGRPO.groupAdvantages}
            <GRPOGroupView rollouts={latestGRPO.rollouts} groupAdvantages={latestGRPO.groupAdvantages} />
          {/if}

          <!-- GRPO Token Distribution -->
          <div>
            <div class="mb-1 flex items-center gap-2">
              <span class="text-[10px] font-semibold uppercase text-gray-500">Distribution (pos {selectedPosition + 1})</span>
            </div>
            <TokenDistChart 
              oldDist={latestGRPO.oldPolicy.distributions[selectedPosition]}
              newDist={latestGRPO.newPolicy.distributions[selectedPosition]}
              label="Before → After"
              color="#8B5CF6"
            />
          </div>
        {:else}
          <div class="py-8 text-center text-xs text-gray-400">Click "Apply One Update" to start training</div>
        {/if}

        <!-- GRPO KL Gauge -->
        <KLGauge klValue={grpoKL} label="KL from Reference" />

        <!-- GRPO Entropy -->
        {#if latestGRPO}
          <EntropyView policy={latestGRPO.newPolicy} vocab={scenario.vocab} positions={scenario.positions} />
        {/if}

        <!-- GRPO Timeline -->
        <TimelineChart history={sim.history.GRPO} color="#8B5CF6" algorithm="GRPO" />

        <!-- GRPO History -->
        <StepHistory history={sim.history.GRPO} algorithm="GRPO" color="#8B5CF6" />
      </div>
    </div>

    <!-- ═══════════════ Bottom: Algorithm Config & Education ═══════════════ -->
    <section class="mt-6 grid grid-cols-3 gap-4">
      <!-- PPO Config -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="mb-3 text-xs font-bold text-amber-700">PPO Configuration</h3>
        <div class="space-y-2">
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Learning Rate</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0.01" max="0.2" step="0.01" bind:value={ppoConfig.learningRate} class="w-20" />
              <span class="mono w-8">{ppoConfig.learningRate.toFixed(2)}</span>
            </div>
          </label>
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Clip Epsilon (ε)</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0.05" max="0.5" step="0.05" bind:value={ppoConfig.clipEpsilon} class="w-20" />
              <span class="mono w-8">{ppoConfig.clipEpsilon.toFixed(2)}</span>
            </div>
          </label>
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">KL Penalty (β)</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0" max="0.5" step="0.01" bind:value={ppoConfig.klPenalty} class="w-20" />
              <span class="mono w-8">{ppoConfig.klPenalty.toFixed(2)}</span>
            </div>
          </label>
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Entropy Bonus</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0" max="0.1" step="0.005" bind:value={ppoConfig.entropyBonus} class="w-20" />
              <span class="mono w-8">{ppoConfig.entropyBonus.toFixed(3)}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- DPO Config -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="mb-3 text-xs font-bold text-emerald-700">DPO Configuration</h3>
        <div class="space-y-2">
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Learning Rate</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0.01" max="0.2" step="0.01" bind:value={dpoConfig.learningRate} class="w-20" />
              <span class="mono w-8">{dpoConfig.learningRate.toFixed(2)}</span>
            </div>
          </label>
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Beta (β)</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0.01" max="0.5" step="0.01" bind:value={dpoConfig.beta} class="w-20" />
              <span class="mono w-8">{dpoConfig.beta.toFixed(2)}</span>
            </div>
          </label>
        </div>
        <div class="mt-3 rounded border border-emerald-100 bg-emerald-50 p-2 text-[10px] text-emerald-700">
          <strong>DPO</strong> learns directly from preference pairs without a separate reward model. 
          Higher β = stronger constraint toward the reference policy.
        </div>
      </div>

      <!-- GRPO Config -->
      <div class="rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="mb-3 text-xs font-bold text-violet-700">GRPO Configuration</h3>
        <div class="space-y-2">
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Learning Rate</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0.01" max="0.2" step="0.01" bind:value={grpoConfig.learningRate} class="w-20" />
              <span class="mono w-8">{grpoConfig.learningRate.toFixed(2)}</span>
            </div>
          </label>
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">KL Penalty</span>
            <div class="flex items-center gap-1">
              <input type="range" min="0" max="0.5" step="0.01" bind:value={grpoConfig.klPenalty} class="w-20" />
              <span class="mono w-8">{grpoConfig.klPenalty.toFixed(2)}</span>
            </div>
          </label>
          <label class="flex items-center justify-between text-[11px]">
            <span class="text-gray-600">Group Size</span>
            <div class="flex items-center gap-1">
              <input type="range" min="4" max="12" step="1" bind:value={grpoConfig.groupSize} class="w-20" />
              <span class="mono w-8">{grpoConfig.groupSize}</span>
            </div>
          </label>
        </div>
        <div class="mt-3 rounded border border-violet-100 bg-violet-50 p-2 text-[10px] text-violet-700">
          <strong>GRPO</strong> uses group-relative advantages: no critic network. 
          Samples within a group are ranked against each other.
        </div>
      </div>
    </section>

    <!-- ═══════════════ Educational Footer ═══════════════ -->
    <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-bold text-gray-800">How This Works</h2>
      
      <div class="grid grid-cols-3 gap-6 text-sm text-gray-600">
        <div>
          <h3 class="mb-2 font-semibold text-amber-700">PPO (Proximal Policy Optimization)</h3>
          <p class="text-xs leading-relaxed">
            Generates rollouts, scores them with a reward model, then updates the policy using 
            <strong>clipped surrogate objectives</strong>. The clip prevents catastrophically large updates.
            A KL penalty keeps the policy near the reference. Think: "improve, but cautiously."
          </p>
          <div class="mt-2 rounded bg-amber-50 p-2 text-[10px]">
            <strong>Key insight:</strong> PPO balances reward maximization against stability through 
            clipping and KL penalties — two separate safety mechanisms.
          </div>
        </div>
        
        <div>
          <h3 class="mb-2 font-semibold text-emerald-700">DPO (Direct Preference Optimization)</h3>
          <p class="text-xs leading-relaxed">
            Skips the reward model entirely. Instead, it uses <strong>preference pairs</strong> 
            (chosen vs rejected) to directly optimize the policy. The implicit reward is derived 
            from the log-ratio between the policy and reference. Simpler, more stable.
          </p>
          <div class="mt-2 rounded bg-emerald-50 p-2 text-[10px]">
            <strong>Key insight:</strong> DPO proves you can optimize preferences without RL — 
            the reference policy acts as an implicit constraint.
          </div>
        </div>
        
        <div>
          <h3 class="mb-2 font-semibold text-violet-700">GRPO (Group Relative Policy Optimization)</h3>
          <p class="text-xs leading-relaxed">
            Samples a <strong>group</strong> of completions, scores them, then computes advantages 
            <em>relative to the group mean</em>. No critic network needed. Better-than-average 
            responses get reinforced; worse ones get suppressed.
          </p>
          <div class="mt-2 rounded bg-violet-50 p-2 text-[10px]">
            <strong>Key insight:</strong> GRPO is self-normalizing — it only cares about 
            relative quality within each batch, making it robust to reward scale.
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <h3 class="mb-2 text-sm font-bold text-indigo-800">The Core Idea</h3>
        <p class="text-xs leading-relaxed text-indigo-700">
          All three algorithms do the same fundamental thing: <strong>reshape probability distributions 
          over token sequences</strong>. Each training step moves probability mass toward preferred 
          trajectories and away from unpreferred ones. The differences are in <em>how</em> they 
          determine what's preferred and <em>how aggressively</em> they redistribute that mass.
        </p>
        <p class="mt-2 text-xs leading-relaxed text-indigo-600">
          Watch the token distributions above as you train. Notice how probability concentrates 
          on "good" tokens (like "scatters", "wavelengths") and diminishes on misleading ones 
          (like "reflects", "ocean"). That redistribution <em>is</em> the training.
        </p>
      </div>
    </section>
  </main>
</div>
