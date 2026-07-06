/**
 * Byte Pair Encoding (BPE) Tokenizer
 * Used by GPT-2, GPT-3, GPT-4, RoBERTa
 * 
 * Training: Iteratively merge the most frequent pair of adjacent tokens.
 * Inference: Apply learned merges in priority order (greedy).
 */

export class BPETokenizer {
  constructor() {
    this.merges = [];        // Ordered list of merge rules: [tokenA, tokenB]
    this.vocab = new Map();  // token -> id
    this.idToToken = new Map();
    this.trainingSteps = []; // For visualization
  }

  /**
   * Train BPE on a corpus. Returns detailed step-by-step history.
   * @param {string} corpus - Training text
   * @param {number} numMerges - Number of merge operations to perform
   * @param {object} options - { onStep: callback }
   */
  train(corpus, numMerges = 50, options = {}) {
    this.merges = [];
    this.trainingSteps = [];

    // Step 1: Pre-tokenize into words (whitespace split + end-of-word marker)
    const words = this._pretokenize(corpus);
    
    // Step 2: Initialize vocabulary with individual characters
    const baseVocab = new Set();
    for (const [word] of words) {
      for (const ch of word) {
        baseVocab.add(ch);
      }
    }
    
    // word sequences: map from word (as array of tokens) to frequency
    // We use a list of [tokenArray, count] for mutability
    let sequences = words.map(([word, count]) => [word.split(''), count]);

    // Record initial state
    this.trainingSteps.push({
      step: 0,
      type: 'init',
      vocab: [...baseVocab],
      vocabSize: baseVocab.size,
      sequences: sequences.map(([s, c]) => [s.join(' '), c]),
      merge: null,
      pairFreqs: null,
    });

    const vocabSet = new Set(baseVocab);

    for (let i = 0; i < numMerges; i++) {
      // Count all adjacent pairs
      const pairFreqs = new Map();
      for (const [tokens, count] of sequences) {
        for (let j = 0; j < tokens.length - 1; j++) {
          const pair = tokens[j] + '|||' + tokens[j + 1];
          pairFreqs.set(pair, (pairFreqs.get(pair) || 0) + count);
        }
      }

      if (pairFreqs.size === 0) break;

      // Find the most frequent pair
      let bestPair = null;
      let bestFreq = 0;
      for (const [pair, freq] of pairFreqs) {
        if (freq > bestFreq) {
          bestFreq = freq;
          bestPair = pair;
        }
      }

      const [tokenA, tokenB] = bestPair.split('|||');
      const merged = tokenA + tokenB;
      
      this.merges.push([tokenA, tokenB]);
      vocabSet.add(merged);

      // Apply merge to all sequences
      sequences = sequences.map(([tokens, count]) => {
        const newTokens = [];
        let j = 0;
        while (j < tokens.length) {
          if (j < tokens.length - 1 && tokens[j] === tokenA && tokens[j + 1] === tokenB) {
            newTokens.push(merged);
            j += 2;
          } else {
            newTokens.push(tokens[j]);
            j++;
          }
        }
        return [newTokens, count];
      });

      // Top 10 pairs for visualization
      const topPairs = [...pairFreqs.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([p, f]) => ({ pair: p.split('|||'), freq: f }));

      this.trainingSteps.push({
        step: i + 1,
        type: 'merge',
        merge: { a: tokenA, b: tokenB, result: merged, freq: bestFreq },
        vocabSize: vocabSet.size,
        vocab: [...vocabSet],
        sequences: sequences.map(([s, c]) => [s.join(' '), c]),
        topPairs,
      });

      if (options.onStep) {
        options.onStep(this.trainingSteps[this.trainingSteps.length - 1]);
      }
    }

    // Build final vocab
    this.vocab.clear();
    this.idToToken.clear();
    let id = 0;
    for (const token of vocabSet) {
      this.vocab.set(token, id);
      this.idToToken.set(id, token);
      id++;
    }

    return this.trainingSteps;
  }

  /**
   * Tokenize a string using learned merges
   */
  tokenize(text) {
    const words = this._pretokenize(text);
    const allTokens = [];

    for (const [word] of words) {
      let tokens = word.split('');

      // Apply merges in order
      for (const [a, b] of this.merges) {
        const newTokens = [];
        let i = 0;
        while (i < tokens.length) {
          if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
            newTokens.push(a + b);
            i += 2;
          } else {
            newTokens.push(tokens[i]);
            i++;
          }
        }
        tokens = newTokens;
      }

      allTokens.push(...tokens);
    }

    return allTokens;
  }

  /**
   * Tokenize with detailed step-by-step for visualization
   */
  tokenizeWithSteps(text) {
    const words = this._pretokenize(text);
    const results = [];

    for (const [word] of words) {
      let tokens = word.split('');
      const steps = [{ tokens: [...tokens], merge: null }];

      for (const [a, b] of this.merges) {
        const newTokens = [];
        let merged = false;
        let i = 0;
        while (i < tokens.length) {
          if (i < tokens.length - 1 && tokens[i] === a && tokens[i + 1] === b) {
            newTokens.push(a + b);
            i += 2;
            merged = true;
          } else {
            newTokens.push(tokens[i]);
            i++;
          }
        }
        if (merged) {
          tokens = newTokens;
          steps.push({ tokens: [...tokens], merge: [a, b] });
        }
      }

      results.push({ word, steps, finalTokens: tokens });
    }

    return results;
  }

  _pretokenize(text) {
    // Simple whitespace-based pre-tokenization with word frequencies
    const wordFreqs = new Map();
    const rawWords = text.split(/\s+/).filter(w => w.length > 0);
    for (const word of rawWords) {
      // Add end-of-word marker
      const marked = word + '▁';
      wordFreqs.set(marked, (wordFreqs.get(marked) || 0) + 1);
    }
    return [...wordFreqs.entries()];
  }

  getVocabSize() {
    return this.vocab.size;
  }

  getMerges() {
    return this.merges;
  }
}

export default BPETokenizer;
