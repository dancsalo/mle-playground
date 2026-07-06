# Research Agent Technical Spec

## Overview
An offline pipeline that transforms page descriptions and escalation records into structured knowledge bundles for browser consumption.

## Pipeline
```text
Visualization/page spec
  + escalation queue
    → topic planner
    → question expander
    → source miner
    → source ranker
    → figure curator
    → glossary/document drafter
    → coverage auditor
    → bundle emitter
```

## Main Modules
### 1. Topic planner
Input:
- page description
- panel descriptions
- likely user interactions

Output:
- concept graph
- prerequisite graph
- candidate glossary terms
- likely FAQs

### 2. Question expander
- generates definitional, mechanistic, comparison, and figure-oriented questions
- uses escalation queue items as priority signals

### 3. Source miner
- finds candidate papers, surveys, and reputable secondary sources
- stores normalized source metadata

### 4. Source ranker
Signals:
- source type (primary paper > survey > secondary)
- topic relevance
- citation usefulness
- visual usefulness for figures

### 5. Figure curator
- discovers figures tied to major concepts
- attaches caption, source, and concept links
- marks missing-figure gaps when no acceptable image is found

### 6. Content drafter
Produces:
- glossary entries
- concept documents
- page-specific narratives

### 7. Coverage auditor
Checks:
- glossary completeness
- mechanism coverage
- figure availability
- source quality
- FAQ coverage

### 8. Bundle emitter
- outputs schema-compliant JSON bundle
- outputs human-readable review summary

## Integration Contract
The emitted bundle must validate against:
- `qa_system/kb.schema.json`

## Human Review Gate
Recommended before publishing:
- verify source quality
- verify figure appropriateness/licensing metadata
- simplify or rewrite weak explanatory text
- approve coverage status

## Inputs
### PageSpec
```ts
interface PageSpec {
  pageId: string;
  title: string;
  topic: string;
  panels: string[];
  interactions?: string[];
  likelyQuestions?: string[];
}
```

### EscalationRecord
Use exported records from the browser Q&A system as high-priority research tasks.

## Outputs
### Bundle
Schema-compliant knowledge base bundle.

### CoverageReport
```ts
interface CoverageReport {
  status: 'draft' | 'reviewed' | 'ready';
  strengths: string[];
  knownGaps: Array<{ type: string; priority: 'high' | 'medium' | 'low'; term?: string }>;
}
```

## Suggested Workflow
1. generate initial bundle from page spec
2. human review
3. publish bundle
4. ingest escalation queue
5. regenerate or patch bundle
6. republish updated bundle

## V1 Recommendation
Focus on structured curation and schema-compliant output, not autonomous writing sophistication. Retrieval quality in the browser depends more on bundle structure and source discipline than on fancy offline generation.
