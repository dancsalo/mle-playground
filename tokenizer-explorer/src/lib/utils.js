import { TOKEN_COLORS } from '../stores/index.js';

/**
 * Assign colors to tokens for visualization
 */
export function assignTokenColors(tokens) {
  const uniqueTokens = [...new Set(tokens)];
  const colorMap = new Map();
  uniqueTokens.forEach((token, i) => {
    colorMap.set(token, TOKEN_COLORS[i % TOKEN_COLORS.length]);
  });
  return colorMap;
}

/**
 * Format a token for display (show whitespace chars)
 */
export function formatToken(token) {
  return token
    .replace(/ /g, '·')
    .replace(/\n/g, '↵')
    .replace(/\t/g, '→');
}

/**
 * Compute compression ratio
 */
export function compressionRatio(originalText, tokens) {
  return originalText.length / tokens.length;
}

/**
 * Generate a merge tree structure for D3 visualization
 */
export function buildMergeTree(merges) {
  const nodes = new Map();
  let id = 0;

  function getOrCreateNode(token) {
    if (!nodes.has(token)) {
      nodes.set(token, { id: id++, name: token, children: [] });
    }
    return nodes.get(token);
  }

  for (const [a, b] of merges) {
    const merged = a + b;
    const nodeA = getOrCreateNode(a);
    const nodeB = getOrCreateNode(b);
    const mergedNode = { id: id++, name: merged, children: [nodeA, nodeB] };
    nodes.set(merged, mergedNode);
  }

  // Return the last merged nodes as roots
  if (merges.length === 0) return null;
  
  // Find all nodes that are not children of any other node
  const childSet = new Set();
  for (const node of nodes.values()) {
    for (const child of node.children) {
      childSet.add(child.name);
    }
  }

  const roots = [...nodes.entries()]
    .filter(([name]) => !childSet.has(name))
    .map(([, node]) => node);

  return { name: 'root', children: roots };
}

/**
 * Delay utility for animations
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate text for display
 */
export function truncate(text, maxLen = 50) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
