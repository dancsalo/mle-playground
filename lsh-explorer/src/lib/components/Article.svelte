<script lang="ts">
</script>

<section class="mx-auto mt-16 max-w-3xl space-y-8 pb-20">
  <h1 class="text-3xl font-bold text-gray-900">What is Locality Sensitive Hashing?</h1>

  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      <strong>Locality Sensitive Hashing (LSH)</strong> is a technique for fast approximate similarity
      search in high-dimensional data. Unlike conventional hashing (which minimizes collisions), LSH
      <em>maximizes</em> collisions for similar items — intentionally placing nearby points into the same bucket.
    </p>
    <p>
      Introduced by Indyk and Motwani in 1998, LSH enables sub-linear search times by reducing the
      comparison space from all pairs (O(n²)) to only candidate pairs that share a hash bucket.
    </p>
  </div>

  <h2 class="text-2xl font-bold text-gray-900">The Similarity Search Problem</h2>
  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      Imagine comparing millions of documents to find near-duplicates. Brute force requires checking
      every pair — with 1M documents, that's ~500 billion comparisons. LSH reduces this to checking
      only the small set of candidate pairs that collide in hash buckets.
    </p>
    <p>
      A family <em>H</em> of hash functions is <strong>(d₁, d₂, p₁, p₂)-sensitive</strong> if for a
      random h ∈ H:
    </p>
    <ul class="ml-6 list-disc space-y-1">
      <li>If d(x,y) ≤ d₁, then P[h(x) = h(y)] ≥ p₁ (similar items collide often)</li>
      <li>If d(x,y) ≥ d₂, then P[h(x) = h(y)] ≤ p₂ (dissimilar items rarely collide)</li>
    </ul>
  </div>

  <h2 class="text-2xl font-bold text-gray-900">k-Shingling</h2>
  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      Shingling converts text into a set of overlapping character subsequences of length <em>k</em>.
      A sliding window of size k moves across the text, producing the "shingle set." This set representation
      allows us to compute Jaccard similarity between documents.
    </p>
    <p>
      For example, with k=3, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-sm">"the cat"</code> becomes
      the set <code class="rounded bg-gray-100 px-1.5 py-0.5 text-sm">{`{"the", "he ", "e c", " ca", "cat"}`}</code>.
    </p>
    <p>
      All shingle sets are unioned to form the <strong>vocabulary</strong>. Each document is then represented
      as a one-hot encoded sparse vector over this vocabulary.
    </p>
  </div>

  <h2 class="text-2xl font-bold text-gray-900">MinHashing</h2>
  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      MinHashing compresses the large sparse one-hot vectors into compact <strong>signatures</strong>.
      Each minhash function is a random permutation of the vocabulary. For a given document, the minhash
      value is the index of the first "1" encountered when scanning the one-hot vector in the permuted order.
    </p>
    <p>
      By applying many minhash functions (e.g., 20–200), we build a dense signature vector. The key property:
      the probability that two documents share the same minhash value equals their Jaccard similarity.
    </p>
    <p class="rounded-lg bg-purple-50 p-3 text-sm">
      <strong>Key insight:</strong> P[minhash(A) = minhash(B)] = J(A, B) = |A ∩ B| / |A ∪ B|
    </p>
  </div>

  <h2 class="text-2xl font-bold text-gray-900">Banding & the LSH Function</h2>
  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      Hashing full signatures would require exact matches — too strict. Instead, we split each signature
      into <strong>b bands</strong> of <strong>r rows</strong> each. Two documents become a candidate pair
      if they share the same hash in <em>any</em> band.
    </p>
    <p>
      This creates a threshold effect: pairs with high similarity are very likely to collide in at least
      one band, while dissimilar pairs are unlikely to collide anywhere.
    </p>
  </div>

  <h2 class="text-2xl font-bold text-gray-900">Probability Amplification & the S-Curve</h2>
  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      The probability that two documents with similarity <em>s</em> become a candidate pair is:
    </p>
    <p class="mono rounded-lg bg-gray-50 p-3 text-center text-lg">
      P(candidate) = 1 − (1 − s<sup>r</sup>)<sup>b</sup>
    </p>
    <p>
      This formula produces an S-shaped curve. By tuning <strong>b</strong> (bands) and <strong>r</strong>
      (rows per band), you control the similarity threshold — the point where the curve transitions from
      "unlikely candidate" to "likely candidate."
    </p>
    <ul class="ml-6 list-disc space-y-1">
      <li><strong>More bands (↑b)</strong>: Shifts threshold left → more candidates, more false positives</li>
      <li><strong>More rows per band (↑r)</strong>: Shifts threshold right → fewer candidates, more false negatives</li>
    </ul>
    <p>
      This is the AND-OR construction: rows within a band use AND (all must match), bands use OR (any band can trigger candidacy).
    </p>
  </div>

  <h2 class="text-2xl font-bold text-gray-900">The S-Curve & Parameter Tuning</h2>
  <div class="space-y-4 text-gray-700 leading-relaxed">
    <p>
      Use the interactive S-curve above to explore how <em>b</em> and <em>r</em> affect the detection threshold.
      The colored dots show where each document pair falls on the curve based on their true Jaccard similarity.
    </p>
    <p>
      In practice, you choose b and r so that the steep part of the S-curve aligns with your desired
      similarity threshold — pairs above it are caught with high probability, pairs below it are mostly filtered out.
    </p>
  </div>

  <div class="border-t border-gray-200 pt-8 text-sm text-gray-500">
    <p>
      <strong>References:</strong> Indyk & Motwani (1998), Broder (1997), Charikar (2002),
      Datar et al. (2004). Implementation inspired by
      <a href="https://poloclub.github.io/transformer-explainer/" class="text-[var(--lsh-primary)] hover:underline">Transformer Explainer</a>.
    </p>
  </div>
</section>
