# Common Graph Patterns & Templates

## Pattern 1: Grid as Graph

Many problems use a 2D grid as an implicit graph where each cell connects to its 4 (or 8) neighbors.

```python
# 4-directional movement
directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]

def bfs_grid(grid, start_r, start_c):
    rows, cols = len(grid), len(grid[0])
    visited = set()
    queue = deque([(start_r, start_c, 0)])  # row, col, distance
    visited.add((start_r, start_c))
    
    while queue:
        r, c, dist = queue.popleft()
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited:
                if grid[nr][nc] != obstacle:
                    visited.add((nr, nc))
                    queue.append((nr, nc, dist + 1))
```

---

## Pattern 2: Multi-Source BFS

Start BFS from multiple sources simultaneously (e.g., rotting oranges, 01 matrix).

```python
def multi_source_bfs(grid, sources):
    queue = deque()
    visited = set()
    for r, c in sources:
        queue.append((r, c, 0))
        visited.add((r, c))
    
    while queue:
        r, c, dist = queue.popleft()
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if valid(nr, nc) and (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append((nr, nc, dist + 1))
```

---

## Pattern 3: Topological Sort (Kahn's BFS)

```python
def topological_sort(num_nodes, edges):
    graph = defaultdict(list)
    in_degree = [0] * num_nodes
    
    for u, v in edges:
        graph[u].append(v)
        in_degree[v] += 1
    
    queue = deque([i for i in range(num_nodes) if in_degree[i] == 0])
    order = []
    
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    return order if len(order) == num_nodes else []  # empty = cycle
```

---

## Pattern 4: Union-Find Template

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]
    
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False  # already connected
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True
```

---

## Pattern 5: Dijkstra Template

```python
import heapq

def dijkstra(graph, source, n):
    dist = [float('inf')] * n
    dist[source] = 0
    heap = [(0, source)]
    
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue  # skip outdated entries
        for v, weight in graph[u]:
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight
                heapq.heappush(heap, (dist[v], v))
    
    return dist
```

---

## Pattern 6: DFS Cycle Detection (Directed Graph)

Uses three states: WHITE (unvisited), GRAY (in current path), BLACK (fully processed).

```python
def has_cycle(graph, n):
    WHITE, GRAY, BLACK = 0, 1, 2
    color = [WHITE] * n
    
    def dfs(node):
        color[node] = GRAY
        for neighbor in graph[node]:
            if color[neighbor] == GRAY:
                return True  # back edge = cycle
            if color[neighbor] == WHITE and dfs(neighbor):
                return True
        color[node] = BLACK
        return False
    
    return any(color[i] == WHITE and dfs(i) for i in range(n))
```

---

## Pattern 7: Bipartite Check

```python
def is_bipartite(graph, n):
    color = [-1] * n
    
    for start in range(n):
        if color[start] != -1:
            continue
        queue = deque([start])
        color[start] = 0
        while queue:
            node = queue.popleft()
            for neighbor in graph[node]:
                if color[neighbor] == -1:
                    color[neighbor] = 1 - color[node]
                    queue.append(neighbor)
                elif color[neighbor] == color[node]:
                    return False
    return True
```

---

## Pattern 8: BFS with State (Level tracking)

```python
def bfs_with_levels(graph, source):
    visited = {source}
    queue = deque([source])
    level = 0
    
    while queue:
        level += 1
        for _ in range(len(queue)):  # process entire level
            node = queue.popleft()
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
    return level
```

---

## Pattern 9: Bellman-Ford with K Edges Limit

```python
def bellman_ford_k_edges(n, edges, source, target, k):
    dist = [float('inf')] * n
    dist[source] = 0
    
    for _ in range(k):
        prev = dist[:]  # use previous iteration's values
        for u, v, w in edges:
            if prev[u] + w < dist[v]:
                dist[v] = prev[u] + w
    
    return dist[target] if dist[target] != float('inf') else -1
```

---

## Pattern 10: Articulation Points / Bridges

```python
def find_bridges(n, graph):
    disc = [0] * n
    low = [0] * n
    visited = [False] * n
    bridges = []
    timer = [0]
    
    def dfs(u, parent):
        visited[u] = True
        timer[0] += 1
        disc[u] = low[u] = timer[0]
        
        for v in graph[u]:
            if not visited[v]:
                dfs(v, u)
                low[u] = min(low[u], low[v])
                if low[v] > disc[u]:
                    bridges.append((u, v))
            elif v != parent:
                low[u] = min(low[u], disc[v])
    
    for i in range(n):
        if not visited[i]:
            dfs(i, -1)
    return bridges
```

---

## Key Insights for Problem Solving

### When to use BFS vs DFS:
- **BFS**: Shortest path (unweighted), level-order, minimum steps
- **DFS**: Connectivity, cycle detection, path existence, backtracking

### When to use Dijkstra vs Bellman-Ford:
- **Dijkstra**: Non-negative weights, single source
- **Bellman-Ford**: Negative weights, or constraint on number of edges

### When to use Union-Find vs BFS/DFS:
- **Union-Find**: Dynamic connectivity, edge-by-edge processing, "is connected?" queries
- **BFS/DFS**: Static graph traversal, path finding

### Implicit Graph Problems:
- Word ladder (words connected if 1 char different)
- Lock combinations (states connected by single-digit rotation)
- Sliding puzzle (board states connected by one move)
- The graph isn't given — you construct it from the problem rules
