# RL Explorer

An interactive visual dashboard for understanding RLHF (Reinforcement Learning from Human Feedback) training algorithms: **PPO**, **DPO**, and **GRPO**.

![RL Explorer](https://img.shields.io/badge/Svelte-5-orange) ![D3](https://img.shields.io/badge/D3-v7-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

## What This Teaches

RLHF algorithms are fundamentally methods for **reshaping probability distributions over token sequences**. This explorer makes that visible by letting you:

1. **Watch the training loop** step-by-step: sample → score → update → compare
2. **See probability mass move** from unpreferred to preferred tokens
3. **Compare three algorithms** side-by-side on the same prompt
4. **Understand the constraints** (KL divergence, clipping, entropy) that prevent collapse

## Architecture

Uses a **tiny synthetic vocabulary** (15 tokens, 6 positions) instead of a real LLM. This makes the optimization landscape small enough to visualize completely while teaching the same concepts.

## Running

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Key Interactions

- **"Apply One Update" button** — The core interaction. Each click runs one training step across all three algorithms simultaneously.
- **Auto-train** — Watch the algorithms diverge in real time.
- **Position selector** — See how token distributions evolve at each sequence position.
- **Expandable rollouts** — Click to see all sampled completions with their rewards and log-probabilities.
- **Hyperparameter sliders** — Adjust learning rates, clip epsilon, KL penalties, etc. in real time.

## Panels

| Panel | What It Shows |
|-------|--------------|
| Rollouts | Sampled completions from the current policy |
| Training Signal | PPO forces/clipping, DPO chosen/rejected, GRPO group advantages |
| Token Distribution | Before/after probability bars with delta annotations |
| KL Gauge | How far the policy has drifted from the reference |
| Entropy View | Per-position exploration vs exploitation |
| Timeline | Reward, KL, and entropy over training steps |
| Step History | Tabular log of all training steps |

## Algorithms

### PPO (Proximal Policy Optimization)
- Generates rollouts, scores with reward function
- Clipped surrogate objective prevents large updates
- KL penalty + entropy bonus for stability

### DPO (Direct Preference Optimization)
- No explicit reward model
- Learns from preference pairs (chosen vs rejected)
- Implicit reward from log-ratio with reference policy

### GRPO (Group Relative Policy Optimization)
- Samples a group, ranks by reward
- Advantages are relative to group mean (self-normalizing)
- No critic network needed

## Tech Stack

- **Svelte 5** (runes mode) for reactive UI
- **D3.js** for probability distributions, timelines, gauges
- **Tailwind CSS 4** for styling
- **SvelteKit** for the framework
