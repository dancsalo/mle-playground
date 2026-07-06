/**
 * GCN (Graph Convolutional Network) Simulator
 *
 * Implements a 2-layer GCN for node classification on a small graph.
 * Based on Kipf & Welling (2017) and the Distill "A Gentle Introduction to GNNs".
 *
 * Key formula per layer:
 *   H^(l+1) = σ( D̃^(-½) Ã D̃^(-½) H^(l) W^(l) )
 *
 * where:
 *   Ã = A + I  (adjacency with self-loops)
 *   D̃ = degree matrix of Ã
 *   H^(l) = node feature matrix at layer l
 *   W^(l) = learnable weight matrix
 *   σ = activation (ReLU for hidden, softmax for output)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: number;
  label: string;
  features: number[];       // Input feature vector
  trueClass: number;        // Ground truth class (0, 1, 2, ...)
  isLabeled: boolean;       // Whether used in training
  x?: number;              // Layout position
  y?: number;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  numClasses: number;
  classNames: string[];
  classColors: string[];
}

export interface GCNWeights {
  W1: number[][];   // [inputDim x hiddenDim]
  W2: number[][];   // [hiddenDim x numClasses]
  b1: number[];     // [hiddenDim]
  b2: number[];     // [numClasses]
}

export interface LayerActivation {
  /** Pre-activation (after aggregation + linear transform) */
  preActivation: number[][];
  /** Post-activation (after ReLU / softmax) */
  postActivation: number[][];
  /** Messages received per node from neighbors */
  messages: { from: number; to: number; value: number[] }[];
}

export interface ForwardResult {
  layer1: LayerActivation;
  layer2: LayerActivation;
  predictions: number[][];   // [numNodes x numClasses] softmax probabilities
  predictedClasses: number[];
}

export interface TrainingStep {
  epoch: number;
  loss: number;
  accuracy: number;
  forward: ForwardResult;
  gradW1Norm: number;
  gradW2Norm: number;
}

export interface GCNState {
  graph: Graph;
  weights: GCNWeights;
  history: TrainingStep[];
  epoch: number;
  learningRate: number;
  hiddenDim: number;
}

// ─── Graph Datasets ──────────────────────────────────────────────────────────

/**
 * Small "academic social network" graph for node classification.
 * Three groups: ML researchers, Systems researchers, Theory researchers.
 * Features: [#papers, #citations_norm, years_active_norm, collab_score]
 */
export function createKarateGraph(): Graph {
  const nodes: GraphNode[] = [
    // ML Researchers (class 0) - blue
    { id: 0,  label: "Alice",    features: [0.9, 0.8, 0.7, 0.6], trueClass: 0, isLabeled: true },
    { id: 1,  label: "Bob",      features: [0.7, 0.9, 0.5, 0.8], trueClass: 0, isLabeled: true },
    { id: 2,  label: "Carol",    features: [0.8, 0.7, 0.6, 0.7], trueClass: 0, isLabeled: false },
    { id: 3,  label: "Dan",      features: [0.6, 0.6, 0.8, 0.5], trueClass: 0, isLabeled: false },
    { id: 4,  label: "Eve",      features: [0.85, 0.75, 0.4, 0.9], trueClass: 0, isLabeled: false },
    // Systems Researchers (class 1) - green
    { id: 5,  label: "Frank",    features: [0.4, 0.3, 0.9, 0.2], trueClass: 1, isLabeled: true },
    { id: 6,  label: "Grace",    features: [0.3, 0.4, 0.8, 0.3], trueClass: 1, isLabeled: true },
    { id: 7,  label: "Hank",     features: [0.5, 0.2, 0.7, 0.4], trueClass: 1, isLabeled: false },
    { id: 8,  label: "Iris",     features: [0.35, 0.35, 0.85, 0.25], trueClass: 1, isLabeled: false },
    // Theory Researchers (class 2) - orange
    { id: 9,  label: "Jack",     features: [0.2, 0.5, 0.3, 0.1], trueClass: 2, isLabeled: true },
    { id: 10, label: "Kate",     features: [0.1, 0.6, 0.2, 0.15], trueClass: 2, isLabeled: true },
    { id: 11, label: "Leo",      features: [0.25, 0.4, 0.4, 0.2], trueClass: 2, isLabeled: false },
    { id: 12, label: "Mia",      features: [0.15, 0.55, 0.25, 0.1], trueClass: 2, isLabeled: false },
  ];

  // Edges: within-group connections are dense, between-group are sparse
  const edges: GraphEdge[] = [
    // ML cluster (dense)
    { source: 0, target: 1 },
    { source: 0, target: 2 },
    { source: 0, target: 3 },
    { source: 1, target: 2 },
    { source: 1, target: 4 },
    { source: 2, target: 4 },
    { source: 3, target: 4 },
    // Systems cluster (dense)
    { source: 5, target: 6 },
    { source: 5, target: 7 },
    { source: 5, target: 8 },
    { source: 6, target: 7 },
    { source: 6, target: 8 },
    { source: 7, target: 8 },
    // Theory cluster (dense)
    { source: 9, target: 10 },
    { source: 9, target: 11 },
    { source: 9, target: 12 },
    { source: 10, target: 11 },
    { source: 10, target: 12 },
    { source: 11, target: 12 },
    // Cross-cluster bridges (sparse)
    { source: 3, target: 5 },   // Dan (ML) - Frank (Sys) — interdisciplinary
    { source: 4, target: 7 },   // Eve (ML) - Hank (Sys)
    { source: 8, target: 11 },  // Iris (Sys) - Leo (Theory)
    { source: 2, target: 9 },   // Carol (ML) - Jack (Theory)
  ];

  return {
    nodes,
    edges,
    numClasses: 3,
    classNames: ["ML", "Systems", "Theory"],
    classColors: ["#3B82F6", "#10B981", "#F59E0B"]
  };
}

/**
 * Molecule graph — classify atoms as part of a ring vs chain vs functional group
 */
export function createMoleculeGraph(): Graph {
  const nodes: GraphNode[] = [
    // Ring carbons (class 0) - blue
    { id: 0,  label: "C₁", features: [0.8, 0.0, 1.0, 0.5], trueClass: 0, isLabeled: true },
    { id: 1,  label: "C₂", features: [0.8, 0.0, 1.0, 0.5], trueClass: 0, isLabeled: false },
    { id: 2,  label: "C₃", features: [0.8, 0.0, 1.0, 0.5], trueClass: 0, isLabeled: true },
    { id: 3,  label: "C₄", features: [0.8, 0.0, 1.0, 0.5], trueClass: 0, isLabeled: false },
    { id: 4,  label: "C₅", features: [0.8, 0.0, 1.0, 0.5], trueClass: 0, isLabeled: false },
    { id: 5,  label: "C₆", features: [0.8, 0.0, 1.0, 0.5], trueClass: 0, isLabeled: true },
    // Chain carbons (class 1) - green
    { id: 6,  label: "C₇", features: [0.8, 0.0, 0.5, 0.3], trueClass: 1, isLabeled: true },
    { id: 7,  label: "C₈", features: [0.8, 0.0, 0.5, 0.2], trueClass: 1, isLabeled: false },
    { id: 8,  label: "C₉", features: [0.8, 0.0, 0.5, 0.1], trueClass: 1, isLabeled: true },
    // Functional group (class 2) - orange
    { id: 9,  label: "O",   features: [0.0, 1.0, 0.0, 0.8], trueClass: 2, isLabeled: true },
    { id: 10, label: "H₁",  features: [0.0, 0.0, 0.0, 0.1], trueClass: 2, isLabeled: false },
    { id: 11, label: "H₂",  features: [0.0, 0.0, 0.0, 0.1], trueClass: 2, isLabeled: true },
  ];

  const edges: GraphEdge[] = [
    // Benzene ring
    { source: 0, target: 1 },
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 3, target: 4 },
    { source: 4, target: 5 },
    { source: 5, target: 0 },
    // Chain
    { source: 0, target: 6 },
    { source: 6, target: 7 },
    { source: 7, target: 8 },
    // Functional group
    { source: 8, target: 9 },
    { source: 9, target: 10 },
    { source: 8, target: 11 },
  ];

  return {
    nodes,
    edges,
    numClasses: 3,
    classNames: ["Ring", "Chain", "Functional"],
    classColors: ["#3B82F6", "#10B981", "#F59E0B"]
  };
}

export const DATASETS = [
  { name: "Academic Network", create: createKarateGraph },
  { name: "Molecule", create: createMoleculeGraph },
];

// ─── Linear Algebra Helpers ──────────────────────────────────────────────────

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function zerosVec(n: number): number[] {
  return Array(n).fill(0);
}

/** Xavier/Glorot initialization */
function xavierInit(rows: number, cols: number): number[][] {
  const scale = Math.sqrt(2.0 / (rows + cols));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * scale)
  );
}

/** Matrix multiply: A[m×k] × B[k×n] → C[m×n] */
function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const k = A[0].length;
  const n = B[0].length;
  const C = zeros(m, n);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let p = 0; p < k; p++) {
        sum += A[i][p] * B[p][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

/** Add bias to each row */
function addBias(M: number[][], bias: number[]): number[][] {
  return M.map(row => row.map((v, j) => v + bias[j]));
}

/** ReLU activation */
function relu(M: number[][]): number[][] {
  return M.map(row => row.map(v => Math.max(0, v)));
}

/** Softmax per row */
function softmax(M: number[][]): number[][] {
  return M.map(row => {
    const maxVal = Math.max(...row);
    const exps = row.map(v => Math.exp(v - maxVal));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  });
}

/** Frobenius norm of a matrix */
function frobNorm(M: number[][]): number {
  let sum = 0;
  for (const row of M) {
    for (const v of row) {
      sum += v * v;
    }
  }
  return Math.sqrt(sum);
}

// ─── GCN Core ────────────────────────────────────────────────────────────────

/**
 * Compute normalized adjacency matrix with self-loops:
 *   Â = D̃^(-½) Ã D̃^(-½)
 * where Ã = A + I
 */
export function computeNormAdjacency(graph: Graph): number[][] {
  const n = graph.nodes.length;
  // Build adjacency with self-loops
  const A = zeros(n, n);
  for (let i = 0; i < n; i++) A[i][i] = 1; // self-loops
  for (const { source, target } of graph.edges) {
    A[source][target] = 1;
    A[target][source] = 1; // undirected
  }
  // Compute degree
  const D = zerosVec(n);
  for (let i = 0; i < n; i++) {
    D[i] = A[i].reduce((a, b) => a + b, 0);
  }
  // D^(-1/2) A D^(-1/2)
  const Anorm = zeros(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (A[i][j] !== 0) {
        Anorm[i][j] = A[i][j] / Math.sqrt(D[i] * D[j]);
      }
    }
  }
  return Anorm;
}

/**
 * Get neighbors of a node (including self)
 */
export function getNeighbors(graph: Graph, nodeId: number): number[] {
  const neighbors = new Set<number>([nodeId]); // self-loop
  for (const { source, target } of graph.edges) {
    if (source === nodeId) neighbors.add(target);
    if (target === nodeId) neighbors.add(source);
  }
  return [...neighbors].sort((a, b) => a - b);
}

/**
 * Forward pass through 2-layer GCN
 */
export function forward(
  graph: Graph,
  weights: GCNWeights,
  Anorm: number[][]
): ForwardResult {
  const n = graph.nodes.length;
  const H0 = graph.nodes.map(node => [...node.features]); // [n x inputDim]

  // ─── Layer 1: Â H⁰ W¹ + b¹, then ReLU ─────────────────────────────────
  const AH0 = matmul(Anorm, H0); // [n x inputDim] — aggregated features
  const Z1 = addBias(matmul(AH0, weights.W1), weights.b1); // [n x hiddenDim]
  const H1 = relu(Z1); // [n x hiddenDim]

  // Collect messages for layer 1 visualization
  const messages1: LayerActivation['messages'] = [];
  for (let i = 0; i < n; i++) {
    const neighbors = getNeighbors(graph, i);
    for (const j of neighbors) {
      if (j !== i) { // don't show self-loop as a "message"
        const normFactor = 1 / Math.sqrt(
          getNeighbors(graph, i).length * getNeighbors(graph, j).length
        );
        messages1.push({
          from: j,
          to: i,
          value: H0[j].map(v => v * normFactor)
        });
      }
    }
  }

  // ─── Layer 2: Â H¹ W² + b², then Softmax ──────────────────────────────
  const AH1 = matmul(Anorm, H1); // [n x hiddenDim]
  const Z2 = addBias(matmul(AH1, weights.W2), weights.b2); // [n x numClasses]
  const H2 = softmax(Z2); // [n x numClasses]

  const messages2: LayerActivation['messages'] = [];
  for (let i = 0; i < n; i++) {
    const neighbors = getNeighbors(graph, i);
    for (const j of neighbors) {
      if (j !== i) {
        const normFactor = 1 / Math.sqrt(
          getNeighbors(graph, i).length * getNeighbors(graph, j).length
        );
        messages2.push({
          from: j,
          to: i,
          value: H1[j].map(v => v * normFactor)
        });
      }
    }
  }

  const predictedClasses = H2.map(row => row.indexOf(Math.max(...row)));

  return {
    layer1: {
      preActivation: Z1,
      postActivation: H1,
      messages: messages1
    },
    layer2: {
      preActivation: Z2,
      postActivation: H2,
      messages: messages2
    },
    predictions: H2,
    predictedClasses
  };
}

/**
 * Cross-entropy loss on labeled nodes only
 */
export function crossEntropyLoss(predictions: number[][], graph: Graph): number {
  let loss = 0;
  let count = 0;
  for (const node of graph.nodes) {
    if (node.isLabeled) {
      const p = Math.max(predictions[node.id][node.trueClass], 1e-10);
      loss -= Math.log(p);
      count++;
    }
  }
  return loss / count;
}

/**
 * Accuracy on all nodes (for visualization)
 */
export function computeAccuracy(predictedClasses: number[], graph: Graph): number {
  let correct = 0;
  for (const node of graph.nodes) {
    if (predictedClasses[node.id] === node.trueClass) correct++;
  }
  return correct / graph.nodes.length;
}

/**
 * Training accuracy (only labeled nodes)
 */
export function computeTrainAccuracy(predictedClasses: number[], graph: Graph): number {
  let correct = 0;
  let count = 0;
  for (const node of graph.nodes) {
    if (node.isLabeled) {
      if (predictedClasses[node.id] === node.trueClass) correct++;
      count++;
    }
  }
  return count > 0 ? correct / count : 0;
}

// ─── Backpropagation (manual gradient computation) ───────────────────────────

/**
 * One training step with gradient descent.
 * Computes gradients via manual backprop through the 2-layer GCN.
 */
export function trainStepGCN(
  state: GCNState,
  Anorm: number[][]
): GCNState {
  const { graph, weights, learningRate } = state;
  const n = graph.nodes.length;
  const inputDim = graph.nodes[0].features.length;
  const hiddenDim = state.hiddenDim;
  const numClasses = graph.numClasses;

  // Forward pass
  const H0 = graph.nodes.map(node => [...node.features]);
  const AH0 = matmul(Anorm, H0);
  const Z1 = addBias(matmul(AH0, weights.W1), weights.b1);
  const H1 = relu(Z1);
  const AH1 = matmul(Anorm, H1);
  const Z2 = addBias(matmul(AH1, weights.W2), weights.b2);
  const probs = softmax(Z2); // [n x numClasses]

  // Backward pass
  // dL/dZ2 = probs - one_hot(y) for labeled nodes, 0 for unlabeled
  const dZ2 = zeros(n, numClasses);
  let labeledCount = 0;
  for (const node of graph.nodes) {
    if (node.isLabeled) {
      for (let c = 0; c < numClasses; c++) {
        dZ2[node.id][c] = probs[node.id][c] - (c === node.trueClass ? 1 : 0);
      }
      labeledCount++;
    }
  }
  // Average over labeled nodes
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numClasses; c++) {
      dZ2[i][c] /= labeledCount;
    }
  }

  // dL/dW2 = (Â H1)^T dZ2
  const AH1T = transpose(AH1);
  const dW2 = matmul(AH1T, dZ2);
  const db2 = zerosVec(numClasses);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numClasses; c++) {
      db2[c] += dZ2[i][c];
    }
  }

  // dL/dH1 = Â^T dZ2 W2^T, masked by ReLU derivative
  const AnormT = transpose(Anorm);
  const W2T = transpose(weights.W2);
  const dAH1 = matmul(dZ2, W2T); // [n x hiddenDim]
  const dH1 = matmul(AnormT, dAH1); // [n x hiddenDim]

  // ReLU mask
  const dZ1 = zeros(n, hiddenDim);
  for (let i = 0; i < n; i++) {
    for (let h = 0; h < hiddenDim; h++) {
      dZ1[i][h] = Z1[i][h] > 0 ? dH1[i][h] : 0;
    }
  }

  // dL/dW1 = (Â H0)^T dZ1
  const AH0T = transpose(AH0);
  const dW1 = matmul(AH0T, dZ1);
  const db1 = zerosVec(hiddenDim);
  for (let i = 0; i < n; i++) {
    for (let h = 0; h < hiddenDim; h++) {
      db1[h] += dZ1[i][h];
    }
  }

  // Update weights
  const newW1 = weights.W1.map((row, i) => row.map((v, j) => v - learningRate * dW1[i][j]));
  const newW2 = weights.W2.map((row, i) => row.map((v, j) => v - learningRate * dW2[i][j]));
  const newB1 = weights.b1.map((v, i) => v - learningRate * db1[i]);
  const newB2 = weights.b2.map((v, i) => v - learningRate * db2[i]);

  const newWeights: GCNWeights = { W1: newW1, W2: newW2, b1: newB1, b2: newB2 };

  // Compute forward with new weights for the step record
  const fwd = forward(graph, newWeights, Anorm);
  const loss = crossEntropyLoss(fwd.predictions, graph);
  const accuracy = computeAccuracy(fwd.predictedClasses, graph);

  const step: TrainingStep = {
    epoch: state.epoch + 1,
    loss,
    accuracy,
    forward: fwd,
    gradW1Norm: frobNorm(dW1),
    gradW2Norm: frobNorm(dW2)
  };

  return {
    ...state,
    weights: newWeights,
    history: [...state.history, step],
    epoch: state.epoch + 1
  };
}

function transpose(M: number[][]): number[][] {
  const rows = M.length;
  const cols = M[0].length;
  const T = zeros(cols, rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = M[i][j];
    }
  }
  return T;
}

// ─── Initialization ──────────────────────────────────────────────────────────

export function initGCN(graph: Graph, hiddenDim: number = 8, learningRate: number = 0.05): GCNState {
  const inputDim = graph.nodes[0].features.length;
  const numClasses = graph.numClasses;

  const weights: GCNWeights = {
    W1: xavierInit(inputDim, hiddenDim),
    W2: xavierInit(hiddenDim, numClasses),
    b1: zerosVec(hiddenDim),
    b2: zerosVec(numClasses)
  };

  return {
    graph,
    weights,
    history: [],
    epoch: 0,
    learningRate,
    hiddenDim
  };
}

/**
 * Run inference: just a forward pass with current weights
 */
export function inference(state: GCNState, Anorm: number[][]): ForwardResult {
  return forward(state.graph, state.weights, Anorm);
}
