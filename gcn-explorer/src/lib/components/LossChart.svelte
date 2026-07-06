<script lang="ts">
  import type { TrainingStep } from '$lib/gcn';

  let { history }: { history: TrainingStep[] } = $props();

  let maxLoss = $derived(history.length > 0 ? Math.max(...history.map(h => h.loss), 1) : 2);
  let width = 280;
  let height = 120;
  let padding = { top: 10, right: 10, bottom: 25, left: 35 };
  let plotW = width - padding.left - padding.right;
  let plotH = height - padding.top - padding.bottom;

  function lossPath(): string {
    if (history.length < 2) return '';
    const xScale = plotW / Math.max(history.length - 1, 1);
    const yScale = plotH / maxLoss;
    return history.map((h, i) =>
      `${i === 0 ? 'M' : 'L'} ${padding.left + i * xScale} ${padding.top + plotH - h.loss * yScale}`
    ).join(' ');
  }

  function accPath(): string {
    if (history.length < 2) return '';
    const xScale = plotW / Math.max(history.length - 1, 1);
    return history.map((h, i) =>
      `${i === 0 ? 'M' : 'L'} ${padding.left + i * xScale} ${padding.top + plotH - h.accuracy * plotH}`
    ).join(' ');
  }
</script>

<div class="rounded-lg border border-gray-200 bg-white p-3">
  <div class="mb-1 flex items-center justify-between">
    <span class="text-[10px] font-bold uppercase text-gray-500">Training Curves</span>
    {#if history.length > 0}
      <span class="mono text-[9px] text-gray-400">
        Epoch {history[history.length - 1].epoch}
      </span>
    {/if}
  </div>

  <svg {width} {height}>
    <!-- Grid -->
    <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH}
          stroke="#E5E7EB" stroke-width="1" />
    <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH}
          stroke="#E5E7EB" stroke-width="1" />

    <!-- Y axis labels -->
    <text x={padding.left - 4} y={padding.top + 4} text-anchor="end" font-size="8" fill="#9CA3AF">
      {maxLoss.toFixed(1)}
    </text>
    <text x={padding.left - 4} y={padding.top + plotH + 3} text-anchor="end" font-size="8" fill="#9CA3AF">
      0
    </text>
    <text x={padding.left - 4} y={padding.top + plotH / 2 + 3} text-anchor="end" font-size="8" fill="#9CA3AF">
      {(maxLoss / 2).toFixed(1)}
    </text>

    <!-- X axis label -->
    <text x={padding.left + plotW / 2} y={height - 4} text-anchor="middle" font-size="8" fill="#9CA3AF">
      Epoch
    </text>

    <!-- Loss curve -->
    {#if history.length >= 2}
      <path d={lossPath()} class="loss-line" stroke="#EF4444" opacity="0.8" />
      <!-- Accuracy curve -->
      <path d={accPath()} class="loss-line" stroke="#10B981" opacity="0.8" stroke-dasharray="4 2" />
    {/if}

    <!-- Current point -->
    {#if history.length > 0}
      {@const last = history[history.length - 1]}
      {@const xScale = plotW / Math.max(history.length - 1, 1)}
      {@const yScale = plotH / maxLoss}
      <circle
        cx={padding.left + (history.length - 1) * xScale}
        cy={padding.top + plotH - last.loss * yScale}
        r="3"
        fill="#EF4444"
      />
      <circle
        cx={padding.left + (history.length - 1) * xScale}
        cy={padding.top + plotH - last.accuracy * plotH}
        r="3"
        fill="#10B981"
      />
    {/if}

    <!-- Legend -->
    <g transform="translate({padding.left + 5}, {padding.top + 5})">
      <line x1="0" y1="0" x2="12" y2="0" stroke="#EF4444" stroke-width="2" />
      <text x="16" y="3" font-size="8" fill="#6B7280">Loss</text>
      <line x1="45" y1="0" x2="57" y2="0" stroke="#10B981" stroke-width="2" stroke-dasharray="4 2" />
      <text x="61" y="3" font-size="8" fill="#6B7280">Accuracy</text>
    </g>
  </svg>

  <!-- Stats -->
  {#if history.length > 0}
    {@const last = history[history.length - 1]}
    <div class="mt-1 flex gap-3 text-[9px]">
      <span class="text-red-600">Loss: <strong class="mono">{last.loss.toFixed(4)}</strong></span>
      <span class="text-emerald-600">Acc: <strong class="mono">{(last.accuracy * 100).toFixed(1)}%</strong></span>
      <span class="text-gray-400">‖∇W₁‖: <span class="mono">{last.gradW1Norm.toFixed(3)}</span></span>
    </div>
  {/if}
</div>
