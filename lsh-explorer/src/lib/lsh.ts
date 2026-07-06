/**
 * LSH computation engine
 * Implements: k-shingling, one-hot encoding, minhashing, banding, candidate pair detection
 */

// ─── k-Shingling ───────────────────────────────────────────────────────────────

export function kShingle(text: string, k: number): Set<string> {
  const shingles = new Set<string>();
  const normalized = text.toLowerCase();
  for (let i = 0; i <= normalized.length - k; i++) {
    shingles.add(normalized.substring(i, i + k));
  }
  return shingles;
}

export function buildVocab(shingleSets: Set<string>[]): string[] {
  const union = new Set<string>();
  for (const s of shingleSets) {
    for (const shingle of s) {
      union.add(shingle);
    }
  }
  return Array.from(union).sort();
}

// ─── One-Hot Encoding ──────────────────────────────────────────────────────────

export function oneHotEncode(shingleSet: Set<string>, vocab: string[]): number[] {
  return vocab.map((v) => (shingleSet.has(v) ? 1 : 0));
}

// ─── MinHashing ────────────────────────────────────────────────────────────────

export function generatePermutation(length: number, seed: number): number[] {
  // Fisher-Yates shuffle with seeded random
  const perm = Array.from({ length }, (_, i) => i);
  let rng = seed;
  for (let i = length - 1; i > 0; i--) {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(rng) % (i + 1);
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return perm;
}

export function minhashSignature(
  oneHot: number[],
  numHashes: number,
  seed: number = 42
): number[] {
  const signature: number[] = [];
  for (let h = 0; h < numHashes; h++) {
    const perm = generatePermutation(oneHot.length, seed + h * 7919);
    // Find the first index in permutation order where oneHot is 1
    let minVal = oneHot.length;
    for (let i = 0; i < perm.length; i++) {
      if (oneHot[perm[i]] === 1) {
        minVal = i + 1;
        break;
      }
    }
    signature.push(minVal);
  }
  return signature;
}

// ─── Banding ───────────────────────────────────────────────────────────────────

export interface Band {
  bandIndex: number;
  values: number[];
}

export function splitIntoBands(signature: number[], numBands: number): Band[] {
  const rowsPerBand = Math.floor(signature.length / numBands);
  const bands: Band[] = [];
  for (let b = 0; b < numBands; b++) {
    const start = b * rowsPerBand;
    const end = start + rowsPerBand;
    bands.push({
      bandIndex: b,
      values: signature.slice(start, end)
    });
  }
  return bands;
}

export function hashBand(band: number[]): string {
  // Simple string hash for bucket assignment
  return band.join(',');
}

// ─── Candidate Pairs ───────────────────────────────────────────────────────────

export interface CandidatePair {
  docA: number;
  docB: number;
  bandIndex: number;
  similarity: number;
}

export function findCandidatePairs(
  signatures: number[][],
  numBands: number
): CandidatePair[] {
  const numDocs = signatures.length;
  const allBands = signatures.map((sig) => splitIntoBands(sig, numBands));
  const candidates = new Map<string, CandidatePair>();

  for (let b = 0; b < numBands; b++) {
    const buckets = new Map<string, number[]>();
    for (let doc = 0; doc < numDocs; doc++) {
      const hash = hashBand(allBands[doc][b].values);
      if (!buckets.has(hash)) buckets.set(hash, []);
      buckets.get(hash)!.push(doc);
    }
    // Any bucket with >1 doc creates candidate pairs
    for (const docs of buckets.values()) {
      if (docs.length > 1) {
        for (let i = 0; i < docs.length; i++) {
          for (let j = i + 1; j < docs.length; j++) {
            const key = `${docs[i]}-${docs[j]}`;
            if (!candidates.has(key)) {
              candidates.set(key, {
                docA: docs[i],
                docB: docs[j],
                bandIndex: b,
                similarity: 0
              });
            }
          }
        }
      }
    }
  }

  return Array.from(candidates.values());
}

// ─── Similarity Metrics ────────────────────────────────────────────────────────

export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function signatureSimilarity(sigA: number[], sigB: number[]): number {
  let matches = 0;
  for (let i = 0; i < sigA.length; i++) {
    if (sigA[i] === sigB[i]) matches++;
  }
  return matches / sigA.length;
}

// ─── S-Curve ───────────────────────────────────────────────────────────────────

export function sCurve(similarity: number, bands: number, rowsPerBand: number): number {
  // P(candidate) = 1 - (1 - s^r)^b
  return 1 - Math.pow(1 - Math.pow(similarity, rowsPerBand), bands);
}

export function sCurveData(
  bands: number,
  rowsPerBand: number,
  steps: number = 100
): { s: number; p: number }[] {
  const data: { s: number; p: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    data.push({ s, p: sCurve(s, bands, rowsPerBand) });
  }
  return data;
}

// ─── Full Pipeline ─────────────────────────────────────────────────────────────

export interface DocumentData {
  id: number;
  text: string;
  label: string;
  shingles: Set<string>;
  oneHot: number[];
  signature: number[];
  bands: Band[];
  color: string;
}

export interface PipelineResult {
  documents: DocumentData[];
  vocab: string[];
  candidatePairs: CandidatePair[];
  pairSimilarities: { docA: number; docB: number; jaccard: number; sigSim: number }[];
}

const DOC_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const DOC_LABELS = ['A', 'B', 'C', 'D'];

export function runPipeline(
  texts: string[],
  k: number,
  signatureLength: number,
  numBands: number
): PipelineResult {
  // Step 1: Shingling
  const shingleSets = texts.map((t) => kShingle(t, k));

  // Step 2: Vocab + One-hot
  const vocab = buildVocab(shingleSets);
  const oneHots = shingleSets.map((s) => oneHotEncode(s, vocab));

  // Step 3: MinHash signatures
  const signatures = oneHots.map((oh) => minhashSignature(oh, signatureLength));

  // Step 4: Banding
  const allBands = signatures.map((sig) => splitIntoBands(sig, numBands));

  // Step 5: Candidate pairs
  const candidatePairs = findCandidatePairs(signatures, numBands);

  // Compute actual similarities
  const pairSimilarities: PipelineResult['pairSimilarities'] = [];
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const jaccard = jaccardSimilarity(shingleSets[i], shingleSets[j]);
      const sigSim = signatureSimilarity(signatures[i], signatures[j]);
      pairSimilarities.push({ docA: i, docB: j, jaccard, sigSim });
      // Update candidate pairs with similarity
      const cp = candidatePairs.find((c) => c.docA === i && c.docB === j);
      if (cp) cp.similarity = jaccard;
    }
  }

  const documents: DocumentData[] = texts.map((text, i) => ({
    id: i,
    text,
    label: DOC_LABELS[i] || `${i}`,
    shingles: shingleSets[i],
    oneHot: oneHots[i],
    signature: signatures[i],
    bands: allBands[i],
    color: DOC_COLORS[i % DOC_COLORS.length]
  }));

  return { documents, vocab, candidatePairs, pairSimilarities };
}
