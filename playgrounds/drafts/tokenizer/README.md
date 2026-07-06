# Tokenizer Explorer

An interactive visualization tool for understanding how text tokenizers work — both during **training** and **inference**. Built with Svelte and D3.js.

## Features

### 🔧 Training Visualization
Step through the training process of different tokenization algorithms:

- **BPE (Byte Pair Encoding)** — Used by GPT-2/3/4, RoBERTa
  - Iteratively merges the most frequent adjacent pair
  - Watch vocabulary grow as merges accumulate
  - See pair frequency distributions at each step

- **WordPiece** — Used by BERT, DistilBERT, Electra
  - Scores pairs by `freq(ab) / (freq(a) × freq(b))`
  - Favors merging rare pairs that always co-occur
  - Uses `##` prefix for non-initial subword tokens

- **Unigram (SentencePiece)** — Used by T5, ALBERT, XLNet
  - Starts with large vocabulary, **prunes** least-useful tokens
  - Uses Viterbi segmentation to find optimal splits
  - Shows corpus log-likelihood changes during pruning

- **Byte-level BPE** — GPT-2's actual approach
  - Operates on raw bytes (handles any Unicode)
  - No unknown tokens possible

- **Baselines** — Character-level and whitespace tokenizers

### ✂️ Tokenize Text
See how a trained tokenizer segments arbitrary text:
- Color-coded token chips
- Step-by-step merge application (BPE)
- Alternative segmentations (Unigram)
- Compression ratio statistics

### 📊 Algorithm Comparison
Train multiple tokenizers on the same corpus, then compare:
- Token counts for identical input
- Compression ratios
- Vocabulary sizes
- Visual side-by-side token comparison

### 📚 Corpus Influence
Demonstrates how training data affects tokenization:
- Train the same algorithm on different corpora (English prose, code, scientific, multilingual, repetitive)
- See how token counts change for the same test text
- Visualize which merges each corpus produces

### 🌳 Merge Tree
D3 tree visualization showing how BPE builds up tokens:
- See the hierarchical structure of merges
- Understand which characters combine into multi-character tokens
- Interactive hover to inspect tokens

## Architecture

```
src/
├── algorithms/          # Core tokenizer implementations
│   ├── bpe.js          # BPE with full step-by-step history
│   ├── wordpiece.js    # WordPiece with likelihood scoring
│   ├── unigram.js      # Unigram with Viterbi + pruning
│   └── simple.js       # Char, Whitespace, Byte-level BPE
├── components/          # Svelte visualization components
│   ├── TrainingView.svelte        # Main training step-through
│   ├── TrainingStepViz.svelte     # Single step visualization
│   ├── VocabGrowthChart.svelte    # D3 line chart of vocab size
│   ├── PairFrequencyChart.svelte  # D3 bar chart of pair frequencies
│   ├── TokenizeView.svelte        # Interactive tokenization
│   ├── ComparisonView.svelte      # Multi-algorithm comparison
│   ├── CorpusInfluenceView.svelte # Training data influence
│   └── MergeTreeView.svelte       # D3 tree visualization
├── stores/              # Svelte stores for state management
│   └── index.js        # Configuration, sample data, colors
├── lib/                 # Utilities
│   └── utils.js        # Color assignment, tree building, formatting
├── App.svelte          # Main app with tab navigation
└── main.js             # Entry point
```

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Key Concepts Visualized

| Concept | Where to See It |
|---------|----------------|
| BPE merge frequency selection | Training → BPE → Pair Frequency Chart |
| WordPiece likelihood scoring | Training → WordPiece → Top Pairs (score) |
| Unigram vocabulary pruning | Training → Unigram → Removed tokens |
| How merges compose | Merge Tree → Hierarchical view |
| Effect of vocab size on compression | Comparison → Vary merge count |
| Domain-specific tokenization | Corpus Influence → Code vs English |
| Unknown token handling | Tokenize → Try rare words |
| Greedy vs optimal segmentation | Tokenize → Unigram alternatives |

## Sample Corpora Included

- **English Prose** — General natural language
- **Python Code** — Programming patterns (`def`, `self.`, `__init__`)
- **Multilingual** — English, French, Spanish, Japanese, German
- **Scientific Text** — Long technical terms (mitochondria, photosynthesis)
- **Repetitive/Structured** — Patterns that BPE exploits aggressively

## Design Decisions

- All tokenizers run **entirely in the browser** — no server needed
- Training produces full step history for scrubbing back/forward
- Animations can be played at variable speeds or stepped manually
- Dark theme with purple/blue gradient aesthetic
- Responsive layout for different screen sizes
