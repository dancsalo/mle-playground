<script lang="ts">
  import type { DocumentData } from '$lib/lsh';
  import { hashBand } from '$lib/lsh';

  let { documents, numBands, expanded }: {
    documents: DocumentData[];
    numBands: number;
    expanded: boolean;
  } = $props();

  // Build bucket map for display
  let bucketMap = $derived.by(() => {
    const map: { bandIdx: number; hash: string; docs: number[] }[] = [];
    for (let b = 0; b < numBands; b++) {
      const bandBuckets = new Map<string, number[]>();
      for (let d = 0; d < documents.length; d++) {
        const band = documents[d].bands[b];
        if (!band) continue;
        const hash = hashBand(band.values);
        if (!bandBuckets.has(hash)) bandBuckets.set(hash, []);
        bandBuckets.get(hash)!.push(d);
      }
      for (const [hash, docs] of bandBuckets) {
        map.push({ bandIdx: b, hash, docs });
      }
    }
    return map;
  });

  // Get only collision buckets (>1 doc)
  let collisionBuckets = $derived(
    bucketMap.filter((b) => b.docs.length > 1)
  );

  // Per-band collision info for the band strip visualization
  let bandCollisions = $derived.by(() => {
    const result: { bandIdx: number; collidingDocs: number[][] }[] = [];
    for (let b = 0; b < numBands; b++) {
      const collisions = collisionBuckets
        .filter((cb) => cb.bandIdx === b)
        .map((cb) => cb.docs);
      result.push({ bandIdx: b, collidingDocs: collisions });
    }
    return result;
  });
</script>

<div class="space-y-3">
  <!-- Band visualization per document -->
  {#each documents as doc}
    <div>
      <div class="mb-1 flex items-center gap-1">
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style="background-color: {doc.color}"
        >{doc.label}</span>
        <span class="mono text-[10px] text-gray-500">{numBands} bands</span>
      </div>
      <div class="flex gap-[1px] overflow-hidden">
        {#each doc.bands as band, bi}
          {@const hash = hashBand(band.values)}
          {@const collision = collisionBuckets.find(
            (cb) => cb.bandIdx === bi && cb.docs.includes(doc.id)
          )}
          {@const hasCollision = !!collision}
          <div
            class="relative min-w-0 flex-1 rounded-[2px] border transition-all"
            class:border-[var(--lsh-primary)]={hasCollision}
            class:bg-purple-100={hasCollision}
            class:border-gray-200={!hasCollision}
            class:bg-gray-50={!hasCollision}
            title="Band {bi}: [{band.values.join(', ')}]{hasCollision ? ' ⚡ collision with ' + collision.docs.filter(d => d !== doc.id).map(d => documents[d].label).join(',') : ''}"
          >
            <div class="flex h-5 items-center justify-center overflow-hidden text-[7px]"
              class:text-[var(--lsh-primary)]={hasCollision}
              class:font-bold={hasCollision}
              class:text-gray-300={!hasCollision}
            >
              {#if hasCollision}
                <span class="text-[var(--lsh-primary)]">✓</span>
              {:else}
                {#if numBands <= 10}
                  {bi}
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  <!-- Collision summary -->
  <div class="mt-2 border-t border-gray-100 pt-2">
    <div class="text-[10px] font-medium text-gray-600">
      <span class="text-[var(--lsh-primary)] font-bold">{collisionBuckets.length}</span> collision{collisionBuckets.length !== 1 ? 's' : ''} across {numBands} bands
    </div>

    {#if expanded}
      <div class="mt-2 space-y-1.5">
        {#each collisionBuckets as bucket}
          <div class="flex items-center gap-2 rounded bg-purple-50 px-2 py-1.5">
            <span class="mono text-[9px] text-gray-500 shrink-0">Band {bucket.bandIdx}:</span>
            <div class="flex gap-1">
              {#each bucket.docs as docIdx}
                <span
                  class="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style="background-color: {documents[docIdx].color}"
                >{documents[docIdx].label}</span>
              {/each}
            </div>
            <span class="mono text-[8px] text-gray-400 truncate max-w-[80px]" title={bucket.hash}>
              h={bucket.hash.slice(0, 12)}…
            </span>
          </div>
        {/each}
      </div>

      <!-- Band values table -->
      <div class="mt-3 border-t border-gray-100 pt-2">
        <div class="mb-1 text-[10px] font-medium text-gray-600">Band values (signature segments)</div>
        <div class="overflow-x-auto">
          <table class="mono w-full text-[9px]">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="px-1 py-0.5 text-left text-gray-400">Band</th>
                {#each documents as doc}
                  <th class="px-1 py-0.5 text-center" style="color: {doc.color}">{doc.label}</th>
                {/each}
                <th class="px-1 py-0.5 text-left text-gray-400">Collision?</th>
              </tr>
            </thead>
            <tbody>
              {#each bandCollisions.slice(0, expanded ? numBands : 5) as bc}
                {@const hasCollision = bc.collidingDocs.length > 0}
                <tr class="border-b border-gray-50" class:bg-purple-50={hasCollision}>
                  <td class="px-1 py-0.5 text-gray-500">{bc.bandIdx}</td>
                  {#each documents as doc}
                    {@const band = doc.bands[bc.bandIdx]}
                    <td class="px-1 py-0.5 text-center text-gray-600 max-w-[60px] truncate" title={band ? band.values.join(',') : ''}>
                      [{band ? band.values.join(',') : ''}]
                    </td>
                  {/each}
                  <td class="px-1 py-0.5">
                    {#if hasCollision}
                      {#each bc.collidingDocs as group}
                        <span class="text-[var(--lsh-primary)] font-bold">
                          {group.map(d => documents[d].label).join('=')}
                        </span>
                      {/each}
                    {:else}
                      <span class="text-gray-300">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
