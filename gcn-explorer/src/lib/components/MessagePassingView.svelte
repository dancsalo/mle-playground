<script lang="ts">
  import type { Graph, ForwardResult } from '$lib/gcn';
  import { getNeighbors } from '$lib/gcn';

  let {
    graph,
    forwardResult,
    selectedNode,
    layer = 1
  }: {
    graph: Graph;
    forwardResult: ForwardResult;
    selectedNode: number;
    layer?: number;
  } = $props();

  let neighbors = $derived(selectedNode >= 0 ? getNeighbors(graph, selectedNode) : []);

  let layerData = $derived(layer === 1 ? forwardResult.layer1 : forwardResult.layer2);

  // Get the messages going TO the selected node
  let incomingMessages = $derived(
    selectedNode >= 0
      ? layerData.messages.filter(m => m.to === selectedNode)
      : []
  );

  // Aggregated representation (mean of messages)
  let aggregated = $derived(() => {
    if (incomingMessages.length === 0) return [];
    const dim = incomingMessages[0].value.length;
    const agg = Array(dim).fill(0);
    for (const msg of incomingMessages) {
      for (let d = 0; d < dim; d++) {
        agg[d] += msg.value[d];
      }
    }
    // The self-loop contribution is already in the normalized adjacency
    return agg;
  });

  function formatVal(v: number): string {
    return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
  }

  function valColor(v: number): string {
    if (v > 0.3) return '#10B981';
    if (v > 0) return '#6EE7B7';
    if (v > -0.3) return '#FCA5A5';
    return '#EF4444';
  }
</script>

<div class="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
  <div class="mb-2 flex items-center gap-2">
    <div class="h-2 w-2 rounded-full bg-amber-500"></div>
    <span class="text-[10px] font-bold uppercase text-amber-700">
      Message Passing — Layer {layer}
    </span>
  </div>

  {#if selectedNode >= 0}
    <div class="space-y-2">
      <!-- Selected node info -->
      <div class="flex items-center gap-2">
        <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style="background-color: {graph.classColors[graph.nodes[selectedNode].trueClass]}">
          {graph.nodes[selectedNode].label}
        </span>
        <span class="text-[9px] text-gray-500">
          ← receiving from {incomingMessages.length} neighbor{incomingMessages.length !== 1 ? 's' : ''}
        </span>
      </div>

      <!-- Message breakdown -->
      <div class="max-h-32 space-y-1 overflow-y-auto">
        {#each incomingMessages as msg}
          <div class="flex items-center gap-2 rounded bg-white/80 px-2 py-1">
            <span class="w-10 text-[9px] font-medium text-gray-700">
              {graph.nodes[msg.from].label}
            </span>
            <span class="text-[9px] text-gray-400">→</span>
            <div class="flex gap-0.5">
              {#each msg.value as v}
                <span class="mono rounded px-1 py-0.5 text-[8px]"
                      style="background-color: {valColor(v)}20; color: {valColor(v)}">
                  {formatVal(v)}
                </span>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Aggregation result -->
      {#if incomingMessages.length > 0}
        <div class="border-t border-amber-200 pt-2">
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-bold text-amber-800">Σ Aggregated:</span>
            <div class="flex gap-0.5">
              {#each aggregated() as v}
                <span class="mono rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                  {formatVal(v)}
                </span>
              {/each}
            </div>
          </div>
          <p class="mt-1 text-[8px] text-gray-500">
            Each neighbor's features are scaled by 1/√(deg(i)·deg(j)) then summed.
          </p>
        </div>
      {/if}

      <!-- Post-activation (after W + ReLU / softmax) -->
      <div class="border-t border-amber-200 pt-2">
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-bold text-purple-700">
            h{layer === 1 ? '¹' : '²'}[{selectedNode}] after {layer === 1 ? 'ReLU' : 'Softmax'}:
          </span>
          <div class="flex gap-0.5">
            {#each layerData.postActivation[selectedNode] as v}
              <span class="mono rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-800">
                {v.toFixed(3)}
              </span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <p class="py-4 text-center text-[10px] text-gray-400">
      Click a node in the graph to see its message passing details
    </p>
  {/if}
</div>
