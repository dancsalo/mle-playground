<script lang="ts">
  import type { DocumentData } from '$lib/lsh';

  let { documents, k, hoveredShingle = $bindable(null), expanded }: {
    documents: DocumentData[];
    k: number;
    hoveredShingle: string | null;
    expanded: boolean;
  } = $props();

  // Find all positions where hoveredShingle appears in a text
  function getHighlightRanges(text: string, shingle: string | null): [number, number][] {
    if (!shingle) return [];
    const ranges: [number, number][] = [];
    const lower = text.toLowerCase();
    let idx = lower.indexOf(shingle);
    while (idx !== -1) {
      ranges.push([idx, idx + shingle.length]);
      idx = lower.indexOf(shingle, idx + 1);
    }
    return ranges;
  }

  function isInRange(pos: number, ranges: [number, number][]): boolean {
    return ranges.some(([start, end]) => pos >= start && pos < end);
  }
</script>

<div class="space-y-3">
  {#each documents as doc}
    {@const highlightRanges = getHighlightRanges(doc.text, hoveredShingle)}
    <div>
      <div class="mb-1 flex items-center gap-1">
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style="background-color: {doc.color}"
        >{doc.label}</span>
        <span class="mono text-xs text-gray-500">{doc.shingles.size} shingles</span>
      </div>

      <!-- Source text with character-level highlighting -->
      {#if expanded}
        <div class="mono mb-2 rounded bg-gray-50 p-2 text-xs leading-relaxed">
          {#each doc.text as char, i}
            {#if isInRange(i, highlightRanges)}
              <span class="rounded-sm bg-yellow-300 text-gray-900">{char}</span>
            {:else}
              <span class="text-gray-600">{char}</span>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Shingle chips -->
      <div class="flex flex-wrap gap-1">
        {#each [...doc.shingles].slice(0, expanded ? undefined : 8) as shingle}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            role="note"
            class="mono cursor-default rounded border px-1.5 py-0.5 text-[10px] transition-all duration-100"
            class:bg-yellow-300={hoveredShingle === shingle}
            class:border-yellow-400={hoveredShingle === shingle}
            class:shadow-sm={hoveredShingle === shingle}
            class:bg-gray-50={hoveredShingle !== shingle}
            class:border-gray-200={hoveredShingle !== shingle}
            onmouseenter={() => hoveredShingle = shingle}
            onmouseleave={() => hoveredShingle = null}
          >
            {shingle}
          </span>
        {/each}
        {#if !expanded && doc.shingles.size > 8}
          <span class="text-[10px] text-gray-400">+{doc.shingles.size - 8} more</span>
        {/if}
      </div>
    </div>
  {/each}

  {#if expanded}
    <div class="mt-2 border-t border-gray-100 pt-2">
      <div class="text-[10px] text-gray-500">
        <strong>Vocab size:</strong> {new Set(documents.flatMap(d => [...d.shingles])).size} unique shingles
        <span class="ml-2 text-gray-400">• Hover a shingle to highlight it in all documents</span>
      </div>
    </div>
  {/if}
</div>
