# Graph Algorithms — Descriptions for Visualization

## 1. Breadth-First Search (BFS)

**Category:** Traversal  
**Data Structure:** Queue  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
BFS explores a graph level by level, starting from a source node. It visits all neighbors at the current depth before moving to nodes at the next depth level. Uses a queue (FIFO) to manage the frontier.

### Visualization Steps
1. Start at source node → mark as visited, enqueue
2. Dequeue front node → process it
3. Enqueue all unvisited neighbors → mark as visited
4. Repeat until queue is empty

### Key Properties
- Finds **shortest path** in unweighted graphs
- Explores in concentric "waves" from the source
- Level-order traversal of trees is a special case

### Use Cases
- Shortest path in unweighted graph
- Level-order traversal
- Finding connected components
- Bipartite check
- Minimum steps/moves problems

---

## 2. Depth-First Search (DFS)

**Category:** Traversal  
**Data Structure:** Stack (or recursion)  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
DFS explores as far as possible along each branch before backtracking. It dives deep into the graph following one path until it hits a dead end, then backtracks to explore other paths.

### Visualization Steps
1. Start at source node → mark as visited, push to stack
2. Peek/pop top of stack → visit an unvisited neighbor
3. If no unvisited neighbors → backtrack (pop)
4. Repeat until stack is empty

### Key Properties
- Naturally recursive
- Produces a DFS tree with back edges, forward edges, cross edges
- Can detect cycles (back edge in directed graph)
- Topological ordering via post-order

### Use Cases
- Cycle detection
- Topological sorting
- Finding connected/strongly connected components
- Path finding
- Maze solving
- Flood fill

---

## 3. Dijkstra's Algorithm

**Category:** Shortest Path  
**Data Structure:** Min-Heap (Priority Queue)  
**Time Complexity:** O((V + E) log V)  
**Space Complexity:** O(V)

### Description
Finds the shortest path from a single source to all other vertices in a graph with **non-negative** edge weights. Greedily selects the unvisited vertex with the smallest known distance and relaxes its edges.

### Visualization Steps
1. Initialize distances: source = 0, all others = ∞
2. Add source to priority queue
3. Extract minimum distance node
4. For each neighbor: if `dist[u] + weight(u,v) < dist[v]`, update `dist[v]`
5. Repeat until priority queue is empty

### Key Properties
- Greedy algorithm
- Does NOT work with negative edge weights
- Produces shortest path tree
- Each node is processed exactly once

### Use Cases
- GPS navigation / routing
- Network routing protocols (OSPF)
- Shortest path with positive weights

---

## 4. Bellman-Ford Algorithm

**Category:** Shortest Path  
**Data Structure:** Array  
**Time Complexity:** O(V × E)  
**Space Complexity:** O(V)

### Description
Finds shortest paths from a single source, even with **negative edge weights**. Iteratively relaxes all edges V-1 times. Can detect negative weight cycles.

### Visualization Steps
1. Initialize distances: source = 0, all others = ∞
2. Repeat V-1 times:
   - For each edge (u, v, w): if `dist[u] + w < dist[v]`, update `dist[v]`
3. One more pass to detect negative cycles (if any distance still decreases → negative cycle exists)

### Key Properties
- Works with negative weights
- Detects negative weight cycles
- Slower than Dijkstra but more versatile
- Dynamic programming approach

### Use Cases
- Graphs with negative weights
- Detecting negative cycles (arbitrage)
- Distance vector routing (RIP protocol)

---

## 5. Floyd-Warshall Algorithm

**Category:** Shortest Path (All-Pairs)  
**Data Structure:** 2D Matrix  
**Time Complexity:** O(V³)  
**Space Complexity:** O(V²)

### Description
Computes shortest paths between **all pairs** of vertices. Uses dynamic programming — considers each vertex as a potential intermediate node in paths between every pair.

### Visualization Steps
1. Initialize distance matrix from adjacency matrix (∞ for no edge)
2. For each intermediate vertex k (0 to V-1):
   - For each pair (i, j):
     - If `dist[i][k] + dist[k][j] < dist[i][j]`, update `dist[i][j]`
3. Final matrix contains all shortest distances

### Key Properties
- Handles negative weights (but not negative cycles)
- Computes ALL pairs simultaneously
- Simple triple-nested loop
- Can reconstruct paths with predecessor matrix

### Use Cases
- All-pairs shortest path
- Transitive closure of a graph
- Detecting negative cycles
- Small dense graphs

---

## 6. Topological Sort

**Category:** Ordering  
**Data Structure:** Queue (Kahn's) or Stack (DFS-based)  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
Produces a linear ordering of vertices in a **Directed Acyclic Graph (DAG)** such that for every directed edge (u, v), vertex u comes before v. Only possible if the graph has no cycles.

### Visualization Steps (Kahn's Algorithm — BFS-based)
1. Compute in-degree for all vertices
2. Enqueue all vertices with in-degree 0
3. Dequeue vertex → add to result
4. Decrease in-degree of all neighbors; enqueue any that reach 0
5. Repeat until queue is empty
6. If result size ≠ V → cycle exists

### Visualization Steps (DFS-based)
1. Run DFS from each unvisited node
2. After all descendants are processed, push node to stack
3. Pop all from stack → topological order

### Key Properties
- Only valid for DAGs
- Not unique (multiple valid orderings possible)
- Kahn's also detects cycles
- DFS approach uses post-order reversal

### Use Cases
- Task scheduling / dependency resolution
- Build systems (Makefile)
- Course prerequisite ordering
- Compilation order

---

## 7. Union-Find (Disjoint Set Union)

**Category:** Data Structure / Connectivity  
**Data Structure:** Array with parent pointers  
**Time Complexity:** O(α(n)) per operation (nearly constant)  
**Space Complexity:** O(V)

### Description
Maintains a collection of disjoint sets. Supports two operations efficiently: **Find** (which set does an element belong to?) and **Union** (merge two sets). Uses path compression and union by rank for near-constant time operations.

### Visualization Steps
1. Initialize: each node is its own parent (self-loop)
2. **Find(x):** Follow parent pointers to root; compress path
3. **Union(x, y):** Find roots of x and y; attach smaller tree under larger tree (union by rank)

### Key Properties
- Inverse Ackermann time complexity (practically O(1))
- Path compression flattens tree on Find
- Union by rank keeps trees balanced
- Tracks connected components dynamically

### Use Cases
- Kruskal's MST algorithm
- Detecting cycles in undirected graphs
- Connected components (dynamic)
- Network connectivity
- Accounts merge / grouping problems

---

## 8. Kruskal's Algorithm

**Category:** Minimum Spanning Tree  
**Data Structure:** Union-Find + sorted edge list  
**Time Complexity:** O(E log E)  
**Space Complexity:** O(V + E)

### Description
Finds the Minimum Spanning Tree (MST) by processing edges in order of increasing weight. Greedily adds the cheapest edge that doesn't form a cycle (checked via Union-Find).

### Visualization Steps
1. Sort all edges by weight (ascending)
2. Initialize Union-Find with V components
3. For each edge (u, v, w) in sorted order:
   - If Find(u) ≠ Find(v): add edge to MST, Union(u, v)
   - Else: skip (would create cycle)
4. Stop when MST has V-1 edges

### Key Properties
- Edge-centric approach
- Greedy algorithm
- Works well for sparse graphs
- Produces forest if graph is disconnected

### Use Cases
- Network design (minimum cost wiring)
- Clustering (stop before last k-1 merges → k clusters)
- Approximation algorithms

---

## 9. Prim's Algorithm

**Category:** Minimum Spanning Tree  
**Data Structure:** Min-Heap (Priority Queue)  
**Time Complexity:** O((V + E) log V)  
**Space Complexity:** O(V + E)

### Description
Grows the MST from a starting vertex by always adding the cheapest edge connecting the tree to a non-tree vertex. Vertex-centric approach — maintains a frontier of reachable edges.

### Visualization Steps
1. Start with any vertex; add to MST set
2. Add all edges from MST set to priority queue
3. Extract minimum weight edge leading to unvisited vertex
4. Add that vertex to MST set; add its edges to queue
5. Repeat until all vertices are in MST

### Key Properties
- Vertex-centric approach (grows a single tree)
- Greedy algorithm
- Works well for dense graphs
- Similar in spirit to Dijkstra's

### Use Cases
- Network design
- Dense graphs (adjacency matrix representation)
- When you need to grow tree from a specific root

---

## 10. Tarjan's Algorithm (Strongly Connected Components)

**Category:** Graph Decomposition  
**Data Structure:** Stack + DFS  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
Finds all **Strongly Connected Components (SCCs)** in a directed graph. An SCC is a maximal set of vertices where every vertex is reachable from every other vertex. Uses DFS with discovery times and low-link values.

### Visualization Steps
1. Run DFS; assign discovery time and low-link to each node
2. Push node onto stack when first discovered
3. After exploring all descendants, update low-link from neighbors
4. If `low-link[v] == discovery[v]` → v is root of an SCC
5. Pop stack until v is popped → all popped nodes form one SCC

### Key Properties
- Single DFS pass
- Low-link value = smallest discovery time reachable
- Root of SCC identified when low-link equals its own discovery time
- Produces SCCs in reverse topological order

### Use Cases
- Identifying strongly connected components
- 2-SAT problem
- Deadlock detection
- Simplifying directed graphs (condensation)

---

## 11. Kosaraju's Algorithm (Strongly Connected Components)

**Category:** Graph Decomposition  
**Data Structure:** Two DFS passes + Stack  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V + E)

### Description
Alternative to Tarjan's for finding SCCs. Uses two passes of DFS — first on the original graph to get finish order, then on the transposed (reversed) graph processing vertices in reverse finish order.

### Visualization Steps
1. **Pass 1:** DFS on original graph; push to stack in post-order
2. **Transpose** the graph (reverse all edges)
3. **Pass 2:** Pop vertices from stack; DFS on transposed graph
4. Each DFS tree in Pass 2 is one SCC

### Key Properties
- Conceptually simpler than Tarjan's
- Requires building transpose graph
- Two full DFS traversals
- Exploits: if u can reach v in G, then v can reach u in G^T

### Use Cases
- Same as Tarjan's (SCCs)
- When transpose graph is easy to compute

---

## 12. A* Search Algorithm

**Category:** Shortest Path (Informed)  
**Data Structure:** Priority Queue  
**Time Complexity:** O(E) in worst case (depends on heuristic)  
**Space Complexity:** O(V)

### Description
An informed search algorithm that finds the shortest path using a heuristic function h(n) to estimate cost from node n to the goal. Combines actual cost g(n) with estimated remaining cost h(n) to prioritize exploration.

### Visualization Steps
1. Initialize: f(source) = g(source) + h(source), open set = {source}
2. Extract node with smallest f(n) from open set
3. If goal reached → reconstruct path
4. For each neighbor: compute tentative g; if better, update and add to open set
5. Repeat until goal found or open set empty

### Key Properties
- Optimal if heuristic is admissible (never overestimates)
- Reduces to Dijkstra when h(n) = 0
- Reduces to greedy best-first when g(n) = 0
- Efficiency depends heavily on heuristic quality

### Use Cases
- Pathfinding in games
- Robot navigation
- Map routing
- Puzzle solving (15-puzzle, etc.)

---

## 13. Bidirectional BFS

**Category:** Shortest Path  
**Data Structure:** Two Queues  
**Time Complexity:** O(b^(d/2)) where b=branching factor, d=depth  
**Space Complexity:** O(b^(d/2))

### Description
Runs BFS simultaneously from both source and target. When the two frontiers meet, the shortest path is found. Dramatically reduces the search space compared to unidirectional BFS.

### Visualization Steps
1. Initialize two queues: one from source, one from target
2. Alternate BFS expansion from each side
3. After each level, check if frontiers overlap
4. When overlap found → combine paths from both sides

### Key Properties
- Much faster than one-directional BFS for large graphs
- Search space reduced from O(b^d) to O(b^(d/2))
- Requires knowing the target node
- Works for unweighted graphs

### Use Cases
- Word ladder problems
- Social network distance
- Large unweighted graphs with known endpoints

---

## 14. Euler Path / Circuit (Hierholzer's Algorithm)

**Category:** Path Finding  
**Data Structure:** Stack + adjacency tracking  
**Time Complexity:** O(E)  
**Space Complexity:** O(E)

### Description
Finds an Eulerian path (visits every **edge** exactly once) or Eulerian circuit (path that returns to start). Hierholzer's algorithm constructs the path by following edges and splicing in sub-circuits.

### Visualization Steps
1. Check existence conditions (in-degree/out-degree rules)
2. Start at appropriate vertex; follow edges (removing them)
3. When stuck, backtrack to a vertex with remaining edges
4. Splice new sub-path into existing path
5. Repeat until all edges used

### Key Properties
- Euler circuit exists iff: all vertices have even degree (undirected) or in-degree = out-degree (directed)
- Euler path exists iff: exactly 0 or 2 vertices have odd degree
- Every edge visited exactly once
- Different from Hamiltonian (which visits every vertex once)

### Use Cases
- Circuit board trace routing
- DNA sequence reconstruction
- Chinese postman problem
- Network inspection routes

---

## 15. Hamiltonian Path (Backtracking / DP with Bitmask)

**Category:** Path Finding (NP-Complete)  
**Data Structure:** Bitmask DP or Backtracking  
**Time Complexity:** O(2^V × V²) with DP  
**Space Complexity:** O(2^V × V)

### Description
Finds a path that visits every **vertex** exactly once (Hamiltonian path) or returns to start (Hamiltonian cycle). NP-complete in general — no known polynomial algorithm.

### Visualization Steps
1. Use bitmask to represent set of visited vertices
2. DP state: `dp[mask][i]` = can we reach vertex i having visited exactly the vertices in mask?
3. Base: `dp[1 << start][start] = true`
4. Transition: try extending from each valid state
5. Answer: any `dp[(1<<V)-1][i]` is true

### Key Properties
- NP-complete (no polynomial solution known)
- Bitmask DP works for V ≤ 20
- Backtracking with pruning for practical cases
- No simple existence condition (unlike Euler)

### Use Cases
- Traveling Salesman Problem (TSP)
- Job scheduling
- Circuit testing

---

## 16. Minimum Cut / Maximum Flow (Ford-Fulkerson / Edmonds-Karp)

**Category:** Network Flow  
**Data Structure:** Residual graph + BFS/DFS  
**Time Complexity:** O(V × E²) for Edmonds-Karp  
**Space Complexity:** O(V²)

### Description
Finds the maximum flow from source to sink in a flow network. Ford-Fulkerson repeatedly finds augmenting paths and pushes flow. Edmonds-Karp uses BFS for path selection guaranteeing polynomial time.

### Visualization Steps
1. Initialize flow = 0 on all edges
2. Build residual graph
3. Find augmenting path from source to sink (BFS for Edmonds-Karp)
4. Find bottleneck (minimum residual capacity along path)
5. Update flow along path; update residual graph
6. Repeat until no augmenting path exists

### Key Properties
- Max-Flow Min-Cut theorem: max flow = min cut
- Residual graph tracks remaining capacity
- Edmonds-Karp guarantees O(VE²)
- Dinic's algorithm improves to O(V²E)

### Use Cases
- Network capacity planning
- Bipartite matching
- Image segmentation
- Baseball elimination problem

---

## 17. Bipartite Check / Graph Coloring (2-color)

**Category:** Classification  
**Data Structure:** BFS/DFS + color array  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
Determines if a graph is bipartite (can be 2-colored such that no adjacent vertices share a color). Equivalent to checking if graph contains no odd-length cycles.

### Visualization Steps
1. Start BFS/DFS from any unvisited vertex; assign color 0
2. For each neighbor: if uncolored, assign opposite color and continue
3. If neighbor already has same color → NOT bipartite
4. Repeat for all components

### Key Properties
- Bipartite iff no odd-length cycle
- 2-colorable = bipartite
- Can be checked in linear time
- k-coloring for k≥3 is NP-complete

### Use Cases
- Matching problems
- Conflict detection
- Task assignment
- Checking if graph is bipartite for matching algorithms

---

## 18. Articulation Points and Bridges

**Category:** Graph Connectivity  
**Data Structure:** DFS + discovery/low arrays  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
**Articulation points** (cut vertices) are vertices whose removal disconnects the graph. **Bridges** (cut edges) are edges whose removal disconnects the graph. Found using DFS with discovery times and low-link values.

### Visualization Steps
1. Run DFS; track discovery time and low-link for each vertex
2. **Articulation point:** vertex u is AP if:
   - u is root with 2+ children, OR
   - u is not root and has child v with `low[v] >= disc[u]`
3. **Bridge:** edge (u,v) is bridge if `low[v] > disc[u]`

### Key Properties
- Based on DFS tree structure
- Low-link = minimum discovery time reachable via subtree + one back edge
- Root is special case (needs 2+ DFS children)
- Linear time via single DFS

### Use Cases
- Network reliability analysis
- Finding critical connections
- Identifying vulnerable points in networks
- Biconnected components

---

## 19. Shortest Path in DAG

**Category:** Shortest Path  
**Data Structure:** Topological order + relaxation  
**Time Complexity:** O(V + E)  
**Space Complexity:** O(V)

### Description
For DAGs, shortest paths can be found in linear time by processing vertices in topological order and relaxing edges. Works with negative weights (since no cycles exist).

### Visualization Steps
1. Compute topological sort
2. Initialize distances: source = 0, all others = ∞
3. Process vertices in topological order:
   - For each outgoing edge (u, v, w): relax `dist[v] = min(dist[v], dist[u] + w)`

### Key Properties
- Linear time (faster than Dijkstra/Bellman-Ford)
- Works with negative weights
- Requires DAG (no cycles)
- Can also find longest path (negate weights or use max)

### Use Cases
- Critical path method (project scheduling)
- Longest path in DAG
- Dynamic programming on graphs

---

## 20. Graph Coloring (Greedy)

**Category:** Optimization  
**Data Structure:** Array + ordering  
**Time Complexity:** O(V + E) for greedy  
**Space Complexity:** O(V)

### Description
Assigns colors to vertices such that no two adjacent vertices share the same color, using minimum colors. Greedy approach processes vertices in some order, assigning the smallest available color.

### Visualization Steps
1. Order vertices (by degree, or arbitrary)
2. For each vertex in order:
   - Check colors of all already-colored neighbors
   - Assign smallest color not used by any neighbor

### Key Properties
- Greedy gives at most Δ+1 colors (Δ = max degree)
- Optimal coloring (chromatic number) is NP-hard
- Order of vertices affects result
- Welsh-Powell: order by decreasing degree

### Use Cases
- Register allocation in compilers
- Scheduling problems
- Map coloring
- Frequency assignment

---

## Summary Table

| Algorithm | Category | Time | Weights | Graph Type |
|-----------|----------|------|---------|------------|
| BFS | Traversal | O(V+E) | Unweighted | Any |
| DFS | Traversal | O(V+E) | — | Any |
| Dijkstra | Shortest Path | O((V+E)logV) | Non-negative | Weighted |
| Bellman-Ford | Shortest Path | O(VE) | Any | Weighted |
| Floyd-Warshall | All-Pairs SP | O(V³) | Any | Weighted |
| Topological Sort | Ordering | O(V+E) | — | DAG |
| Union-Find | Connectivity | O(α(n)) | — | Any |
| Kruskal's | MST | O(E log E) | Positive | Weighted |
| Prim's | MST | O((V+E)logV) | Positive | Weighted |
| Tarjan's | SCC | O(V+E) | — | Directed |
| Kosaraju's | SCC | O(V+E) | — | Directed |
| A* | Shortest Path | O(E)* | Non-negative | Weighted |
| Bidirectional BFS | Shortest Path | O(b^(d/2)) | Unweighted | Any |
| Hierholzer's | Euler Path | O(E) | — | Any |
| Ford-Fulkerson | Max Flow | O(VE²) | Capacities | Directed |
| Bipartite Check | Classification | O(V+E) | — | Any |
| Articulation Pts | Connectivity | O(V+E) | — | Undirected |
| DAG Shortest Path | Shortest Path | O(V+E) | Any | DAG |
| Graph Coloring | Optimization | O(V+E) | — | Any |
