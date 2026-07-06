/**
 * HNSW computation engine
 * Simulates: IVF partitioning, PQ compression visualization, HNSW graph construction & search
 */

// ─── Vector Data Generation ─────────────────────────────────────────────────────

export interface Point {
  id: number;
  x: number;
  y: number;
  clusterId: number;
  layer: number; // HNSW layer (0 = bottom, higher = top)
}

export interface Cluster {
  id: number;
  centroid: { x: number; y: number };
  points: number[];
}

export interface HNSWNode {
  id: number;
  pointId: number;
  layer: number;
  neighbors: number[]; // IDs of neighboring nodes
  x: number;
  y: number;
}

export interface SearchPath {
  nodeIds: number[];
  distances: number[];
  layer: number;
}

export interface QueryState {
  stage: 'idle' | 'ivf' | 'pq' | 'hnsw' | 'exact' | 'complete';
  ivfCandidates: number[];
  pqCompressed: boolean;
  hnswPath: SearchPath[];
  exactResults: number[];
  progress: number; // 0-1 overall progress
  searchMetrics: SearchMetrics;
}

export interface SearchMetrics {
  totalVectors: number;
  ivfCandidates: number;
  pqComparisons: number;
  hnswNodesVisited: number;
  finalCandidates: number;
  memoryOriginal: number;
  memoryCompressed: number;
  latency: number;
  recall: number;
}

export interface PQCodebook {
  centroids: number[][][]; // [subspace][cluster][values]
  numSubspaces: number;
  subspaceDim: number;
}

export interface AnimationStep {
  step: number;
  description: string;
  stage: QueryState['stage'];
  highlight?: {
    type: 'point' | 'cluster' | 'edge' | 'node';
    ids: number[];
    action: 'highlight' | 'fade' | 'path' | 'active';
  };
}

// ─── Build Phase Types ──────────────────────────────────────────────────────────

export interface KMeansState {
  iteration: number;
  maxIterations: number;
  centroids: { x: number; y: number }[];
  assignments: number[];
  converged: boolean;
}

export interface PQBuildState {
  trainedSubspaces: number;
  totalSubspaces: number;
  compressionProgress: number; // 0–1
}

export interface HNSWBuildState {
  insertedPoints: number;
  totalPoints: number;
  currentLayer: number;
  edgeCount: number;
  lastInsertedIds: number[]; // point IDs in last batch
  nodes: HNSWNode[];
}

export interface BuildPhase {
  stage: 'idle' | 'kmeans' | 'pq' | 'hnsw' | 'complete';
  progress: number; // 0–1 overall
  kmeans?: KMeansState;
  pq?: PQBuildState;
  hnsw?: HNSWBuildState;
}

// Seeded random for reproducibility
// BUG FIX: use >>> 0 (unsigned 32-bit) so state is always [0, 2^32-1];
// dividing by 0x100000000 guarantees output in [0, 1) – no negative indices.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000; // [0, 1) guaranteed
  };
}

// Generate random 2D points with clusters
export function generateClusteredData(
  numPoints: number,
  numClusters: number,
  seed: number = 42
): { points: Point[]; clusters: Cluster[] } {
  const rng = seededRandom(seed);
  const points: Point[] = [];

  // Generate cluster centroids with some separation
  const clusterCentroids: { x: number; y: number }[] = [];
  for (let c = 0; c < numClusters; c++) {
    const angle = (c / numClusters) * Math.PI * 2;
    const radius = 0.25 + rng() * 0.15;
    clusterCentroids.push({
      x: 0.5 + Math.cos(angle) * radius,
      y: 0.5 + Math.sin(angle) * radius
    });
  }

  // Generate points around cluster centroids with Gaussian-like distribution
  const CLUSTER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  for (let i = 0; i < numPoints; i++) {
    const clusterId = Math.floor(rng() * numClusters);
    const centroid = clusterCentroids[clusterId];
    // Gaussian-like spread
    const spread = 0.08;
    const u1 = rng();
    const u2 = rng();
    const radius = spread * Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;

    points.push({
      id: i,
      x: Math.max(0.05, Math.min(0.95, centroid.x + radius * Math.cos(theta))),
      y: Math.max(0.05, Math.min(0.95, centroid.y + radius * Math.sin(theta))),
      clusterId,
      layer: 0 // Will be assigned during HNSW construction
    });
  }

  // Build cluster info
  const clusters: Cluster[] = clusterCentroids.map((c, i) => ({
    id: i,
    centroid: c,
    points: points.filter((p) => p.clusterId === i).map((p) => p.id)
  }));

  return { points, clusters };
}

// ─── IVF Partitioning (k-means) ────────────────────────────────────────────────

export function computeIVFPartitions(
  points: Point[],
  numPartitions: number,
  iterations: number = 10
): Cluster[] {
  const rng = seededRandom(12345);
  const centroids: { x: number; y: number }[] = [];

  // Initialize centroids randomly from existing points
  const used = new Set<number>();
  while (centroids.length < numPartitions) {
    const idx = Math.floor(rng() * points.length);
    if (!used.has(idx)) {
      used.add(idx);
      centroids.push({ x: points[idx].x, y: points[idx].y });
    }
  }

  let assignments = new Array(points.length).fill(0);

  // k-means iterations
  for (let iter = 0; iter < iterations; iter++) {
    // Assign points to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dx = points[i].x - centroids[c].x;
        const dy = points[i].y - centroids[c].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          minIdx = c;
        }
      }
      assignments[i] = minIdx;
    }

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      const clusterPoints = points.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length > 0) {
        centroids[c] = {
          x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
          y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length
        };
      }
    }
  }

  // Build final clusters
  const clusters: Cluster[] = centroids.map((c, i) => ({
    id: i,
    centroid: c,
    points: points.filter((_, idx) => assignments[idx] === i).map((p) => p.id)
  }));

  // Update point cluster assignments
  for (let i = 0; i < points.length; i++) {
    points[i].clusterId = assignments[i];
  }

  return clusters;
}

// ─── HNSW Graph Construction ───────────────────────────────────────────────────

export function buildHNSWGraph(
  points: Point[],
  numLayers: number = 3,
  M: number = 6, // max connections per node
  mL: number = 0.5 // level decay parameter
): HNSWNode[] {
  const rng = seededRandom(54321);
  const nodes: HNSWNode[] = [];

  // Assign layer to each point based on exponentially decaying probability
  const levelCounts = new Array(numLayers).fill(0);

  for (let i = 0; i < points.length; i++) {
    // Geometric distribution for layer selection
    // Standard HNSW: max_layer = floor(-ln(uniform) * mL)
    // This gives exponentially fewer nodes at higher layers
    let layer = 0;
    while (layer < numLayers - 1 && rng() < mL) {
      layer++;
    }
    points[i].layer = layer;
    levelCounts[layer]++;
  }

  // Create nodes for each point-layer combination
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    // Node exists in layers 0 through point.layer
    for (let l = 0; l <= point.layer; l++) {
      nodes.push({
        id: nodes.length,
        pointId: point.id,
        layer: l,
        neighbors: [],
        x: point.x,
        y: point.y
      });
    }
  }

  // Build connections using nearest neighbor heuristic
  // This is a simplified version - in real HNSW this is more complex
  for (const point of points) {
    // Get all nodes for this point across all layers
    const pointNodes = nodes.filter((n) => n.pointId === point.id);

    for (const node of pointNodes) {
      // Find potential neighbors (other nodes in same layer)
      const sameLayerNodes = nodes.filter(
        (n) => n.layer === node.layer && n.id !== node.id && n.pointId !== point.id
      );

      // Sort by distance and take M nearest
      const withDist = sameLayerNodes.map((n) => ({
        node: n,
        dist: Math.sqrt((point.x - n.x) ** 2 + (point.y - n.y) ** 2)
      }));
      withDist.sort((a, b) => a.dist - b.dist);

      // Add nearest neighbors (bidirectional)
      const numConn = Math.min(M, withDist.length);
      for (let i = 0; i < numConn; i++) {
        const neighborId = withDist[i].node.id;
        if (!node.neighbors.includes(neighborId)) {
          node.neighbors.push(neighborId);
        }
        // Make bidirectional
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode && !neighborNode.neighbors.includes(node.id)) {
          neighborNode.neighbors.push(node.id);
        }
      }
    }
  }

  return nodes;
}

// ─── HNSW Search (Greedy Traversal) ───────────────────────────────────────────

export function findNearestInLayer(
  nodes: HNSWNode[],
  query: { x: number; y: number },
  startNodeId: number,
  layer: number,
  ef: number = 10
): { nodeId: number; distance: number } {
  // Get nodes in this layer
  const layerNodes = nodes.filter((n) => n.layer === layer);
  if (layerNodes.length === 0) {
    return { nodeId: startNodeId, distance: Infinity };
  }

  // Greedy search in layer
  let currentId = startNodeId;
  let currentDist = Math.sqrt(
    (query.x - (nodes.find((n) => n.id === currentId)?.x ?? 0)) ** 2 +
    (query.y - (nodes.find((n) => n.id === currentId)?.y ?? 0)) ** 2
  );

  let visited = new Set<number>([currentId]);

  for (let iter = 0; iter < 50; iter++) {
    const currentNode = nodes.find((n) => n.id === currentId);
    if (!currentNode) break;

    // Check neighbors
    let improved = false;
    for (const neighborId of currentNode.neighbors) {
      if (visited.has(neighborId)) continue;

      const neighborNode = nodes.find((n) => n.id === neighborId);
      if (!neighborNode) continue;

      const dist = Math.sqrt(
        (query.x - neighborNode.x) ** 2 + (query.y - neighborNode.y) ** 2
      );

      if (dist < currentDist) {
        currentId = neighborId;
        currentDist = dist;
        improved = true;
        visited.add(neighborId);
      }
    }

    if (!improved) break; // Local minimum reached
  }

  return { nodeId: currentId, distance: currentDist };
}

export function searchHNSW(
  nodes: HNSWNode[],
  query: { x: number; y: number },
  efConstruction: number = 10,
  numLayers: number = 3
): SearchPath[] {
  const paths: SearchPath[] = [];

  const topNodes = nodes.filter((n) => n.layer === numLayers - 1);
  if (topNodes.length === 0) return paths;

  // BUG FIX: track by pointId so we can find the correct node in each lower layer.
  // Previously, the node-ID from layer L was passed as the start for layer L-1;
  // that node's neighbors are all in layer L, so the traversal never actually
  // explored the target layer.
  let currentPointId = topNodes[0].pointId;

  for (let layer = numLayers - 1; layer >= 0; layer--) {
    // Find the node that represents currentPointId in THIS layer
    const layerEntryNode = nodes.find(
      (n) => n.pointId === currentPointId && n.layer === layer
    );
    if (!layerEntryNode) continue; // point doesn't exist in this layer – skip

    const startNodeId = layerEntryNode.id;
    const startDist = Math.sqrt(
      (query.x - layerEntryNode.x) ** 2 + (query.y - layerEntryNode.y) ** 2
    );

    const result = findNearestInLayer(nodes, query, startNodeId, layer, efConstruction);

    paths.push({
      nodeIds: [startNodeId, result.nodeId],
      distances: [startDist, result.distance],
      layer
    });

    // Descend: use the best node's pointId as entry for the next layer
    const resultNode = nodes.find((n) => n.id === result.nodeId);
    currentPointId = resultNode?.pointId ?? currentPointId;
  }

  return paths;
}

// ─── PQ Compression Simulation ─────────────────────────────────────────────────

export function simulatePQCompression(
  points: Point[],
  numSubspaces: number = 8
): { originalMemory: number; compressedMemory: number; codebook: PQCodebook } {
  // Simulate: original = 128 floats (512 bytes), compressed = 8 bytes
  const originalMemory = points.length * 128 * 4; // 128 floats * 4 bytes
  const compressedMemory = points.length * numSubspaces; // 8 bytes per vector

  // Generate codebook (for visualization)
  const codebook: PQCodebook = {
    centroids: [],
    numSubspaces,
    subspaceDim: 128 / numSubspaces
  };

  // Simulate codebook generation (random centroids for each subspace)
  for (let s = 0; s < numSubspaces; s++) {
    const subspaceCentroids: number[][] = [];
    // 256 centroids per subspace (8-bit)
    for (let c = 0; c < 256; c++) {
      const centroid: number[] = [];
      for (let d = 0; d < codebook.subspaceDim; d++) {
        centroid.push((Math.random() * 2 - 1));
      }
      subspaceCentroids.push(centroid);
    }
    codebook.centroids.push(subspaceCentroids);
  }

  return { originalMemory, compressedMemory, codebook };
}

// ─── Full Search Pipeline ─────────────────────────────────────────────────────

export function runSearchPipeline(
  points: Point[],
  clusters: Cluster[],
  nodes: HNSWNode[],
  query: { x: number; y: number },
  numLayers: number,
  ivfProbes: number = 3,
  efSearch: number = 10
): QueryState {
  // Stage 1: IVF - find nearest clusters
  const clusterDistances = clusters.map((c) => ({
    id: c.id,
    dist: Math.sqrt(
      (query.x - c.centroid.x) ** 2 + (query.y - c.centroid.y) ** 2
    )
  }));
  clusterDistances.sort((a, b) => a.dist - b.dist);
  const nearestClusters = clusterDistances.slice(0, ivfProbes);

  // Get candidate points from nearest clusters
  const ivfCandidates = new Set<number>();
  for (const c of nearestClusters) {
    const cluster = clusters.find((cl) => cl.id === c.id);
    if (cluster) {
      for (const pid of cluster.points) {
        ivfCandidates.add(pid);
      }
    }
  }

  const pqResult = simulatePQCompression(points);

  // Stage 2-3: HNSW search on candidates
  // Simplified: just search in HNSW from candidates
  let hnswPath: SearchPath[] = [];
  if (nodes.length > 0) {
    hnswPath = searchHNSW(nodes, query, efSearch, numLayers);
  }

  // Stage 4: Exact search on final candidates (top K nearest)
  const candidatePoints = Array.from(ivfCandidates).map((pid) => ({
    id: pid,
    dist: Math.sqrt(
      (query.x - points[pid].x) ** 2 + (query.y - points[pid].y) ** 2
    )
  }));
  candidatePoints.sort((a, b) => a.dist - b.dist);
  const exactResults = candidatePoints.slice(0, 10).map((p) => p.id);

  // Calculate metrics
  const totalVectors = points.length;
  const metrics: SearchMetrics = {
    totalVectors,
    ivfCandidates: ivfCandidates.size,
    pqComparisons: ivfCandidates.size,
    hnswNodesVisited: hnswPath.reduce((sum, p) => sum + p.nodeIds.length, 0),
    finalCandidates: exactResults.length,
    memoryOriginal: pqResult.originalMemory,
    memoryCompressed: pqResult.compressedMemory,
    latency: Math.round(5 + Math.log2(totalVectors) * 0.5 + (ivfCandidates.size / totalVectors) * 10),
    recall: 0.95 + Math.random() * 0.04
  };

  return {
    stage: 'complete',
    ivfCandidates: Array.from(ivfCandidates),
    pqCompressed: true,
    hnswPath,
    exactResults,
    progress: 1,
    searchMetrics: metrics
  };
}

// ─── Animation Steps Generator ─────────────────────────────────────────────────

export function generateAnimationSteps(
  query: { x: number; y: number },
  clusters: Cluster[],
  nodes: HNSWNode[],
  ivfProbes: number
): AnimationStep[] {
  const steps: AnimationStep[] = [];
  let step = 0;

  // Step 0: Query arrives
  steps.push({
    step: step++,
    description: 'Query vector enters the system',
    stage: 'idle',
    highlight: {
      type: 'point',
      ids: [],
      action: 'highlight'
    }
  });

  // IVF steps
  const clusterDistances = clusters.map((c) => ({
    id: c.id,
    dist: Math.sqrt(
      (query.x - c.centroid.x) ** 2 + (query.y - c.centroid.y) ** 2
    )
  }));
  clusterDistances.sort((a, b) => a.dist - b.dist);
  const nearestClusterIds = clusterDistances.slice(0, ivfProbes).map((c) => c.id);

  steps.push({
    step: step++,
    description: `IVF: Find ${ivfProbes} nearest partitions`,
    stage: 'ivf',
    highlight: {
      type: 'cluster',
      ids: nearestClusterIds,
      action: 'highlight'
    }
  });

  steps.push({
    step: step++,
    description: `IVF: Probe ${nearestClusterIds.reduce((sum, c) => sum + clusters[c].points.length, 0)} candidate vectors`,
    stage: 'ivf',
    highlight: {
      type: 'cluster',
      ids: nearestClusterIds,
      action: 'active'
    }
  });

  // PQ step
  steps.push({
    step: step++,
    description: 'PQ: Compress vectors for fast distance estimation',
    stage: 'pq',
    highlight: {
      type: 'point',
      ids: [],
      action: 'fade'
    }
  });

  // HNSW steps
  if (nodes.length > 0) {
    const topLayer = Math.max(...nodes.map((n) => n.layer));
    
    steps.push({
      step: step++,
      description: `HNSW: Start search from layer ${topLayer}`,
      stage: 'hnsw',
      highlight: {
        type: 'node',
        ids: nodes.filter((n) => n.layer === topLayer).map((n) => n.id),
        action: 'highlight'
      }
    });

    steps.push({
      step: step++,
      description: 'HNSW: Greedy traversal finds nearest node',
      stage: 'hnsw',
      highlight: {
        type: 'edge',
        ids: [],
        action: 'path'
      }
    });

    steps.push({
      step: step++,
      description: 'HNSW: Descend to lower layer',
      stage: 'hnsw',
      highlight: {
        type: 'node',
        ids: [],
        action: 'active'
      }
    });
  }

  // Exact reranking
  steps.push({
    step: step++,
    description: 'Exact: Compute final distances and return top-K',
    stage: 'exact',
    highlight: {
      type: 'point',
      ids: [],
      action: 'active'
    }
  });

  // Complete
  steps.push({
    step: step++,
    description: 'Search complete! Found 10 nearest neighbors',
    stage: 'complete',
    highlight: {
      type: 'point',
      ids: [],
      action: 'active'
    }
  });

  return steps;
}

// ─── Metrics Calculations ──────────────────────────────────────────────────────

export function calculateMetrics(
  points: Point[],
  clusters: Cluster[],
  ivfProbes: number,
  pqEnabled: boolean
): SearchMetrics {
  const totalVectors = points.length;
  const avgClusterSize = points.length / clusters.length;
  const ivfCandidates = avgClusterSize * ivfProbes;

  return {
    totalVectors,
    ivfCandidates: Math.round(ivfCandidates),
    pqComparisons: pqEnabled ? Math.round(ivfCandidates) : 0,
    hnswNodesVisited: Math.round(Math.log2(ivfCandidates) * 3),
    finalCandidates: 10,
    memoryOriginal: totalVectors * 128 * 4,
    memoryCompressed: pqEnabled ? totalVectors * 8 : totalVectors * 128 * 4,
    latency: Math.round(5 + Math.log2(totalVectors) * 0.5),
    recall: 0.97
  };
}

// ─── Build Phase Generators ─────────────────────────────────────────────────────

/**
 * Yields k-means state after each iteration for animated IVF construction.
 */
export function* computeIVFPartitionsAnimated(
  points: Point[],
  numPartitions: number,
  maxIterations: number = 10
): Generator<KMeansState> {
  const rng = seededRandom(12345);
  const centroids: { x: number; y: number }[] = [];

  // Initialize centroids from random existing points
  const used = new Set<number>();
  while (centroids.length < numPartitions) {
    const idx = Math.floor(rng() * points.length);
    if (!used.has(idx)) {
      used.add(idx);
      centroids.push({ x: points[idx].x, y: points[idx].y });
    }
  }

  let assignments = new Array(points.length).fill(0);

  // Yield initial state (centroids placed, no assignments yet)
  yield {
    iteration: 0,
    maxIterations,
    centroids: centroids.map(c => ({ ...c })),
    assignments: [...assignments],
    converged: false
  };

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dx = points[i].x - centroids[c].x;
        const dy = points[i].y - centroids[c].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          minIdx = c;
        }
      }
      if (assignments[i] !== minIdx) changed = true;
      assignments[i] = minIdx;
    }

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      const clusterPoints = points.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length > 0) {
        centroids[c] = {
          x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
          y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length
        };
      }
    }

    const converged = !changed;
    yield {
      iteration: iter + 1,
      maxIterations,
      centroids: centroids.map(c => ({ ...c })),
      assignments: [...assignments],
      converged
    };

    if (converged) return;
  }
}

/**
 * Yields HNSW graph state after each batch of node insertions.
 */
export function* buildHNSWGraphAnimated(
  points: Point[],
  numLayers: number = 3,
  M: number = 6,
  mL: number = 0.5,
  batchSize: number = 8
): Generator<HNSWBuildState> {
  const rng = seededRandom(54321);
  const nodes: HNSWNode[] = [];

  // Pre-assign layers to all points
  for (let i = 0; i < points.length; i++) {
    let layer = 0;
    while (layer < numLayers - 1 && rng() < mL) {
      layer++;
    }
    points[i].layer = layer;
  }

  let edgeCount = 0;

  // Insert points in batches
  for (let batchStart = 0; batchStart < points.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, points.length);
    const batchPointIds: number[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const point = points[i];
      batchPointIds.push(point.id);

      // Create nodes for this point in layers 0..point.layer
      for (let l = 0; l <= point.layer; l++) {
        nodes.push({
          id: nodes.length,
          pointId: point.id,
          layer: l,
          neighbors: [],
          x: point.x,
          y: point.y
        });
      }

      // Connect to existing nodes in each layer
      const pointNodes = nodes.filter(n => n.pointId === point.id);
      for (const node of pointNodes) {
        const sameLayerNodes = nodes.filter(
          n => n.layer === node.layer && n.id !== node.id && n.pointId !== point.id
        );
        const withDist = sameLayerNodes.map(n => ({
          node: n,
          dist: Math.sqrt((point.x - n.x) ** 2 + (point.y - n.y) ** 2)
        }));
        withDist.sort((a, b) => a.dist - b.dist);

        const numConn = Math.min(M, withDist.length);
        for (let c = 0; c < numConn; c++) {
          const neighborId = withDist[c].node.id;
          if (!node.neighbors.includes(neighborId)) {
            node.neighbors.push(neighborId);
            edgeCount++;
          }
          const neighborNode = nodes.find(n => n.id === neighborId);
          if (neighborNode && !neighborNode.neighbors.includes(node.id)) {
            neighborNode.neighbors.push(node.id);
            edgeCount++;
          }
        }
      }
    }

    // Determine the highest layer among currently inserted nodes
    const maxLayer = nodes.length > 0 ? Math.max(...nodes.map(n => n.layer)) : 0;

    yield {
      insertedPoints: batchEnd,
      totalPoints: points.length,
      currentLayer: maxLayer,
      edgeCount,
      lastInsertedIds: batchPointIds,
      nodes: [...nodes] // snapshot
    };
  }
}