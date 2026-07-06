# QA System Design

## Purpose

Design a reusable, browser-only Q&A system that can be embedded into any visualization page or educational page in this repository.

The system should:

- run fully in the browser
- load a curated knowledge base into the browser
- answer user questions from that local knowledge base
- support text, glossary terms, citations, and images
- detect when a question is not covered well enough
- emit structured "coverage gap" records for an offline enrichment workflow

This document is the high-level design overview.

Related documents:
- `PRD.md` — product requirements
- `TSD.md` — technical spec
- `SCHEMA.md` — human-readable knowledge base schema
- `kb.schema.json` — machine-readable JSON Schema

---

# 1. Product Goals

## Primary goal

Allow a user on any page to ask questions like:

- What is a Voronoi cell?
- Why does HNSW descend between layers?
- What does IVF do in this search pipeline?
- Show me the image for this concept.

and receive a grounded answer from a local, trusted knowledge base.

## Secondary goals

1. **Reusability**  
   The same Q&A system should work for:
   - HNSW explorer
   - tokenizer explorer
   - graph/GCN pages
   - future educational visualizations

2. **Trustworthiness**  
   Answers should come from curated documents with citations and source provenance.

3. **Coverage monitoring**  
   The system should know when it cannot answer well and produce a machine-readable follow-up record.

4. **Research pipeline compatibility**  
   Missing questions should feed an offline knowledge-base expansion workflow.

---

# 2. Hard Requirements

## Browser-only runtime

The serving system for user Q&A must run entirely in the browser.

That means:

- documents are loaded in-browser
- indexing is performed in-browser, or precomputed artifacts are loaded in-browser
- retrieval is performed in-browser
- answer composition is performed in-browser
- no server dependency is required for basic Q&A

## Local document support

The system must be able to load a local knowledge base bundle that includes:

- topic pages
- glossary entries
- source links
- image metadata
- extracted figure references
- optional chunk-level citations

## Failure detection

The system must not hallucinate when knowledge coverage is weak.

It needs explicit logic to detect:

- no good match found
- weak match found
- definitional query missing glossary support
- image request with no supporting image asset
- low citation support

## Offline handoff

When coverage is insufficient, the system must create a structured record that can later be consumed by an offline deep-research workflow.

---

# 3. High-Level Architecture

```text
User question
   ↓
Browser Q&A shell
   ↓
Load page-scoped knowledge pack + shared glossary pack
   ↓
Browser retrieval layer
   ├─ glossary matcher
   ├─ lexical / BM25-like retrieval
   ├─ optional embedding retrieval
   └─ image/figure retrieval
   ↓
Evidence ranking
   ↓
Answer composer
   ↓
Confidence / coverage evaluator
   ├─ answer returned
   └─ or escalation record emitted
```

---

# 4. System Components

## 4.1 Knowledge Base Bundle

A knowledge base bundle is the unit loaded into the browser.

There should be two kinds:

1. **Shared core bundle**
   - common glossary
   - common math / geometry concepts
   - common ML/ANN concepts

2. **Page-scoped bundle**
   - page-specific concepts
   - visual explanation text
   - image/figure mappings
   - citations and source metadata for the current visualization

### Bundle contents

Each bundle should contain:

- `metadata`
- `documents`
- `glossary`
- `figures`
- `citations`
- `chunk index` or raw sections
- optional `precomputed retrieval artifacts`

---

## 4.2 Retrieval Layer

The retrieval layer should be modular.

### Minimum viable retrieval

For the first version, use a hybrid retrieval approach:

1. **Glossary-first lookup**
   - detect definitional queries such as:
     - what is X?
     - define X
     - what does X mean?
   - resolve against glossary and exact/near-exact term aliases

2. **Lexical chunk retrieval**
   - tokenize and normalize the query
   - score chunks by keyword overlap / BM25-style scoring
   - rank relevant sections

3. **Figure retrieval**
   - detect image-oriented requests such as:
     - show me the diagram
     - what figure explains this?
     - image of HNSW
   - return the best aligned figure metadata from the bundle

### Optional later retrieval upgrades

- browser vector embeddings
- dual-index retrieval (shared bundle + page bundle)
- reranking with a lightweight browser model
- entity-aware retrieval

---

## 4.3 Answer Composer

The answer composer should be conservative and grounded.

### V1 answer mode

Use **extractive + templated** answer composition:

- pull top glossary definition when available
- synthesize short answer from top 1–3 supported chunks
- include citations
- optionally attach figure results

### V2 answer mode

When/if browser model inference is added:

- feed only retrieved evidence into a browser-side model
- require citation-linked answer sections
- disallow unsupported synthesis

### Output shape

Every answer should include:

- short answer
- confidence score
- supporting citations
- optional figures/images
- related concepts
- a flag indicating whether coverage is weak

---

## 4.4 Coverage and Failure Detection

This is a core requirement.

The system should decide that a query is **not serviced properly** when one or more of the following happen:

### A. Retrieval failure

- no chunk passes minimum score threshold
- only weak fuzzy matches exist

### B. Definition gap

- user asks a definitional question
- no glossary item exists
- or only a weak chunk match exists without a definition

### C. Citation weakness

- answer can only be formed from unsupported or uncited content
- evidence base is too thin

### D. Figure mismatch

- user clearly wants an image/diagram
- no figure is available in the bundle

### E. Ambiguity overload

- multiple plausible interpretations exist
- system cannot safely disambiguate from current evidence

### F. Page-context mismatch

- user asks about something beyond the scope of the current page bundle and shared core bundle

---

## 4.5 Escalation Record Generator

If the system cannot answer reliably, it should emit a structured coverage-gap record.

### Example record

```json
{
  "query": "what is a voronoi cell?",
  "pageContext": {
    "pageId": "hnsw",
    "pageTitle": "HNSW Explorer"
  },
  "reason": "definition_missing_from_glossary",
  "topMatches": [
    {
      "docId": "ann-overview",
      "chunkId": "chunk-14",
      "score": 0.41
    }
  ],
  "requestedModalities": ["text"],
  "timestamp": "2026-07-06T00:00:00.000Z"
}
```

### Storage location

In-browser, this can be stored in:

- `localStorage` for simple persistence
- `IndexedDB` for larger queues
- downloadable JSON export for offline review

---

# 5. Supported Content Model

## 5.1 Document types

The browser system should support these content types inside a bundle:

### Concept article

A prose explanation of one concept.

Examples:
- Voronoi cells
- Product quantization
- HNSW traversal

### Glossary entry

A short canonical definition.

### Figure entry

A figure or image with:
- caption
- source URL
- source paper
- alt text
- associated concepts

### Source record

A structured citation entry:
- paper title
- authors
- venue
- year
- URL / arXiv / DOI
- reputation tag

### Page narrative chunk

A page-specific explanation tied to a visualization state.

Example:
- “In this HNSW panel, upper layers are sparse routing layers.”

---

## 5.2 Image support

The system must support image-linked answers.

### Required image metadata

Each image should carry:

- stable ID
- display URL or local asset path
- caption
- alt text
- associated terms
- source paper/article URL
- source title
- licensing info if available

### Image-aware queries

The system should detect requests like:

- show me the HNSW diagram
- what figure explains this?
- can I see an image of a Voronoi partition?

and respond with:

- short explanation
- relevant image(s)
- source links

---

# 6. Retrieval Strategy Options

## Option A — Lexical / glossary hybrid (recommended first)

### Description

Use:
- glossary matching
- normalized keyword retrieval
- BM25-like chunk ranking
- rule-based figure lookup

### Pros

- simple
- fully browser-safe
- predictable
- easy to debug
- small runtime footprint

### Cons

- weaker semantic matching
- less robust for paraphrase-heavy questions

### Recommendation

This should be the first implementation.

---

## Option B — Browser embeddings + lexical hybrid

### Description

Add embedding-based retrieval with vectors loaded or computed in-browser.

### Pros

- better semantic matching
- better paraphrase handling

### Cons

- larger model/runtime cost
- more browser memory pressure
- slower initialization

### Recommendation

Use only after the lexical/glossary layer is stable.

---

## Option C — Browser model for answer synthesis only

### Description

Keep retrieval deterministic, but pass retrieved evidence into an in-browser model for phrasing.

### Pros

- better answer fluency
- still grounded if evidence is constrained

### Cons

- more complexity
- requires careful prompt and citation guardrails

### Recommendation

Future enhancement, not V1.

---

# 7. Knowledge Base Schema Proposal

## Top-level

```json
{
  "metadata": {
    "id": "hnsw-core",
    "title": "HNSW Core Bundle",
    "version": "1.0.0"
  },
  "documents": [],
  "glossary": [],
  "figures": [],
  "sources": []
}
```

## Document entry

```json
{
  "id": "doc-hnsw-overview",
  "title": "HNSW Overview",
  "summary": "...",
  "tags": ["hnsw", "ann"],
  "sections": [
    {
      "id": "s1",
      "heading": "Layered search",
      "text": "...",
      "sourceIds": ["src-hnsw-paper"],
      "figureIds": ["fig-hnsw-overview"]
    }
  ]
}
```

## Glossary entry

```json
{
  "term": "Voronoi cell",
  "aliases": ["voronoi region"],
  "definition": "...",
  "sourceIds": ["src-voronoi-survey"],
  "figureIds": ["fig-voronoi-basic"]
}
```

## Figure entry

```json
{
  "id": "fig-hnsw-overview",
  "title": "HNSW layered graph",
  "caption": "...",
  "imageUrl": "...",
  "sourceId": "src-hnsw-paper",
  "terms": ["hnsw", "layer", "graph traversal"]
}
```

## Source entry

```json
{
  "id": "src-hnsw-paper",
  "title": "Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs",
  "authors": ["Malkov", "Yashunin"],
  "year": 2016,
  "url": "https://arxiv.org/abs/1603.09320",
  "publisher": "arXiv",
  "reputation": "primary_paper"
}
```

---

# 8. How the System Should Be Used on a Page

## On page load

1. load shared core bundle
2. load page-specific bundle
3. initialize retrieval indexes in-browser
4. expose a chat/Q&A UI shell

## On user query

1. classify query intent
   - definition
   - explanation
   - comparison
   - figure request
2. retrieve evidence
3. compose answer
4. compute confidence
5. if low confidence, emit escalation record

## Example page integration

A visualization page should be able to pass page context like:

- current panel
- current step
- selected term/node
- current narration line

This enables more contextual questions such as:

- why did this centroid move?
- why did the traversal descend here?

---

# 9. Confidence Model

The answer should expose confidence as a structured score, not just a boolean.

## Suggested signals

- glossary exact-match bonus
- top retrieval score
- score gap between top and second result
- number of independent supporting chunks
- citation count
- figure availability when requested
- query ambiguity penalty

## Suggested buckets

- **High** — reliable answer, grounded well
- **Medium** — useful answer, but partial or narrow support
- **Low** — weak evidence; answer shown cautiously and escalated
- **None** — no acceptable support; decline and escalate

---

# 10. UI Requirements

The Q&A system itself should be UI-agnostic, but support common UI patterns.

## Minimum UI capabilities

- ask question input
- answer area
- citation list
- figure attachments
- confidence indicator
- “not enough coverage” state
- hidden/exportable escalation queue

## Nice-to-have UI capabilities

- suggested follow-up questions
- glossary pill links
- page-context-aware prompts
- image viewer
- “why this answer?” evidence inspector

---

# 11. Recommended V1 Implementation Strategy

## V1 scope

Build the first version with:

- glossary matcher
- lexical chunk retrieval
- figure retrieval by tags/aliases
- extractive answer composition
- local escalation queue
- shared bundle + page bundle structure

## Why this is the right first version

Because it is:

- simple
- inspectable
- small enough for browser runtime
- easy to test
- robust against unsupported questions

This version also creates a clean foundation for later enhancements.

---

# 12. Future Enhancements

## Retrieval enhancements

- semantic browser embeddings
- hybrid reranking
- better alias expansion
- multilingual support

## Answer enhancements

- browser-side model synthesis over retrieved evidence
- stricter citation linking
- image-region grounding

## Ops enhancements

- export escalation queue to JSON
- periodic bundle updates
- per-page coverage analytics

---

# 13. Open Design Questions

1. Should glossary live only in shared bundle, or be duplicated into page bundles for speed?
2. Should images be bundled locally or referenced remotely?
3. Should retrieval artifacts be precomputed offline for large bundles?
4. How large can a browser bundle get before startup becomes too slow?
5. Should there be a hard “decline to answer” mode for missing citation support?

---

# 14. Final Recommendation

Build the browser Q&A system as a **two-bundle, glossary-first, hybrid lexical retrieval system** with:

- curated KB documents
- figure/image support
- citation-aware answers
- strong low-confidence detection
- structured escalation output

This gives a reusable, trustworthy foundation for any educational visualization page in this repository.
