# Log Event Schema

## Goals
The log format should:

- support many playgrounds
- support both interaction logs and Q&A logs
- be append-friendly
- be easy to process later by backend systems

## Canonical File Format
NDJSON

One JSON object per line.

---

# 1. Base Event Shape

Every event should include these base fields:

```json
{
  "eventId": "evt_...",
  "eventType": "click",
  "timestamp": "2026-07-06T00:00:00.000Z",
  "sequence": 42,
  "sessionId": "sess_...",
  "pageId": "hnsw",
  "pageTitle": "HNSW Explorer",
  "route": "/playgrounds/hnsw",
  "payload": {}
}
```

## Base field meanings
- `eventId`: unique event ID
- `eventType`: event category/type
- `timestamp`: ISO timestamp
- `sequence`: monotonic session-local event number
- `sessionId`: stable per session
- `pageId`: logical page identifier
- `pageTitle`: human-readable page title
- `route`: route/path if available
- `payload`: event-specific data

---

# 2. Pointer / Mouse Event Payloads

## click
```json
{
  "x": 0.42,
  "y": 0.33,
  "clientX": 812,
  "clientY": 355,
  "button": 0,
  "target": {
    "tagName": "button",
    "id": "run-search",
    "logId": "run-search-btn",
    "role": "button",
    "label": "Run Search"
  }
}
```

## pointer_move_sampled
```json
{
  "x": 0.41,
  "y": 0.35,
  "clientX": 795,
  "clientY": 372,
  "target": {
    "tagName": "svg",
    "logId": "hnsw-panel"
  }
}
```

## scroll
```json
{
  "scrollX": 0,
  "scrollY": 844,
  "target": {
    "tagName": "main",
    "logId": "page-root"
  }
}
```

---

# 3. Q&A Event Payloads

## qa_query_submitted
```json
{
  "queryId": "q_001",
  "query": "what is a voronoi cell?",
  "source": "page-chat",
  "context": {
    "panel": "ivf",
    "stateKey": "build-kmeans"
  }
}
```

## qa_answer_returned
```json
{
  "queryId": "q_001",
  "answerId": "a_001",
  "answer": "A Voronoi cell is the region of space...",
  "confidence": 0.91,
  "confidenceBand": "high",
  "citationIds": ["src-voronoi-survey"],
  "figureIds": ["fig-voronoi-basic"],
  "shouldEscalate": false
}
```

## qa_escalation_created
```json
{
  "queryId": "q_002",
  "query": "show me a pq residual diagram",
  "reason": "missing_figure_support",
  "topMatches": [
    {
      "chunkId": "doc-pq::sec-residuals",
      "score": 0.38
    }
  ]
}
```

---

# 4. Custom Event Payloads

Custom events should use the same base envelope and a playground-defined payload.

Example:

## build_started
```json
{
  "buildMode": "step-by-step"
}
```

## slider_changed
```json
{
  "sliderId": "num-points",
  "oldValue": 100,
  "newValue": 150
}
```

---

# 5. Target Metadata Shape

```json
{
  "tagName": "button",
  "id": "build-index",
  "logId": "build-index-btn",
  "role": "button",
  "label": "Build Index"
}
```

## Notes
- `logId` should come from a stable app-defined `data-log-id` where possible.
- avoid full DOM serialization.

---

# 6. Recommended Event Types

Core types:
- `session_started`
- `session_ended`
- `page_loaded`
- `page_hidden`
- `page_visible`
- `click`
- `pointer_down`
- `pointer_up`
- `pointer_move_sampled`
- `scroll`
- `qa_query_submitted`
- `qa_answer_returned`
- `qa_escalation_created`

Custom types:
- `build_started`
- `build_completed`
- `search_started`
- `search_completed`
- `slider_changed`

---

# 7. File-Level Metadata (Optional)

If JSON export is used instead of NDJSON, a wrapper may include:

```json
{
  "metadata": {
    "sessionId": "sess_...",
    "pageId": "hnsw",
    "exportedAt": "2026-07-06T00:00:00.000Z"
  },
  "events": []
}
```

---

# 8. Recommendation

Use NDJSON as the canonical export format and the base event envelope above as the shared contract for all playgrounds.
