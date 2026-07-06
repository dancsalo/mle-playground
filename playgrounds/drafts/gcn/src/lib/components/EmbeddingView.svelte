<script lang="ts">
  import type { Graph, ForwardResult } from '$lib/gcn';

  let {
    graph,
    forwardResult,
    selectedNode = -1
  }: {
    graph: Graph;
    forwardResult: ForwardResult;
    selectedNode?: number;
  } = $props();

  // Show hidden embeddings (layer 1 output) as a heatmap
  let embeddings = $derived(forwardResult.layer1.postActivation);

  let displayNodes = $derived(
    selectedNode >= 0
      ? [{ node: graph.nodes[selectedNode], embedding: embeddings[selectedNode] }]
      : graph.nodes.map((n, i) => ({ node: n, embedding: embeddings[i] }))
  );

  function embColor(v: number): string {
    const max = 2;
    const norm = Math.min(v / max, 1);
    return `rgba(139, 92, 246, ${norm})`;
  }
</script>

<div class="rounded-lg border border-gray-200 bg-white p-3">
  <div class="mb-2 flex items-center gap-2">
    <span class="text-[10px] font-bold uppercase text-gray-500">Hidden Embeddings (H¹)</span>
    <span class="text-[8px] text-gray-400">after Layer 1 ReLU</span>
  </div>

  <div class="max-h-48 space-y-0.5 overflow-y-auto">
    {#each displayNodes as { node, embedding }}
      <div class="flex items-center gap-1">
        <span class="w-10 truncate text-[9px] font-medium text-gray-600">{node.label}</span>
        <div class="flex gap-px">
          {#each embedding as val}
            <div
              class="feature-cell flex h-4 w-5 items-center justify-center rounded-sm text-[6px]"
              style="background-color: {embColor(val)};
                     color: {val > 0.8 ? 'white' : '#4B5563'}"
              title={val.toFixed(4)}
            >
              {val > 0.01 ? val.toFixed(1) : '·'}
            </div>
          {/each}
        </div>
        <div class="ml-1 h-2.5 w-2.5 rounded-full" style="background-color: {graph.classColors[node.trueClass]}"></div>
      </div>
    {/each}
  </div>

  <p class="mt-2 text-[8px] text-gray-400">
    These embeddings encode both node features and neighborhood structure.
    Similar nodes should develop similar embeddings.
  </p>
</div>
