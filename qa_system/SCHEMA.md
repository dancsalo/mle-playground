# Shared Knowledge Base Schema

This schema is the common contract between:

- `research_agent/` output
- `qa_system/` input

## Design Goals
- compact enough for browser use
- rich enough for trusted Q&A
- supports glossary, documents, sections, figures, and citations
- supports page-specific narrative chunks

## Top-Level Object

```json
{
  "metadata": {},
  "documents": [],
  "glossary": [],
  "figures": [],
  "sources": [],
  "narratives": [],
  "coverage": {}
}
```

## metadata
```json
{
  "id": "hnsw-page-bundle",
  "title": "HNSW Explorer Knowledge Base",
  "version": "1.0.0",
  "topic": "Approximate nearest neighbor search",
  "scope": "page",
  "generatedBy": "research-agent",
  "generatedAt": "2026-07-06T00:00:00.000Z"
}
```

## documents[]
Long-form concept docs.

```json
{
  "id": "doc-hnsw-overview",
  "title": "HNSW Overview",
  "summary": "Layered graph search for ANN.",
  "tags": ["hnsw", "ann"],
  "conceptIds": ["concept-hnsw"],
  "sections": [
    {
      "id": "sec-layered-search",
      "heading": "Layered search",
      "text": "HNSW starts at a sparse upper layer...",
      "sourceIds": ["src-hnsw-paper"],
      "figureIds": ["fig-hnsw-layers"]
    }
  ]
}
```

## glossary[]
Canonical definitions and aliases.

```json
{
  "id": "gloss-voronoi-cell",
  "term": "Voronoi cell",
  "aliases": ["voronoi region"],
  "definition": "A region containing all points closer to one site than any other.",
  "longDefinition": "Voronoi cells partition a metric space into nearest-site regions...",
  "sourceIds": ["src-voronoi-survey"],
  "figureIds": ["fig-voronoi-basic"],
  "relatedTerms": ["IVF", "partition", "nearest neighbor"]
}
```

## figures[]
Image/diagram references.

```json
{
  "id": "fig-hnsw-layers",
  "title": "HNSW layered graph",
  "caption": "Sparse upper layers route search before dense lower-layer refinement.",
  "imageUrl": "https://...",
  "thumbnailUrl": "https://...",
  "altText": "Layered HNSW graph diagram",
  "terms": ["hnsw", "layers", "graph traversal"],
  "sourceId": "src-hnsw-paper",
  "license": "unknown"
}
```

## sources[]
Reputable source records.

```json
{
  "id": "src-hnsw-paper",
  "title": "Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs",
  "authors": ["Malkov", "Yashunin"],
  "year": 2016,
  "url": "https://arxiv.org/abs/1603.09320",
  "publisher": "arXiv",
  "type": "primary_paper",
  "reputation": "high"
}
```

## narratives[]
Page-specific explanation chunks.

```json
{
  "id": "nar-hnsw-panel-descent",
  "pageId": "hnsw",
  "panel": "hnsw",
  "stateKey": "search-descent",
  "text": "In this panel, the search descends after no closer neighbor is found in the current layer.",
  "sourceIds": ["src-hnsw-paper"],
  "figureIds": ["fig-hnsw-layers"],
  "relatedTerms": ["HNSW", "greedy traversal"]
}
```

## coverage
Coverage and known gaps.

```json
{
  "status": "draft",
  "knownGaps": [
    {
      "type": "missing_figure",
      "term": "pq residual encoding",
      "priority": "medium"
    }
  ]
}
```

## Notes
- `documents`, `glossary`, and `narratives` are the primary retrieval units.
- `figures` are returned for image-oriented queries or attached when a concept has strong visual support.
- `sources` are authoritative citation records reused across all content entries.
