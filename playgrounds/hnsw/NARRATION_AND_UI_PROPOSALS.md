# HNSW Explorer: Narration Script and Interactive UI Proposals

## Goal

This script is written to match the current HNSW playground flow:

- **Build phase**: `kmeans` → `pq` → `hnsw` → `complete`
- **Search phase**: `ivf` → `pq` → `hnsw` → `exact` → `complete`

It is designed so it can be:

- shown as a read-along script,
- played line-by-line during animation,
- turned into tooltips/callouts,
- or used as the basis for an interactive chat assistant.

---

# 1. Narration Script

## A. Build Phase Script

### Build intro

**Narration**

> We are starting the index build. The raw points already exist, but nothing has been organized yet. Over the next few steps, we will partition the vectors, prepare a compressed representation, and then construct the navigable graph used for fast search.

---

### Stage 1 — K-means / IVF partitioning

**Narration**

> First, we divide the vector space into coarse regions.
>
> Each centroid is a temporary guess for the center of a partition. On every iteration, each point is assigned to its nearest centroid, and then each centroid moves to the average of the points assigned to it.
>
> As this repeats, the partitions stabilize. This gives us an IVF-style structure: instead of searching every vector later, we can probe only the most relevant partitions.

**Short step callouts**

1. **Initialize centroids**  
   > We begin with a random set of partition centers.
2. **Assign points**  
   > Each point joins the nearest centroid.
3. **Move centroids**  
   > Each centroid shifts to the center of its assigned points.
4. **Repeat until stable**  
   > The partition layout becomes more consistent with each iteration.
5. **Stage result**  
   > We now have coarse buckets that reduce how much of the dataset must be searched.

---

### Stage 2 — PQ training / compression setup

**Narration**

> Next, we prepare product quantization.
>
> The idea is not to compute exact distances for every candidate right away. Instead, we split the vector representation into subspaces and train a compact codebook for each one.
>
> Later, this lets the system estimate distances quickly using compressed codes. In a real ANN system, this is one of the key tradeoffs: much lower memory and faster approximate scoring, with only a small loss in precision.

**Short step callouts**

1. **Split into subspaces**  
   > The vector representation is divided into smaller parts.
2. **Train each codebook**  
   > Each subspace learns a compact set of representative values.
3. **Build compressed representation**  
   > Vectors can now be represented more cheaply than full-precision floats.
4. **Stage result**  
   > We are ready for fast approximate comparison during search.

---

### Stage 3 — HNSW graph construction

**Narration**

> Now we build the HNSW graph.
>
> Points are inserted progressively into a layered graph. Lower layers are denser and contain more local connectivity. Higher layers are sparser and act like fast routing layers.
>
> For each inserted point, the system determines which layer it belongs to, links it to nearby neighbors, and updates the graph structure. Over time, this creates a navigable small-world graph: a structure designed to move quickly from coarse routing to fine local search.

**Short step callouts**

1. **Insert a point**  
   > A new vector enters the graph.
2. **Choose its layer**  
   > Some points appear only in the base layer; a smaller number are promoted upward.
3. **Connect neighbors**  
   > The point links to nearby nodes in that layer.
4. **Repeat**  
   > The graph becomes richer and more navigable as more points are inserted.
5. **Stage result**  
   > We now have the search graph that supports fast greedy traversal.

---

### Build complete

**Narration**

> The index is now ready.
>
> The dataset has been partitioned, the compressed search representation has been prepared, and the HNSW graph has been constructed. The expensive work is done up front so that query-time search can be much faster.

---

## B. Search Phase Script

### Search intro

**Narration**

> We are now running a query through the built index.
>
> Notice that we are not doing a brute-force scan over every vector. Instead, we use the structures built earlier to narrow the search, score candidates efficiently, traverse the graph, and then rerank the best results exactly.

---

### Stage 1 — IVF candidate selection

**Narration**

> First, we compare the query to the partition centroids.
>
> We select the closest partitions and gather only the points inside them. This creates a candidate set that is much smaller than the full dataset.
>
> This is the first big speedup: we avoid searching regions of the space that are obviously far from the query.

**Short step callouts**

1. **Score centroids**  
   > Which coarse regions are closest to the query?
2. **Probe nearest partitions**  
   > We keep only the most promising buckets.
3. **Collect candidates**  
   > Only vectors in those buckets move forward.

---

### Stage 2 — PQ approximate scoring

**Narration**

> Next, we use the compressed representation.
>
> Instead of spending full cost on exact distance calculations, we use product-quantized information to estimate which candidates look promising.
>
> This stage is about fast filtering. It is approximate on purpose, and it helps keep the later exact step small.

**Short step callouts**

1. **Use compressed codes**  
   > Cheap approximate comparisons are computed.
2. **Filter promising points**  
   > Weak candidates can be deprioritized.
3. **Pass strongest candidates forward**  
   > The search remains efficient without full exact scoring yet.

---

### Stage 3 — HNSW graph traversal

**Narration**

> Now we navigate the HNSW graph.
>
> The search starts from an entry point in the upper layer. From there, it moves greedily: at each step, it looks for a neighbor that is closer to the query.
>
> Once the search can no longer improve at that layer, it descends to the next layer and repeats. Higher layers move us quickly across the space; lower layers refine the result with denser local structure.

**Short step callouts**

1. **Start high in the graph**  
   > Sparse upper layers provide fast routing.
2. **Greedy move**  
   > Move to a neighbor that is closer to the query.
3. **Local optimum at this layer**  
   > When no neighbor is better, descend.
4. **Refine at lower layers**  
   > Search becomes more local and more precise.
5. **Traversal result**  
   > We end with a high-quality set of nearby nodes.

---

### Stage 4 — Exact reranking

**Narration**

> Finally, we compute exact distances on the strongest remaining candidates.
>
> This is the precision step. The earlier phases were designed to make this final exact pass small and affordable.
>
> The system sorts those exact distances and returns the nearest results.

**Short step callouts**

1. **Take best candidates**  
   > Only a limited set reaches exact scoring.
2. **Compute full-precision distance**  
   > We now pay the exact cost on a small subset.
3. **Sort and return top-K**  
   > These are the final nearest neighbors.

---

### Search complete

**Narration**

> The search is complete.
>
> The query moved through coarse partitioning, approximate compression-based scoring, graph navigation, and exact reranking. This layered process is what makes approximate nearest neighbor systems fast while still preserving high recall.

---

# 2. UI Designs for Script + Interaction

Each of these designs assumes:

- the script is visible during build/search,
- the user can click any line to inspect that step,
- a chat panel lets the user ask questions,
- the chat calls a **browser-side third-party model** or browser SDK,
- the UI can pass local context such as current stage, selected node, metrics, and highlighted candidates.

---

## Design A — Guided Transcript Rail

### Layout

- **Left/main:** existing visualization panels
- **Right rail:** collapsible transcript
- **Bottom of rail:** chat composer

### Behavior

- Transcript is divided into:
  - Build
  - Search
- Current line auto-highlights as the animation advances.
- Clicking a line:
  - pauses animation,
  - focuses the relevant panel,
  - highlights the related nodes/points/metrics.
- User can ask:
  - “Why did this centroid move?”
  - “Why did the search descend here?”

### Why it works

- Minimal layout disruption
- Works well on desktop
- Transcript feels like a synchronized commentary track

### Best for

- first-time learners
- classroom/demo use
- users who want structure more than freeform exploration

---

## Design B — Step Cards + Embedded Chat Bubbles

### Layout

- Horizontal or vertical stack of interactive step cards:
  - K-means
  - PQ
  - HNSW build
  - IVF probe
  - PQ scoring
  - HNSW traversal
  - Exact rerank
- Each card can expand inline.

### Behavior

- Every card contains:
  - a 1–2 sentence explanation,
  - “What happened?”
  - “Why does it matter?”
  - “Ask a question”
- Clicking “Ask a question” opens a small inline chat bubble scoped to that step.
- The model receives only local step context, making answers more focused.

### Why it works

- Keeps explanations modular
- Encourages question-asking at the exact point of confusion
- Scales nicely to mobile if cards become accordion sections

### Best for

- self-paced exploration
- educational product UX
- mobile/tablet adaptation

---

## Design C — Director Mode / Cinematic Overlay

### Layout

- Visualization stays center stage
- A semi-transparent narration overlay appears at the bottom like subtitles
- A floating “Explain this step” button opens chat

### Behavior

- During animation, only 1–2 current lines are shown.
- User can scrub backward/forward through moments.
- Clicking the subtitle opens a richer side panel with:
  - expanded explanation,
  - relevant metrics,
  - chat history for that moment.

### Why it works

- Strongest visual focus on the animation itself
- Feels polished and story-driven
- Great for presentations, demos, and guided product storytelling

### Best for

- polished launch/demo mode
- stakeholder walkthroughs
- video-like interaction

---

## Design D — Notebook Mode

### Layout

Three-column desktop view:

1. **Visualization**
2. **Narration / derivation notes**
3. **Chat + scratchpad**

### Behavior

- Narration column includes:
  - script line,
  - technical explanation,
  - pseudocode snippet,
  - metric deltas.
- Chat can cite current notebook context.
- User can pin answers into the scratchpad.

### Why it works

- Best for power users
- Makes the app feel like an interactive lab
- Enables deeper technical questioning without leaving the page

### Best for

- engineers
- researchers
- advanced learners

---

## Design E — Annotation Layer on the Visualization Itself

### Layout

- Existing panels remain mostly unchanged
- Contextual speech-bubble annotations attach directly to points, centroids, layers, or metrics
- A chat drawer opens from the bottom or side

### Behavior

- Hovering an annotation reveals the matching script line.
- Clicking it sends context into chat automatically.
- Example prompts:
  - “Explain why this node became the next hop.”
  - “Explain layer density differences.”
  - “What is approximate about this step?”

### Why it works

- Ties explanation directly to visual objects
- Reduces need to mentally map text to graphics
- Especially effective for the HNSW traversal panel

### Best for

- highly visual learners
- dense technical interactions
- fine-grained object inspection

---

# 3. Recommended Chat Interaction Model

## Suggested UX pattern

Use **context-scoped chat** instead of one generic chatbot.

Whenever the user opens chat, pass structured context such as:

- current phase: `build` or `search`
- current stage: `kmeans | pq | hnsw | ivf | exact | complete`
- selected script line
- current metrics snapshot
- selected nodes/points/clusters
- playback position / step number

This allows better answers like:

> “You are currently in HNSW traversal, layer 1. The selected node has 4 neighbors. Explain why the search descended now.”

instead of a generic:

> “Explain HNSW.”

---

## Suggested browser-side model integration patterns

### Option 1 — Browser SDK to hosted API

- Browser calls a third-party inference API directly with an SDK.
- Good when low latency and strong model quality matter.
- Requires secure handling of API credentials via ephemeral tokens or a signed session bootstrap.

### Option 2 — In-browser local model runtime

- Use a browser-executed model runtime.
- Strong privacy story.
- Works offline or semi-offline.
- Best for lightweight explanatory prompts, not heavy reasoning.

### Option 3 — Hybrid chooser

- Default to local/browser model for quick questions.
- Offer “Ask deeper model” for hosted higher-quality answers.
- Lets the user trade speed vs quality.

---

# 4. Recommended First Version

If only one design is built first, the strongest practical choice is:

## **Design A + context-scoped chat**

Why:

- easiest to integrate into the current UI,
- preserves current panel layout,
- transcript can be driven directly from stage/step state,
- chat can be added without a major layout rewrite,
- later extensible into Designs C or E.

### MVP feature set

1. Right-side transcript rail
2. Auto-highlight current narration line
3. Click line to pause and inspect
4. “Ask about this step” button
5. Browser chat with structured context payload
6. Suggested prompts under each step

### Example suggested prompts

- “Why is this step approximate?”
- “What would brute force do instead?”
- “Why do higher HNSW layers have fewer nodes?”
- “Why do we rerank exactly at the end?”
- “What changes if I increase the number of partitions?”

---

# 5. Implementation Notes

To support these designs cleanly, the app should expose a structured narration model such as:

```ts
interface NarrationStep {
  id: string;
  phase: 'build' | 'search';
  stage: string;
  title: string;
  shortLine: string;
  fullExplanation: string;
  panel?: 'ivf' | 'pq' | 'hnsw' | 'metrics';
  relatedIds?: number[];
  suggestedPrompts?: string[];
}
```

Then the UI can:

- map runtime stage changes to narration steps,
- bind transcript state to the animation state,
- send step context directly into the browser chat adapter.

---

# 6. PR Summary Text

If needed, this work can be summarized as:

> Adds a full narration script for the HNSW playground build/search phases, plus a set of interactive UI concepts for exposing the script alongside a browser-based question-answer chat experience.
