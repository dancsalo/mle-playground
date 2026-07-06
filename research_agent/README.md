# Research Agent Design

## Purpose

Design an offline deep-research agent that produces the knowledge bases consumed by `qa_system/`.

The input is a visualization or educational page.

The output is a curated, structured knowledge base with:

- relevant concepts
- glossary definitions
- explanatory documents
- figure/image candidates
- links to reputable sources and papers
- coverage notes and open questions

This document is the high-level design overview.

Related documents:
- `PRD.md` — product requirements
- `TSD.md` — technical spec
- outputs should conform to `../qa_system/kb.schema.json`

---

# 1. Role of the Research Agent

The browser Q&A system should stay small, deterministic, and local.

The research agent is the opposite side of the pipeline:

- offline
- source-seeking
- evidence-heavy
- curation-oriented
- bundle-producing

It is responsible for turning a visualization topic into a trusted knowledge pack.

---

# 2. Inputs and Outputs

## Input

The agent takes a visualization description such as:

- page title
- topic
- summary of what the visualization teaches
- major panels or stages
- user interactions
- likely user questions
- current coverage gaps from the Q&A escalation queue

### Example input

```json
{
  "pageId": "hnsw",
  "title": "HNSW Explorer",
  "topic": "Approximate nearest neighbor search with IVF, PQ, and HNSW",
  "panels": [
    "IVF partitioning",
    "PQ compression",
    "HNSW graph construction",
    "search metrics"
  ],
  "likelyQuestions": [
    "What is a Voronoi cell?",
    "Why does HNSW use layers?",
    "How does PQ compression work?"
  ],
  "coverageGaps": []
}
```

## Output

A structured knowledge base for browser use, including:

- core concept docs
- glossary entries
- figures/images with provenance
- source records
- page-specific narrative chunks
- recommended follow-up topics

---

# 3. High-Level Workflow

```text
Visualization description
   ↓
Topic decomposition
   ↓
Question expansion
   ↓
Source discovery
   ↓
Source ranking / reputation filtering
   ↓
Concept extraction
   ↓
Glossary drafting
   ↓
Narrative article drafting
   ↓
Figure/image selection
   ↓
Citation structuring
   ↓
Coverage review
   ↓
Knowledge base bundle output
```

---

# 4. Core Responsibilities

## 4.1 Topic decomposition

The first task is to break a visualization into conceptual units.

For each page, the agent should identify:

- prerequisite concepts
- core concepts
- advanced concepts
- page-specific concepts
- likely confusion points

### Example for HNSW

#### Prerequisites
- nearest neighbor search
- vector similarity
- graph search
- clustering

#### Core concepts
- IVF
- PQ
- HNSW
- greedy graph traversal
- layered routing

#### Supporting concepts
- Voronoi cells
- codebooks
- compression tradeoffs
- recall vs latency

---

## 4.2 Question expansion

The agent should generate a question inventory that users are likely to ask.

### Question categories

1. **Definitions**
   - What is a Voronoi cell?
   - What is product quantization?

2. **Mechanism**
   - Why does HNSW use layers?
   - How are IVF partitions built?

3. **Comparison**
   - How is HNSW different from brute force?
   - Why use PQ instead of full precision?

4. **Figure-oriented**
   - Is there a diagram for this?
   - Show me the HNSW graph figure.

5. **Tradeoff / intuition**
   - Why is this faster?
   - What accuracy is lost?

### Why this matters

The resulting question inventory helps ensure the bundle is built for real user needs, not just topic completeness.

---

## 4.3 Source discovery

The agent should gather source candidates from reputable places.

## Preferred source classes

### Tier 1 — Primary sources

- arXiv papers
- conference papers
- journal articles
- original algorithm papers

### Tier 2 — High-quality secondary sources

- survey papers
- reputable technical blog posts from strong organizations
- university lecture notes
- official docs where relevant

### Tier 3 — Tertiary references

- encyclopedia-like overviews
- only when used to support simple definitions or public-domain figures

## Source requirements

Every concept in the final bundle should ideally be backed by:

- at least one primary or survey source
- a stable URL
- enough provenance metadata for later review

---

# 5. Figure / Image Acquisition Strategy

The user requirement is that images should ideally come from reputable papers, especially arXiv where possible.

## Figure policy

The agent should prefer:

1. figures from primary papers
2. figures from survey papers
3. figures redrawn internally only if licensing or clarity requires it

## For each figure the agent should collect:

- figure title or inferred name
- image URL or extracted asset path
- source paper URL
- caption
- associated concepts
- any licensing/reuse notes if known

## Important design note

The agent should not just collect images. It should map each image to concepts and likely user queries.

Example:

- figure: HNSW layered graph
- linked concepts:
  - HNSW
  - search descent
  - upper sparse layers
  - lower dense layers

This makes browser image retrieval much better later.

---

# 6. Bundle Authoring Responsibilities

The agent should produce a bundle that works well for browser retrieval.

That means it should create:

## 6.1 Glossary entries

Each important term should have:

- canonical term
- aliases
- short definition
- slightly longer explanation
- source IDs
- related figures

## 6.2 Concept documents

Each core topic should have:

- title
- short summary
- sections
- simple explanations first
- more technical explanation second
- citations attached per section where possible

## 6.3 Page-specific narrative chunks

The agent should generate explanation chunks tailored to the visualization itself.

Example:

- “In this page’s HNSW panel, the path shown is a greedy route from upper sparse layers to lower dense layers.”

This matters because general topic docs alone may not answer page-specific user questions.

---

# 7. Coverage Evaluation

The agent should judge whether a topic is truly “complete enough” for the page.

## Completion checklist

A topic is complete only if the bundle contains:

- glossary coverage for key terms
- mechanism coverage for major steps
- comparison coverage for common alternatives
- at least one good figure for visual concepts
- citations for all major claims
- answers to likely high-frequency questions

## Coverage gap classes

The agent should explicitly track gaps like:

- missing glossary term
- weak figure support
- missing primary source
- missing intuition-level explanation
- missing page-specific narrative
- ambiguous terminology

---

# 8. Relationship to Escalation Queue

The Q&A system will emit low-confidence or unsupported query records.

The research agent should consume those records as an input signal.

## Example loop

1. users ask unsupported questions in browser
2. Q&A system logs structured gap records
3. offline research agent ingests those gaps
4. research agent expands bundle with new concepts/sources/figures
5. new bundle is published back to the browser system

This creates a practical continuous-improvement loop.

---

# 9. Suggested Output Schema

## Top-level knowledge base output

```json
{
  "metadata": {
    "id": "hnsw-page-bundle",
    "title": "HNSW Explorer Knowledge Base",
    "version": "1.0.0",
    "generatedFrom": "research-agent"
  },
  "documents": [],
  "glossary": [],
  "figures": [],
  "sources": [],
  "coverage": {
    "status": "draft",
    "knownGaps": []
  }
}
```

## Coverage gap item

```json
{
  "type": "missing_glossary_term",
  "term": "Voronoi cell",
  "reason": "high-frequency definitional query unsupported",
  "priority": "high"
}
```

---

# 10. Reputation and Source Quality Policy

The research agent should not treat all sources equally.

## Source ranking policy

### Highest preference

- original papers
- strong survey papers
- canonical academic references

### Medium preference

- high-quality educational explanations by reputable organizations
- university materials

### Lower preference

- general web references used only for lightweight background or figure discovery

## Required metadata per source

- title
- authors if available
- year
- URL
- source type
- reputation label
- notes on why it is trusted

This helps future auditability.

---

# 11. Research Agent Subsystems

## 11.1 Topic planner

Transforms visualization description into:

- concept graph
- prerequisite graph
- question inventory

## 11.2 Source miner

Finds candidate sources for each concept.

## 11.3 Evidence ranker

Scores sources by relevance and trust.

## 11.4 Content drafter

Produces glossary and concept-doc drafts from evidence.

## 11.5 Figure curator

Finds and links figure/image evidence.

## 11.6 Coverage auditor

Checks whether the resulting bundle is sufficient.

## 11.7 Bundle emitter

Outputs the final browser-consumable knowledge base.

---

# 12. How to Handle a “Complete Topic”

The user requested a deep-research stage once a topic is complete.

A topic should count as complete only after the agent verifies:

1. key concepts are all defined
2. likely user questions are covered
3. all important mechanisms have explanatory text
4. figure coverage exists where visual intuition matters
5. reputable source links are attached
6. bundle passes coverage review

Only then should the page bundle be marked ready for browser deployment.

---

# 13. Recommended Operating Model

## Phase 1 — Initial bundle creation

Input:
- page description
- page visuals
- hand-authored notes if any

Output:
- first complete bundle draft

## Phase 2 — Human review

A human should review:
- source trust
- glossary quality
- figure appropriateness
- narrative clarity

## Phase 3 — Browser deployment

Bundle is published to the page.

## Phase 4 — Gap-driven refinement

Escalation queue items drive targeted enrichment.

---

# 14. Example: HNSW Visualization Bundle Plan

## Major bundle sections

### Glossary
- nearest neighbor search
- approximate nearest neighbor
- IVF
- product quantization
- HNSW
- Voronoi cell
- graph traversal
- recall
- latency

### Core documents
- ANN overview
- IVF mechanism
- PQ mechanism
- HNSW mechanism
- search tradeoffs

### Figures
- Voronoi partitioning figure
- PQ/codebook figure
- HNSW layered graph figure
- search descent example

### Page-specific narrative
- how the build phase maps to the visualization
- how search phase maps to the visualization
- how the metrics panel should be interpreted

---

# 15. Recommended First Version

For the first research-agent version, design it to produce:

- a compact but well-cited glossary
- 3–6 concept docs per page
- 1–3 strong figures per major visual concept
- full source metadata
- a machine-readable browser bundle
- a coverage report

This is enough to make the browser Q&A system useful and trustworthy.

---

# 16. Final Recommendation

Design the research agent as an **offline bundle-construction pipeline** whose job is to:

- decompose a visualization into concepts and questions
- gather reputable sources and figures
- draft structured explanatory content
- audit coverage
- output a browser-ready knowledge base for `qa_system/`

The browser Q&A system and the offline research agent should be treated as two halves of the same knowledge architecture:

- **qa_system/** answers from trusted local knowledge
- **research_agent/** expands that trusted local knowledge when user demand reveals gaps
