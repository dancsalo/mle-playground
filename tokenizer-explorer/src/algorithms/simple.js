/**
 * Character-level and Byte-level tokenizers for comparison.
 */

/**
 * Simple character-level tokenizer (baseline)
 */
export class CharTokenizer {
  constructor() {
    this.vocab = new Map();
  }

  train(corpus) {
    this.vocab.clear();
    const chars = new Set(corpus);
    let id = 0;
    for (const ch of chars) {
      this.vocab.set(ch, id++);
    }
    return [{ step: 0, type: 'init', vocabSize: this.vocab.size }];
  }

  tokenize(text) {
    return text.split('');
  }

  tokenizeWithSteps(text) {
    return [{ word: text, finalTokens: text.split('') }];
  }

  getVocabSize() {
    return this.vocab.size;
  }
}

/**
 * Whitespace tokenizer (naive word-level)
 */
export class WhitespaceTokenizer {
  constructor() {
    this.vocab = new Map();
  }

  train(corpus) {
    this.vocab.clear();
    const words = corpus.split(/\s+/).filter(w => w.length > 0);
    const unique = new Set(words);
    let id = 0;
    for (const w of unique) {
      this.vocab.set(w, id++);
    }
    return [{ step: 0, type: 'init', vocabSize: this.vocab.size }];
  }

  tokenize(text) {
    return text.split(/\s+/).filter(w => w.length > 0);
  }

  tokenizeWithSteps(text) {
    const tokens = this.tokenize(text);
    return [{ word: text, finalTokens: tokens }];
  }

  getVocabSize() {
    return this.vocab.size;
  }
}

/**
 * Byte-level BPE (like GPT-2's actual tokenizer)
 * Operates on raw bytes, handles any Unicode text.
 */
export class ByteLevelBPE {
  constructor() {
    this.merges = [];
    this.vocab = new Map();
    this.trainingSteps = [];
  }

  train(corpus, numMerges = 50, options = {}) {
    this.merges = [];
    this.trainingSteps = [];

    // Convert to bytes representation
    const encoder = new TextEncoder();
    const words = this._pretokenize(corpus);
    
    // Convert words to byte sequences
    let sequences = words.map(([word, count]) => {
      const bytes = [...encoder.encode(word)].map(b => String.fromCharCode(b));
      return [bytes, count];
    });

    // Base vocab: all 256 byte values
    const baseVocab = new Set();
    for (let i = 0; i < 256; i++) {
      baseVocab.add(String.fromCharCode(i));
    }
    for (const [bytes] of sequences) {
      for (const b of bytes) baseVocab.add(b);
    }

    const vocabSet = new Set(baseVocab);

    this.trainingSteps.push({
      step: 0,
      type: 'init',
      vocabSize: vocabSet.size,
      sequences: sequences.slice(0, 20).map(([s, c]) => [s.map(b => b.charCodeAt(0).toString(16).padStart(2, '0')).join(' '), c]),
    });

    for (let i = 0; i < numMerges; i++) {
      const pairFreqs = new Map();
      for (const [tokens, count] of sequences) {
        for (let j = 0; j < tokens.length - 1; j++) {
          const pair = tokens[j] + '|||' + tokens[j + 1];
          pairFreqs.set(pair, (pairFreqs.get(pair) || 0) + count);
        }
      }

      if (pairFreqs.size === 0) break;

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

      this.trainingSteps.push({
        step: i + 1,
        type: 'merge',
        merge: { a: tokenA, b: tokenB, result: merged, freq: bestFreq },
        vocabSize: vocabSet.size,
      });

      if (options.onStep) {
        options.onStep(this.trainingSteps[this.trainingSteps.length - 1]);
      }
    }

    this.vocab = vocabSet;
    return this.trainingSteps;
  }

  tokenize(text) {
    const encoder = new TextEncoder();
    const words = this._pretokenize(text);
    const allTokens = [];

    for (const [word] of words) {
      let tokens = [...encoder.encode(word)].map(b => String.fromCharCode(b));

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

  tokenizeWithSteps(text) {
    return [{ word: text, finalTokens: this.tokenize(text) }];
  }

  _pretokenize(text) {
    const wordFreqs = new Map();
    // GPT-2 style regex pattern (simplified)
    const pattern = /\S+|\s+/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const word = match[0];
      wordFreqs.set(word, (wordFreqs.get(word) || 0) + 1);
    }
    return [...wordFreqs.entries()];
  }

  getVocabSize() {
    return this.vocab.size || 256;
  }
}


