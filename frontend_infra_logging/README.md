# Frontend Logging Infrastructure Design

## Purpose

Design a reusable frontend logging system that can be used across many playgrounds without being coupled to any one playground.

This system should capture:

- mouse actions on the page
- query/response interactions from Q&A systems
- shared session/page metadata

For now, logs should be dumped locally to a file. Backend transport can be added later.

This is a design/spec only.

Related documents:
- `PRD.md` — product requirements
- `TSD.md` — technical spec
- `SCHEMA.md` — event model and file format
- `log.schema.json` — machine-readable JSON Schema

---

# 1. Goals

## Primary goal

Create a shared browser-side logging layer that any playground can import and use.

## Secondary goals

1. **Isolation from playgrounds**  
   The logging package should live at repo root and be reusable.

2. **Session reconstruction**  
   Logs should make it possible to understand what a user did on a page.

3. **Q&A observability**  
   Query and response events should be captured in the same system as interaction logs.

4. **Local-first operation**  
   No backend required for V1.

---

# 2. Scope

## In scope

- page/session lifecycle events
- mouse movement sampling
- clicks
- pointer down/up
- hover targets when useful
- scroll events
- query submitted
- answer returned
- low-confidence/escalation events
- local persistence and file export

## Out of scope for V1

- keyboard replay at full fidelity
- backend upload
- cross-device identity
- server analytics
- privacy policy implementation details

---

# 3. Core Design

```text
Playground page
  ↓
Shared logging client
  ├─ event capture adapters
  ├─ session manager
  ├─ event queue
  ├─ local persistence
  └─ file exporter
```

The logging system should be packaged as shared frontend infrastructure and embedded per page via configuration.

---

# 4. Key Design Decision: "dump locally to a file"

A browser cannot reliably stream arbitrary writes directly to a local file in every environment without user permission.

So V1 should use this model:

1. collect logs in memory
2. persist to IndexedDB for resilience
3. support explicit file dump/export by the user or page
4. optionally use File System Access API when available

## Recommended V1 export formats

- **NDJSON** for append-friendly event logs
- optionally JSON bundle export for easier manual inspection

---

# 5. Reuse Model

Each playground should only need to do something like:

- initialize logger with page metadata
- register DOM capture
- send structured Q&A events through the same logger

The shared infra should not know HNSW-specific concepts. It should only know generic event types and metadata payloads.

---

# 6. Event Categories

## Session events
- session_started
- session_ended
- page_visible
- page_hidden

## Navigation/context events
- page_loaded
- route_changed
- panel_changed
- mode_changed

## Mouse / pointer events
- pointer_move_sampled
- pointer_down
- pointer_up
- click
- dblclick
- contextmenu
- hover_start
- hover_end
- scroll

## Q&A events
- qa_query_submitted
- qa_answer_returned
- qa_answer_feedback
- qa_escalation_created

## App-defined custom events
- slider_changed
- search_started
- search_completed
- build_started
- build_completed

These should be emitted through a generic custom event API.

---

# 7. Privacy / Practicality Constraints

V1 should avoid logging sensitive freeform DOM state by default.

## Default-safe approach

- log element identifiers, not full DOM snapshots
- log normalized pointer coordinates relative to viewport/container
- log text input only for approved domains like Q&A query boxes
- do not automatically log arbitrary form contents

## Query logging

Since query logging is explicitly required, Q&A events should include:

- query text
- answer text or answer ID
- confidence
- citations
- escalation flag

This should be opt-in through the Q&A integration path, not generic text-input capture.

---

# 8. Recommended Local Storage Strategy

## Primary store
IndexedDB

Why:
- better than localStorage for larger logs
- supports batching
- more durable for long sessions

## Secondary in-memory queue
Use an in-memory buffer for fast appends and periodic flush to IndexedDB.

## Export strategy
Support:
- manual export button
- auto-export trigger on page unload if possible
- File System Access API for user-selected file sink where supported

---

# 9. Recommended File Format

## NDJSON event log
One event per line.

Advantages:
- append-friendly
- easy to inspect
- easy to transform later
- works well for analytics pipelines

Example:

```json
{"eventType":"session_started","timestamp":"2026-07-06T00:00:00.000Z","sessionId":"..."}
{"eventType":"click","timestamp":"2026-07-06T00:00:01.000Z","x":0.42,"y":0.33}
{"eventType":"qa_query_submitted","timestamp":"2026-07-06T00:00:10.000Z","query":"what is a voronoi cell?"}
```

---

# 10. Integration Recommendation

Create this as a shared frontend package/folder at repo root, for example:

```text
frontend_infra_logging/
  README.md
  PRD.md
  TSD.md
  SCHEMA.md
  log.schema.json
```

Later code might live under:

```text
frontend_infra_logging/src/
```

Each playground would import from this shared package instead of defining its own logging stack.

---

# 11. Final Recommendation

Build a shared browser logging client with:

- session-aware event capture
- pointer/mouse/scroll logging
- first-class Q&A query/response logging
- IndexedDB persistence
- NDJSON local export
- generic custom event support for playground-specific actions

That gives a reusable FE foundation for all playgrounds now, while keeping future backend transport optional.
