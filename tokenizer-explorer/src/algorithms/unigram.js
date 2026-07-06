/**
 * Unigram Tokenizer (SentencePiece)
 * Used by T5, ALBERT, XLNet, mBART
 * 
 * Training: Start with a large vocabulary, iteratively REMOVE tokens
 * that contribute least to the overall likelihood of the corpus.
 * Uses the EM algorithm / Viterbi segmentation.
 * 
 * Inference: Find the segmentation that maximizes the product of
 * token probabilities (equivalent to minimizing negative log-likelihood).
 */

export class UnigramTokenizer {
  constructor() {
    this.vocab = new Map(); // token -> log probability
    this.trainingSteps = [];
  }

  /**
   * Train Unigram model on a corpus.
   * @param {string} corpus
   * @param {number} targetVocabSize - Final desired vocabulary size
   * @param {number} shrinkFactor - Fraction of tokens to remove each step (0.1 = 10%)
   */
  train(corpus, targetVocabSize = 100, shrinkFactor = 0.2, options = {}) {
    this.trainingSteps = [];

    // Step 1: Build initial large vocabulary from all substrings up to length maxLen
    const words = this._pretokenize(corpus);
    const maxSubstringLen = 8;
    
    // Count substring frequencies
    const substringFreqs = new Map();
    for (const [word, count] of words) {
      for (let i = 0; i < word.length; i++) {
        for (let len = 1; len <= Math.min(maxSubstringLen, word.length - i); len++) {
          const sub = word.slice(i, i + len);
          substringFreqs.set(sub, (substringFreqs.get(sub) || 0) + count);
        }
      }
    }

    // Initialize vocab with log probabilities
    const totalFreq = [...substringFreqs.values()].reduce((a, b) => a + b, 0);
    this.vocab = new Map();
    for (const [token, freq] of substringFreqs) {
      this.vocab.set(token, Math.log(freq / totalFreq));
    }

    // Always keep single characters
    const singleChars = new Set();
    for (const [word] of words) {
      for (const ch of word) {
        singleChars.add(ch);
      }
    }

    this.trainingSteps.push({
      step: 0,
      type: 'init',
      vocabSize: this.vocab.size,
      topTokens: this._getTopTokens(20),
      removedTokens: [],
      corpusLogLikelihood: this._computeCorpusLL(words),
    });

    let step = 0;
    while (this.vocab.size > targetVocabSize) {
      step++;

      // Compute loss contribution of each token using Viterbi
      const tokenLosses = this._computeTokenLosses(words, singleChars);

      // Sort by loss (ascending = least important first)
      const sorted = [...tokenLosses.entries()]
        .filter(([token]) => !singleChars.has(token)) // Never remove single chars
        .sort((a, b) => a[1] - b[1]);

      // Remove bottom fraction
      const numToRemove = Math.min(
        Math.ceil(this.vocab.size * shrinkFactor),
        this.vocab.size - targetVocabSize
      );

      const removed = sorted.slice(0, numToRemove).map(([t]) => t);
      for (const token of removed) {
        this.vocab.delete(token);
      }

      // Recompute probabilities
      this._recomputeProbabilities(words);

      const ll = this._computeCorpusLL(words);

      this.trainingSteps.push({
        step,
        type: 'prune',
        vocabSize: this.vocab.size,
        numRemoved: removed.length,
        removedSample: removed.slice(0, 10),
        topTokens: this._getTopTokens(20),
        corpusLogLikelihood: ll,
      });

      if (options.onStep) {
        options.onStep(this.trainingSteps[this.trainingSteps.length - 1]);
      }
    }

    return this.trainingSteps;
  }

  /**
   * Tokenize using Viterbi (max probability segmentation)
   */
  tokenize(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const allTokens = [];
    for (const word of words) {
      allTokens.push(...this._viterbiSegment(word));
    }
    return allTokens;
  }

  /**
   * Tokenize showing the lattice/alternatives
   */
  tokenizeWithSteps(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const results = [];

    for (const word of words) {
      const bestPath = this._viterbiSegment(word);
      // Also find alternative segmentations for visualization
      const alternatives = this._findAlternatives(word, 3);
      results.push({ word, finalTokens: bestPath, alternatives });
    }

    return results;
  }

  _viterbiSegment(word) {
    const n = word.length;
    // dp[i] = { logProb, tokenEnd } for best segmentation of word[0..i)
    const dp = new Array(n + 1).fill(null);
    dp[0] = { logProb: 0, prev: -1, token: '' };

    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < i; j++) {
        const sub = word.slice(j, i);
        if (this.vocab.has(sub) && dp[j] !== null) {
          const logProb = dp[j].logProb + this.vocab.get(sub);
          if (dp[i] === null || logProb > dp[i].logProb) {
            dp[i] = { logProb, prev: j, token: sub };
          }
        }
      }
    }

    // Backtrack
    if (dp[n] === null) return [word]; // fallback
    const tokens = [];
    let pos = n;
    while (pos > 0) {
      tokens.unshift(dp[pos].token);
      pos = dp[pos].prev;
    }
    return tokens;
  }

  _findAlternatives(word, k) {
    // Simple: find top-k segmentations using beam search
    const n = word.length;
    // beam[i] = top-k paths ending at position i
    const beam = Array.from({ length: n + 1 }, () => []);
    beam[0] = [{ logProb: 0, tokens: [] }];

    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < i; j++) {
        const sub = word.slice(j, i);
        if (this.vocab.has(sub)) {
          const tokenLP = this.vocab.get(sub);
          for (const path of beam[j]) {
            beam[i].push({
              logProb: path.logProb + tokenLP,
              tokens: [...path.tokens, sub],
            });
          }
        }
      }
      // Keep top-k
      beam[i].sort((a, b) => b.logProb - a.logProb);
      beam[i] = beam[i].slice(0, k);
    }

    return beam[n];
  }

  _computeTokenLosses(words, singleChars) {
    // For each token, compute how much the corpus log-likelihood would decrease
    // if that token were removed (approximation: just re-segment without it)
    const losses = new Map();
    const currentLL = this._computeCorpusLL(words);

    // For efficiency, sample tokens to evaluate
    const tokens = [...this.vocab.keys()].filter(t => !singleChars.has(t));
    
    // Approximate: score based on frequency * length (longer frequent tokens are more valuable)
    for (const token of tokens) {
      const logProb = this.vocab.get(token);
      // Simple heuristic: loss ≈ how much probability mass this token captures
      // Tokens with very low probability contribute less
      losses.set(token, -logProb * token.length);
    }

    return losses;
  }

  _computeCorpusLL(words) {
    let totalLL = 0;
    for (const [word, count] of words) {
      const tokens = this._viterbiSegment(word);
      let wordLL = 0;
      for (const t of tokens) {
        wordLL += this.vocab.get(t) || -100;
      }
      totalLL += wordLL * count;
    }
    return totalLL;
  }

  _recomputeProbabilities(words) {
    // Re-estimate probabilities based on Viterbi segmentations
    const freqs = new Map();
    let total = 0;
    
    for (const [word, count] of words) {
      const tokens = this._viterbiSegment(word);
      for (const t of tokens) {
        freqs.set(t, (freqs.get(t) || 0) + count);
        total += count;
      }
    }

    // Update probabilities for tokens still in vocab
    for (const token of this.vocab.keys()) {
      const freq = freqs.get(token) || 0.1; // smoothing
      this.vocab.set(token, Math.log(freq / total));
    }
  }

  _getTopTokens(n) {
    return [...this.vocab.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([token, logProb]) => ({ token, logProb, prob: Math.exp(logProb) }));
  }

  _pretokenize(text) {
    const wordFreqs = new Map();
    // Add word boundary marker
    const rawWords = text.split(/\s+/).filter(w => w.length > 0);
    for (const word of rawWords) {
      const marked = '▁' + word;
      wordFreqs.set(marked, (wordFreqs.get(marked) || 0) + 1);
    }
    return [...wordFreqs.entries()];
  }

  getVocabSize() {
    return this.vocab.size;
  }
}

export default UnigramTokenizer;
