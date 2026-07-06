import { writable, derived } from 'svelte/store';
import { BPETokenizer, WordPieceTokenizer, UnigramTokenizer, CharTokenizer, WhitespaceTokenizer, ByteLevelBPE } from '../algorithms/index.js';

// Available tokenizer types
export const TOKENIZER_TYPES = {
  bpe: { name: 'BPE (Byte Pair Encoding)', description: 'GPT-2/3/4, RoBERTa', class: BPETokenizer },
  wordpiece: { name: 'WordPiece', description: 'BERT, DistilBERT', class: WordPieceTokenizer },
  unigram: { name: 'Unigram (SentencePiece)', description: 'T5, ALBERT, XLNet', class: UnigramTokenizer },
  char: { name: 'Character-level', description: 'Baseline', class: CharTokenizer },
  whitespace: { name: 'Whitespace', description: 'Naive word-level', class: WhitespaceTokenizer },
  bytebpe: { name: 'Byte-level BPE', description: 'GPT-2 actual', class: ByteLevelBPE },
};

// Sample training corpora
export const SAMPLE_CORPORA = {
  english: {
    name: 'English Prose',
    text: `The quick brown fox jumps over the lazy dog. The dog barked loudly at the fox. 
A fox is a clever animal that lives in the forest. The forest is full of trees and animals.
The brown fox ran quickly through the tall grass. Dogs and foxes are both animals.
She walked through the garden slowly, enjoying the flowers. The flowers bloomed beautifully in spring.
Programming is the art of telling a computer what to do. Computers process information quickly.
The programmer wrote code that solved the problem efficiently. Code is written in programming languages.`,
  },
  code: {
    name: 'Python Code',
    text: `def hello_world():
    print("Hello, World!")
    return True

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class DataProcessor:
    def __init__(self, data):
        self.data = data
        self.processed = False
    
    def process(self):
        self.processed = True
        return self.data

def main():
    processor = DataProcessor([1, 2, 3])
    result = processor.process()
    print(result)`,
  },
  multilingual: {
    name: 'Multilingual',
    text: `Hello world. Bonjour le monde. Hola mundo. こんにちは世界。
The cat sat on the mat. Le chat est assis sur le tapis. El gato se sentó en la alfombra.
Machine learning is powerful. L'apprentissage automatique est puissant.
Natural language processing. Traitement du langage naturel. Procesamiento del lenguaje natural.
Die Katze sitzt auf der Matte. 猫がマットの上に座っています。`,
  },
  scientific: {
    name: 'Scientific Text',
    text: `The mitochondria is the powerhouse of the cell. Adenosine triphosphate is produced through oxidative phosphorylation.
Deoxyribonucleic acid contains genetic information. Ribonucleic acid transcribes the genetic code.
Photosynthesis converts carbon dioxide and water into glucose. Chlorophyll absorbs light energy.
The electromagnetic spectrum includes radio waves, microwaves, infrared, visible light, ultraviolet, x-rays, and gamma rays.
Quantum mechanics describes the behavior of particles at the subatomic level. Wave-particle duality is fundamental.`,
  },
  repetitive: {
    name: 'Repetitive/Structured',
    text: `aaabbbccc aaabbbccc aaabbbccc dddeeefff dddeeefff
abcabc abcabc abcabc defdef defdef defdef
the the the the a a a a an an an
hello hello hello world world world
aaa bbb ccc aaa bbb ccc aaa bbb ccc
ababab cdcdcd efefef ababab cdcdcd efefef`,
  },
};

// Sample test texts
export const SAMPLE_TESTS = {
  simple: 'The quick brown fox jumps over the lazy dog.',
  code: 'def hello_world(): return "Hello!"',
  rare: 'Supercalifragilisticexpialidocious is extraordinarily long.',
  multilingual: 'Hello こんにちは Bonjour Hola 你好',
  numbers: 'The year 2024 had 365 days and 8760 hours.',
  technical: 'The transformer architecture uses multi-head self-attention mechanisms.',
};

// Current active view/tab
export const activeView = writable('training');

// Training configuration
export const trainingConfig = writable({
  algorithm: 'bpe',
  corpus: 'english',
  customCorpus: '',
  numMerges: 40,
  targetVocabSize: 100,
});

// Training state
export const trainingState = writable({
  steps: [],
  currentStep: 0,
  isTraining: false,
  isComplete: false,
  tokenizer: null,
});

// Comparison configuration
export const comparisonConfig = writable({
  algorithms: ['bpe', 'wordpiece', 'unigram'],
  testText: 'simple',
  customTestText: '',
  corpus: 'english',
  numMerges: 40,
});

// Comparison results
export const comparisonResults = writable([]);

// Corpus influence configuration
export const corpusInfluenceConfig = writable({
  algorithm: 'bpe',
  corpora: ['english', 'code', 'scientific'],
  testText: 'The programmer wrote code that solved the problem efficiently.',
  numMerges: 40,
});

// Color scale for tokens
export const TOKEN_COLORS = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  '#86bcb6', '#8cd17d', '#b6992d', '#499894', '#e15759',
  '#f1ce63', '#d37295', '#a0cbe8', '#ffbe7d', '#8b8b8b',
];
