<script lang="ts">
  import type { Graph } from '$lib/gcn';

  let {
    graph,
    selectedNode = -1
  }: {
    graph: Graph;
    selectedNode?: number;
  } = $props();

  let displayNodes = $derived(
    selectedNode >= 0 ? [graph.nodes[selectedNode]] : graph.nodes.slice(0, 6)
  );

  function featureColor(v: number): string {
    // Blue to white to red scale
    const intensity = Math.abs(v);
    if (v >= 0.5) return `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
    if (v >= 0.25) return `rgba(59, 130, 246, ${intensity * 0.6})`;
    return `rgba(156, 163, 175, ${0.2 + intensity * 0.3})`;
  }

  const featureNames = ["papers", "citations", "years", "collab"];
</script>

<div class="rounded-lg border border-gray-200 bg-white p-3">
  <div class="mb-2 flex items-center gap-2">
    <span class="text-[10px] font-bold uppercase text-gray-500">Node Features (H⁰)</span>
    {#if selectedNode >= 0}
      <span class="rounded-full px-1.5 py-0.5 text-[8px] font-medium text-white"
            style="background-color: {graph.classColors[graph.nodes[selectedNode].trueClass]}">
        {graph.nodes[selectedNode].label}
      </span>
    {/if}
  </div>

  <!-- Feature header -->
  <div class="mb-1 flex items-center gap-1 pl-12">
    {#each featureNames as name}
      <span class="w-11 text-center text-[7px] text-gray-400">{name}</span>
    {/each}
  </div>

  <!-- Feature rows -->
  <div class="space-y-0.5">
    {#each displayNodes as node}
      <div class="flex items-center gap-1">
        <span class="w-10 truncate text-[9px] font-medium text-gray-600">{node.label}</span>
        <div class="flex gap-0.5">
          {#each node.features as feat}
            <div
              class="feature-cell flex h-5 w-11 items-center justify-center rounded text-[8px] font-medium"
              style="background-color: {featureColor(feat)}; color: {feat > 0.5 ? 'white' : '#374151'}"
            >
              {feat.toFixed(2)}
            </div>
          {/each}
        </div>
        <!-- Class indicator -->
        <div class="ml-1 h-3 w-3 rounded-full" style="background-color: {graph.classColors[node.trueClass]}"></div>
      </div>
    {/each}
  </div>

  {#if selectedNode < 0}
    <p class="mt-2 text-[8px] text-gray-400">Showing first 6 nodes. Click a node to see its features.</p>
  {/if}
</div>
