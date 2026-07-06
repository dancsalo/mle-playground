# QA System Technical Spec

## Overview
A browser-only retrieval-and-answer layer backed by curated JSON knowledge bundles.

## Runtime Architecture
```text
UI shell
  → QA orchestrator
    → bundle loader
    → glossary matcher
    → lexical retriever
    → figure retriever
    → answer composer
    → confidence evaluator
    → escalation queue
```

## Main Modules
### 1. Bundle loader
- loads one or more JSON bundles
- validates against bundle schema
- merges shared/core + page-scoped content

### 2. Normalization/tokenization
- lowercase normalization
- alias expansion
- stopword filtering
- optional stemming later

### 3. Retrieval
#### Glossary retrieval
- exact alias match
- near-exact normalized match
- high boost for `what is ...` / `define ...`

#### Chunk retrieval
- section-level chunks
- BM25-style or keyword-overlap ranking
- support title/heading boosts

#### Figure retrieval
- by associated terms
- by figure title/caption overlap
- by explicit image intent in query

### 4. Answer composer
- extractive synthesis from top evidence
- glossary-first for definitions
- attach citations and figures from evidence

### 5. Confidence evaluator
Signals:
- glossary exact match
- top retrieval score
- score separation from next result
- number of supporting chunks
- citation presence
- figure availability if requested

Threshold outputs:
- high
- medium
- low
- none

### 6. Escalation queue
- localStorage or IndexedDB
- append-only structured records
- export to JSON

## Suggested Browser API
```ts
interface AskResult {
  answer: string;
  confidence: number;
  confidenceBand: 'high' | 'medium' | 'low' | 'none';
  citations: CitationRef[];
  figures: FigureRef[];
  relatedTerms: string[];
  shouldEscalate: boolean;
  escalationRecord?: EscalationRecord;
}
```

## Bundle Loading Model
- `core.bundle.json`
- `page.bundle.json`
- optional `glossary.bundle.json`

## Performance Notes
- pre-chunk offline where possible
- lazy-load page bundle after shell load
- cache merged index in memory
- consider precomputed retrieval artifacts for large bundles

## Failure Modes
- invalid bundle schema
- zero retrieval matches
- weak evidence only
- figure requested but unavailable
- ambiguous concept request

## Logging / Debug
Author/debug mode should expose:
- top retrieved chunks
- glossary hit/miss
- confidence breakdown
- emitted escalation record

## V1 Recommendation
Keep retrieval deterministic and answer composition extractive. Add browser model synthesis only after evidence handling and escalation logic are proven.
