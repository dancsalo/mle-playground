/**
 * RLHF Training Simulator
 * 
 * Uses a tiny synthetic vocabulary and probability tables to simulate
 * PPO, DPO, and GRPO training loops. No real LLM needed — the small
 * vocabulary makes optimization visually understandable.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenDistribution {
  [token: string]: number;
}

export interface PolicyState {
  /** Distribution at each position given context */
  distributions: TokenDistribution[];
}

export interface Rollout {
  tokens: string[];
  logProbs: number[];
  reward: number;
  advantage?: number;
}

export interface TrainingStep {
  stepNumber: number;
  algorithm: 'PPO' | 'DPO' | 'GRPO';
  rollouts: Rollout[];
  oldPolicy: PolicyState;
  newPolicy: PolicyState;
  klDivergence: number;
  entropy: number;
  avgReward: number;
  /** For DPO */
  chosen?: Rollout;
  rejected?: Rollout;
  /** For GRPO */
  groupAdvantages?: number[];
}

export interface SimulationState {
  prompt: string;
  vocab: string[];
  referencePolicy: PolicyState;
  currentPolicies: {
    PPO: PolicyState;
    DPO: PolicyState;
    GRPO: PolicyState;
  };
  history: {
    PPO: TrainingStep[];
    DPO: TrainingStep[];
    GRPO: TrainingStep[];
  };
  stepCount: number;
}

export type Algorithm = 'PPO' | 'DPO' | 'GRPO';

// ─── Prompts & Vocabularies ──────────────────────────────────────────────────

export interface PromptScenario {
  prompt: string;
  vocab: string[];
  positions: number;
  /** Quality scoring function based on generated tokens */
  rewardFn: (tokens: string[]) => number;
  /** Reference initial distributions */
  initialDistributions: TokenDistribution[];
}

export const SCENARIOS: PromptScenario[] = [
  {
    prompt: "Explain why the sky is blue",
    vocab: ["the", "sky", "is", "blue", "because", "light", "scatters", "atmosphere", "reflects", "ocean", "sun", "wavelengths", "short", "molecules", "air"],
    positions: 6,
    rewardFn: (tokens: string[]) => {
      let score = 0;
      // Reward scientific accuracy
      if (tokens.includes("scatters")) score += 0.3;
      if (tokens.includes("wavelengths")) score += 0.25;
      if (tokens.includes("atmosphere")) score += 0.2;
      if (tokens.includes("molecules")) score += 0.2;
      if (tokens.includes("light")) score += 0.15;
      if (tokens.includes("short")) score += 0.15;
      // Penalize incorrect explanations
      if (tokens.includes("reflects") && tokens.includes("ocean")) score -= 0.3;
      // Penalize repetition
      const unique = new Set(tokens);
      if (unique.size < tokens.length * 0.7) score -= 0.2;
      return Math.max(0, Math.min(1, 0.3 + score));
    },
    initialDistributions: [
      { "the": 0.15, "light": 0.12, "because": 0.12, "sky": 0.1, "blue": 0.08, "is": 0.08, "scatters": 0.06, "atmosphere": 0.05, "reflects": 0.05, "ocean": 0.04, "sun": 0.04, "wavelengths": 0.04, "short": 0.03, "molecules": 0.02, "air": 0.02 },
      { "light": 0.14, "scatters": 0.1, "atmosphere": 0.09, "wavelengths": 0.08, "is": 0.08, "the": 0.08, "reflects": 0.08, "blue": 0.07, "sky": 0.06, "ocean": 0.06, "because": 0.05, "sun": 0.04, "short": 0.03, "molecules": 0.02, "air": 0.02 },
      { "in": 0.01, "the": 0.12, "atmosphere": 0.11, "scatters": 0.1, "light": 0.09, "blue": 0.09, "wavelengths": 0.08, "sky": 0.07, "molecules": 0.06, "reflects": 0.06, "short": 0.06, "is": 0.05, "ocean": 0.04, "sun": 0.03, "air": 0.03 },
      { "the": 0.13, "blue": 0.11, "short": 0.1, "light": 0.1, "wavelengths": 0.09, "scatters": 0.08, "atmosphere": 0.07, "molecules": 0.07, "sky": 0.06, "is": 0.06, "reflects": 0.05, "sun": 0.04, "ocean": 0.02, "air": 0.02, "because": 0.0 },
      { "light": 0.13, "molecules": 0.1, "wavelengths": 0.1, "the": 0.09, "atmosphere": 0.09, "scatters": 0.08, "blue": 0.08, "short": 0.07, "air": 0.07, "sky": 0.06, "is": 0.05, "reflects": 0.04, "sun": 0.02, "ocean": 0.01, "because": 0.01 },
      { "blue": 0.12, "light": 0.11, "the": 0.1, "atmosphere": 0.09, "scatters": 0.09, "wavelengths": 0.08, "sky": 0.07, "molecules": 0.07, "short": 0.07, "air": 0.06, "is": 0.05, "sun": 0.04, "reflects": 0.03, "ocean": 0.01, "because": 0.01 },
    ]
  },
  {
    prompt: "What is machine learning?",
    vocab: ["machines", "learn", "from", "data", "patterns", "algorithms", "find", "predict", "train", "models", "statistics", "magic", "computers", "neural", "optimize"],
    positions: 6,
    rewardFn: (tokens: string[]) => {
      let score = 0;
      if (tokens.includes("learn")) score += 0.2;
      if (tokens.includes("data")) score += 0.25;
      if (tokens.includes("patterns")) score += 0.25;
      if (tokens.includes("algorithms")) score += 0.15;
      if (tokens.includes("predict")) score += 0.15;
      if (tokens.includes("train")) score += 0.1;
      if (tokens.includes("models")) score += 0.1;
      // Penalize vague answers
      if (tokens.includes("magic")) score -= 0.4;
      const unique = new Set(tokens);
      if (unique.size < tokens.length * 0.7) score -= 0.2;
      return Math.max(0, Math.min(1, 0.25 + score));
    },
    initialDistributions: [
      { "machines": 0.12, "algorithms": 0.11, "computers": 0.1, "models": 0.09, "data": 0.08, "learn": 0.08, "patterns": 0.07, "find": 0.07, "predict": 0.06, "train": 0.06, "from": 0.05, "statistics": 0.04, "magic": 0.03, "neural": 0.02, "optimize": 0.02 },
      { "learn": 0.14, "find": 0.11, "from": 0.1, "predict": 0.09, "train": 0.08, "data": 0.08, "patterns": 0.08, "algorithms": 0.07, "models": 0.06, "machines": 0.05, "optimize": 0.05, "computers": 0.04, "statistics": 0.03, "neural": 0.01, "magic": 0.01 },
      { "data": 0.14, "patterns": 0.12, "from": 0.1, "models": 0.09, "algorithms": 0.08, "learn": 0.08, "predict": 0.07, "train": 0.07, "find": 0.06, "machines": 0.05, "statistics": 0.05, "optimize": 0.04, "computers": 0.03, "neural": 0.01, "magic": 0.01 },
      { "patterns": 0.13, "data": 0.12, "models": 0.1, "predict": 0.09, "from": 0.08, "algorithms": 0.08, "learn": 0.08, "find": 0.07, "train": 0.06, "optimize": 0.06, "machines": 0.05, "statistics": 0.04, "neural": 0.02, "computers": 0.01, "magic": 0.01 },
      { "predict": 0.12, "data": 0.11, "patterns": 0.11, "train": 0.1, "models": 0.09, "algorithms": 0.08, "learn": 0.07, "from": 0.07, "find": 0.06, "optimize": 0.06, "machines": 0.05, "statistics": 0.04, "computers": 0.02, "neural": 0.01, "magic": 0.01 },
      { "data": 0.12, "patterns": 0.11, "models": 0.1, "optimize": 0.09, "train": 0.09, "predict": 0.08, "algorithms": 0.08, "learn": 0.07, "from": 0.07, "find": 0.06, "machines": 0.05, "statistics": 0.04, "neural": 0.02, "computers": 0.01, "magic": 0.01 },
    ]
  }
];

// ─── Utility Functions ───────────────────────────────────────────────────────

/** Normalize a distribution so it sums to 1 */
export function normalize(dist: TokenDistribution): TokenDistribution {
  const sum = Object.values(dist).reduce((a, b) => a + b, 0);
  if (sum === 0) return dist;
  const result: TokenDistribution = {};
  for (const [k, v] of Object.entries(dist)) {
    result[k] = v / sum;
  }
  return result;
}

/** Sample a token from a distribution */
export function sampleToken(dist: TokenDistribution): string {
  const r = Math.random();
  let cumulative = 0;
  for (const [token, prob] of Object.entries(dist)) {
    cumulative += prob;
    if (r <= cumulative) return token;
  }
  // Fallback: return last token
  const keys = Object.keys(dist);
  return keys[keys.length - 1];
}

/** Compute entropy of a distribution */
export function entropy(dist: TokenDistribution): number {
  let h = 0;
  for (const p of Object.values(dist)) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

/** Compute KL divergence: KL(current || reference) */
export function klDivergence(current: TokenDistribution, reference: TokenDistribution): number {
  let kl = 0;
  for (const [token, p] of Object.entries(current)) {
    const q = reference[token] || 1e-10;
    if (p > 0) {
      kl += p * Math.log(p / q);
    }
  }
  return kl;
}

/** Average KL across all positions */
export function avgKL(current: PolicyState, reference: PolicyState): number {
  let total = 0;
  const n = Math.min(current.distributions.length, reference.distributions.length);
  for (let i = 0; i < n; i++) {
    total += klDivergence(current.distributions[i], reference.distributions[i]);
  }
  return total / n;
}

/** Average entropy across all positions */
export function avgEntropy(policy: PolicyState): number {
  let total = 0;
  for (const dist of policy.distributions) {
    total += entropy(dist);
  }
  return total / policy.distributions.length;
}

/** Deep clone a policy */
export function clonePolicy(policy: PolicyState): PolicyState {
  return {
    distributions: policy.distributions.map(d => ({ ...d }))
  };
}

/** Generate a rollout from the current policy */
export function generateRollout(policy: PolicyState, rewardFn: (tokens: string[]) => number): Rollout {
  const tokens: string[] = [];
  const logProbs: number[] = [];
  
  for (const dist of policy.distributions) {
    const token = sampleToken(dist);
    tokens.push(token);
    logProbs.push(Math.log(dist[token] || 1e-10));
  }
  
  const reward = rewardFn(tokens);
  return { tokens, logProbs, reward };
}

/** Generate multiple rollouts */
export function generateRollouts(policy: PolicyState, rewardFn: (tokens: string[]) => number, count: number): Rollout[] {
  return Array.from({ length: count }, () => generateRollout(policy, rewardFn));
}

// ─── PPO Update ──────────────────────────────────────────────────────────────

export interface PPOConfig {
  learningRate: number;
  clipEpsilon: number;
  klPenalty: number;
  entropyBonus: number;
}

export const DEFAULT_PPO_CONFIG: PPOConfig = {
  learningRate: 0.08,
  clipEpsilon: 0.2,
  klPenalty: 0.1,
  entropyBonus: 0.01
};

export function ppoUpdate(
  policy: PolicyState,
  referencePolicy: PolicyState,
  rollouts: Rollout[],
  config: PPOConfig
): PolicyState {
  const newPolicy = clonePolicy(policy);
  
  // Compute baseline (average reward)
  const avgR = rollouts.reduce((s, r) => s + r.reward, 0) / rollouts.length;
  
  // Add advantages
  for (const rollout of rollouts) {
    rollout.advantage = rollout.reward - avgR;
  }
  
  // Update each position
  for (let pos = 0; pos < newPolicy.distributions.length; pos++) {
    const dist = newPolicy.distributions[pos];
    const refDist = referencePolicy.distributions[pos];
    
    for (const token of Object.keys(dist)) {
      let gradient = 0;
      
      for (const rollout of rollouts) {
        if (rollout.tokens[pos] === token) {
          const advantage = rollout.advantage!;
          // PPO clipped objective
          const ratio = dist[token] / (policy.distributions[pos][token] || 1e-10);
          const clippedRatio = Math.max(1 - config.clipEpsilon, Math.min(1 + config.clipEpsilon, ratio));
          const surrogateGain = Math.min(ratio * advantage, clippedRatio * advantage);
          gradient += surrogateGain;
        }
      }
      
      gradient /= rollouts.length;
      
      // KL penalty
      const refP = refDist[token] || 1e-10;
      const klPenaltyTerm = -config.klPenalty * (Math.log(dist[token] / refP));
      gradient += klPenaltyTerm;
      
      // Entropy bonus
      if (dist[token] > 0) {
        gradient += config.entropyBonus * (-Math.log(dist[token]) - 1);
      }
      
      // Apply update
      dist[token] = Math.max(1e-6, dist[token] + config.learningRate * gradient);
    }
    
    // Renormalize
    newPolicy.distributions[pos] = normalize(dist);
  }
  
  return newPolicy;
}

// ─── DPO Update ──────────────────────────────────────────────────────────────

export interface DPOConfig {
  learningRate: number;
  beta: number;
}

export const DEFAULT_DPO_CONFIG: DPOConfig = {
  learningRate: 0.06,
  beta: 0.1
};

export function dpoUpdate(
  policy: PolicyState,
  referencePolicy: PolicyState,
  chosen: Rollout,
  rejected: Rollout,
  config: DPOConfig
): PolicyState {
  const newPolicy = clonePolicy(policy);
  
  for (let pos = 0; pos < newPolicy.distributions.length; pos++) {
    const dist = newPolicy.distributions[pos];
    const refDist = referencePolicy.distributions[pos];
    
    const chosenToken = chosen.tokens[pos];
    const rejectedToken = rejected.tokens[pos];
    
    // DPO gradient: increase chosen, decrease rejected
    // Weighted by implicit reward difference
    const logRatioChosen = Math.log((dist[chosenToken] || 1e-10) / (refDist[chosenToken] || 1e-10));
    const logRatioRejected = Math.log((dist[rejectedToken] || 1e-10) / (refDist[rejectedToken] || 1e-10));
    const implicitReward = config.beta * (logRatioChosen - logRatioRejected);
    const sigma = 1 / (1 + Math.exp(implicitReward));
    
    for (const token of Object.keys(dist)) {
      let gradient = 0;
      
      if (token === chosenToken) {
        gradient += config.beta * sigma;
      }
      if (token === rejectedToken) {
        gradient -= config.beta * sigma;
      }
      
      dist[token] = Math.max(1e-6, dist[token] + config.learningRate * gradient);
    }
    
    newPolicy.distributions[pos] = normalize(dist);
  }
  
  return newPolicy;
}

// ─── GRPO Update ─────────────────────────────────────────────────────────────

export interface GRPOConfig {
  learningRate: number;
  klPenalty: number;
  groupSize: number;
}

export const DEFAULT_GRPO_CONFIG: GRPOConfig = {
  learningRate: 0.07,
  klPenalty: 0.08,
  groupSize: 6
};

export function grpoUpdate(
  policy: PolicyState,
  referencePolicy: PolicyState,
  rollouts: Rollout[],
  config: GRPOConfig
): { newPolicy: PolicyState; groupAdvantages: number[] } {
  const newPolicy = clonePolicy(policy);
  
  // Compute group-relative advantages
  const rewards = rollouts.map(r => r.reward);
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const std = Math.sqrt(rewards.reduce((s, r) => s + (r - mean) ** 2, 0) / rewards.length) || 1;
  const groupAdvantages = rewards.map(r => (r - mean) / std);
  
  // Assign advantages to rollouts
  for (let i = 0; i < rollouts.length; i++) {
    rollouts[i].advantage = groupAdvantages[i];
  }
  
  // Update each position
  for (let pos = 0; pos < newPolicy.distributions.length; pos++) {
    const dist = newPolicy.distributions[pos];
    const refDist = referencePolicy.distributions[pos];
    
    for (const token of Object.keys(dist)) {
      let gradient = 0;
      
      for (let i = 0; i < rollouts.length; i++) {
        if (rollouts[i].tokens[pos] === token) {
          gradient += groupAdvantages[i];
        }
      }
      
      gradient /= rollouts.length;
      
      // KL penalty toward reference
      const refP = refDist[token] || 1e-10;
      gradient -= config.klPenalty * Math.log(dist[token] / refP);
      
      dist[token] = Math.max(1e-6, dist[token] + config.learningRate * gradient);
    }
    
    newPolicy.distributions[pos] = normalize(dist);
  }
  
  return { newPolicy, groupAdvantages };
}

// ─── Simulation Controller ───────────────────────────────────────────────────

export function createSimulation(scenarioIndex: number = 0): SimulationState {
  const scenario = SCENARIOS[scenarioIndex];
  
  // Normalize initial distributions
  const normalizedDists = scenario.initialDistributions.map(d => normalize(d));
  
  const referencePolicy: PolicyState = { distributions: normalizedDists.map(d => ({ ...d })) };
  
  return {
    prompt: scenario.prompt,
    vocab: scenario.vocab,
    referencePolicy,
    currentPolicies: {
      PPO: clonePolicy(referencePolicy),
      DPO: clonePolicy(referencePolicy),
      GRPO: clonePolicy(referencePolicy)
    },
    history: {
      PPO: [],
      DPO: [],
      GRPO: []
    },
    stepCount: 0
  };
}

export function trainStep(
  sim: SimulationState,
  scenarioIndex: number,
  ppoConfig: PPOConfig = DEFAULT_PPO_CONFIG,
  dpoConfig: DPOConfig = DEFAULT_DPO_CONFIG,
  grpoConfig: GRPOConfig = DEFAULT_GRPO_CONFIG,
  numRollouts: number = 6
): SimulationState {
  const scenario = SCENARIOS[scenarioIndex];
  const newSim = { ...sim, stepCount: sim.stepCount + 1 };
  
  // PPO
  const ppoRollouts = generateRollouts(sim.currentPolicies.PPO, scenario.rewardFn, numRollouts);
  const ppoOld = clonePolicy(sim.currentPolicies.PPO);
  const ppoNew = ppoUpdate(sim.currentPolicies.PPO, sim.referencePolicy, ppoRollouts, ppoConfig);
  
  newSim.currentPolicies = { ...sim.currentPolicies, PPO: ppoNew };
  newSim.history = {
    ...sim.history,
    PPO: [...sim.history.PPO, {
      stepNumber: newSim.stepCount,
      algorithm: 'PPO',
      rollouts: ppoRollouts,
      oldPolicy: ppoOld,
      newPolicy: ppoNew,
      klDivergence: avgKL(ppoNew, sim.referencePolicy),
      entropy: avgEntropy(ppoNew),
      avgReward: ppoRollouts.reduce((s, r) => s + r.reward, 0) / ppoRollouts.length
    }]
  };
  
  // DPO
  const dpoRollouts = generateRollouts(sim.currentPolicies.DPO, scenario.rewardFn, numRollouts);
  const sorted = [...dpoRollouts].sort((a, b) => b.reward - a.reward);
  const chosen = sorted[0];
  const rejected = sorted[sorted.length - 1];
  const dpoOld = clonePolicy(sim.currentPolicies.DPO);
  const dpoNew = dpoUpdate(sim.currentPolicies.DPO, sim.referencePolicy, chosen, rejected, dpoConfig);
  
  newSim.currentPolicies = { ...newSim.currentPolicies, DPO: dpoNew };
  newSim.history = {
    ...newSim.history,
    DPO: [...sim.history.DPO, {
      stepNumber: newSim.stepCount,
      algorithm: 'DPO',
      rollouts: dpoRollouts,
      oldPolicy: dpoOld,
      newPolicy: dpoNew,
      klDivergence: avgKL(dpoNew, sim.referencePolicy),
      entropy: avgEntropy(dpoNew),
      avgReward: dpoRollouts.reduce((s, r) => s + r.reward, 0) / dpoRollouts.length,
      chosen,
      rejected
    }]
  };
  
  // GRPO
  const grpoRollouts = generateRollouts(sim.currentPolicies.GRPO, scenario.rewardFn, grpoConfig.groupSize);
  const grpoOld = clonePolicy(sim.currentPolicies.GRPO);
  const { newPolicy: grpoNew, groupAdvantages } = grpoUpdate(
    sim.currentPolicies.GRPO, sim.referencePolicy, grpoRollouts, grpoConfig
  );
  
  newSim.currentPolicies = { ...newSim.currentPolicies, GRPO: grpoNew };
  newSim.history = {
    ...newSim.history,
    GRPO: [...sim.history.GRPO, {
      stepNumber: newSim.stepCount,
      algorithm: 'GRPO',
      rollouts: grpoRollouts,
      oldPolicy: grpoOld,
      newPolicy: grpoNew,
      klDivergence: avgKL(grpoNew, sim.referencePolicy),
      entropy: avgEntropy(grpoNew),
      avgReward: grpoRollouts.reduce((s, r) => s + r.reward, 0) / grpoRollouts.length,
      groupAdvantages
    }]
  };
  
  return newSim;
}

/** Get top-k tokens from distribution sorted by probability */
export function topK(dist: TokenDistribution, k: number): { token: string; prob: number }[] {
  return Object.entries(dist)
    .map(([token, prob]) => ({ token, prob }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, k);
}
