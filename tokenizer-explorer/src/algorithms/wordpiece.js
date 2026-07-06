/**
 * WordPiece Tokenizer
 * Used by BERT, DistilBERT, Electra
 * 
 * Training: Similar to BPE but uses likelihood-based scoring.
 * Score(a,b) = freq(ab) / (freq(a) * freq(b))
 * This favors merging rare pairs that always appear together.
 * 
 * Inference: Greedy longest-match-first from left to right.
 * Unknown sub-tokens prefixed with "##".
 */

export class WordPieceTokenizer {
  constructor() {
    this.vocab = new Set();
    this.trainingSteps = [];
  }

  /**
   * Train WordPiece on a corpus.
   */
  train(corpus, numMerges = 50, options = {}) {
    this.trainingSteps = [];
    this.vocab = new Set();

    // Pre-tokenize
    const words = this._pretokenize(corpus);

    // Initialize with characters (## prefix for non-initial)
    const baseVocab = new Set();
    for (const [word] of words) {
      for (let i = 0; i < word.length; i++) {
        const ch = i === 0 ? word[i] : '##' + word[i];
        baseVocab.add(ch);
      }
    }
    this.vocab = new Set(baseVocab);

    // Sequences: each word split into initial char + ##char pieces
    let sequences = words.map(([word, count]) => {
      const tokens = [word[0]];
      for (let i = 1; i < word.length; i++) {
        tokens.push('##' + word[i]);
      }
      return [tokens, count];
    });

    this.trainingSteps.push({
      step: 0,
      type: 'init',
      vocab: [...this.vocab],
      vocabSize: this.vocab.size,
      sequences: sequences.map(([s, c]) => [s.join(' '), c]),
      merge: null,
    });

    for (let i = 0; i < numMerges; i++) {
      // Count individual token frequencies and pair frequencies
      const tokenFreqs = new Map();
      const pairFreqs = new Map();

      for (const [tokens, count] of sequences) {
        for (let j = 0; j < tokens.length; j++) {
          tokenFreqs.set(tokens[j], (tokenFreqs.get(tokens[j]) || 0) + count);
          if (j < tokens.length - 1) {
            const pair = tokens[j] + '|||' + tokens[j + 1];
            pairFreqs.set(pair, (pairFreqs.get(pair) || 0) + count);
          }
        }
      }

      if (pairFreqs.size === 0) break;

      // WordPiece scoring: freq(ab) / (freq(a) * freq(b))
      let bestPair = null;
      let bestScore = -Infinity;
      const pairScores = [];

      for (const [pair, freq] of pairFreqs) {
        const [a, b] = pair.split('|||');
        const freqA = tokenFreqs.get(a) || 1;
        const freqB = tokenFreqs.get(b) || 1;
        const score = freq / (freqA * freqB);
        pairScores.push({ pair: [a, b], freq, score });
        if (score > bestScore) {
          bestScore = score;
          bestPair = pair;
        }
      }

      const [tokenA, tokenB] = bestPair.split('|||');
      // Merge: remove ## prefix from second token when combining
      const merged = tokenA + tokenB.replace(/^##/, '');
      
      this.vocab.add(merged);

      // Apply merge
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

      const topPairs = pairScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      this.trainingSteps.push({
        step: i + 1,
        type: 'merge',
        merge: { a: tokenA, b: tokenB, result: merged, score: bestScore },
        vocabSize: this.vocab.size,
        sequences: sequences.map(([s, c]) => [s.join(' '), c]),
        topPairs,
      });

      if (options.onStep) {
        options.onStep(this.trainingSteps[this.trainingSteps.length - 1]);
      }
    }

    return this.trainingSteps;
  }

  /**
   * Tokenize text using greedy longest-match-first
   */
  tokenize(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const allTokens = [];

    for (const word of words) {
      const tokens = this._tokenizeWord(word);
      allTokens.push(...tokens);
    }

    return allTokens;
  }

  _tokenizeWord(word) {
    const tokens = [];
    let start = 0;

    while (start < word.length) {
      let end = word.length;
      let found = null;

      while (start < end) {
        let substr = word.slice(start, end);
        if (start > 0) substr = '##' + substr;
        
        if (this.vocab.has(substr)) {
          found = substr;
          break;
        }
        end--;
      }

      if (found === null) {
        tokens.push('[UNK]');
        break;
      }

      tokens.push(found);
      start = end;
    }

    return tokens;
  }

  tokenizeWithSteps(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const results = [];

    for (const word of words) {
      const tokens = this._tokenizeWord(word);
      results.push({ word, finalTokens: tokens });
    }

    return results;
  }

  _pretokenize(text) {
    const wordFreqs = new Map();
    const rawWords = text.split(/\s+/).filter(w => w.length > 0);
    for (const word of rawWords) {
      wordFreqs.set(word, (wordFreqs.get(word) || 0) + 1);
    }
    return [...wordFreqs.entries()];
  }

  getVocabSize() {
    return this.vocab.size;
  }
}

export default WordPieceTokenizer;
