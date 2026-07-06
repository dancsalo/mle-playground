# Frontend Logging Infrastructure Technical Spec

## Overview
A shared browser logging client with pluggable event capture and local export.

## Architecture
```text
Logger API
  ├─ session manager
  ├─ pointer capture adapter
  ├─ DOM target resolver
  ├─ Q&A event adapter
  ├─ custom event emitter
  ├─ in-memory buffer
  ├─ IndexedDB persistence
  └─ exporter (NDJSON / JSON)
```

## Main Components

### 1. Session Manager
Responsibilities:
- generate `sessionId`
- attach `pageId`, `pageTitle`, `route`, `appVersion`
- maintain sequence numbers
- emit session lifecycle events

### 2. Pointer Capture Adapter
Capture:
- `click`
- `pointerdown`
- `pointerup`
- sampled `pointermove`
- `scroll`

Important: pointermove must be sampled or throttled.

Suggested defaults:
- time-based throttle, e.g. every 100–200 ms
- distance threshold, e.g. only if pointer moved enough

### 3. DOM Target Resolver
Instead of logging arbitrary DOM dumps, resolve lightweight metadata:
- `tagName`
- `id`
- `data-log-id`
- `role`
- `aria-label`
- nearest configured component ID

### 4. Q&A Event Adapter
Structured events only, emitted by the Q&A system integration.

Event examples:
- `qa_query_submitted`
- `qa_answer_returned`
- `qa_escalation_created`

### 5. Custom Event API
A page can call:
- `logger.logCustom('build_started', payload)`
- `logger.logCustom('slider_changed', payload)`

### 6. Buffer + Persistence
Recommended flow:
1. append event to in-memory queue
2. flush in batches to IndexedDB
3. export from IndexedDB when needed

### 7. Exporter
Support two modes:

#### NDJSON export
- canonical machine format
- one event per line

#### JSON export
- easier manual inspection
- useful for debugging sessions

### 8. Optional File Sink
When File System Access API is available:
- let user choose a file handle
- append events or periodic snapshots to that file

Fallback:
- export downloadable blob

## Performance Notes
- avoid synchronous heavy serialization on every event
- batch writes
- sample pointer movement aggressively
- allow configuration to disable high-volume capture

## Suggested API Shape
```ts
interface LoggerInit {
  pageId: string;
  pageTitle: string;
  route?: string;
  appVersion?: string;
  pointerSamplingMs?: number;
}
```

```ts
interface Logger {
  start(): void;
  stop(): void;
  logCustom(eventType: string, payload?: Record<string, unknown>): void;
  logQAQuery(payload: QAQueryEvent): void;
  logQAResponse(payload: QAResponseEvent): void;
  exportNDJSON(): Promise<Blob | File>;
  exportJSON(): Promise<Blob | File>;
}
```

## Failure Modes
- IndexedDB unavailable or quota exceeded
- file export denied by browser/user
- malformed custom payloads
- overly noisy event capture causing performance issues

## V1 Recommendation
Implement deterministic structured event logging with strong sampling and export guarantees before attempting richer replay or backend transport.
