import "../../chunks/index-server.js";
import { L as attr, R as escape_html, n as attr_class, r as attr_style, s as stringify } from "../../chunks/dev.js";
import "d3";
//#region src/lib/components/IVFView.svelte
function IVFView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { points, clusters, queryState, width = 320, height = 280 } = $$props;
		const margin = {
			top: 15,
			right: 15,
			bottom: 25,
			left: 25
		};
		width - margin.left - margin.right;
		height - margin.top - margin.bottom;
		$$renderer.push(`<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">1. IVF Partitioning</h3> <div class="flex justify-center"></div> <div class="mt-2 text-center text-xs text-gray-400">${escape_html(clusters.length)} partitions • Click clusters to explore</div></div>`);
	});
}
//#endregion
//#region src/lib/components/PQView.svelte
function PQView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { points, queryState, numSubspaces = 8, width = 280, height = 280 } = $$props;
		const margin = {
			top: 15,
			right: 15,
			bottom: 30,
			left: 35
		};
		width - margin.left - margin.right;
		height - margin.top - margin.bottom;
		$$renderer.push(`<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">2. Product Quantization</h3> <div class="flex justify-center"></div> <div class="mt-2 text-center text-xs text-gray-400">${escape_html(numSubspaces)} subspaces • 256 centroids per subspace</div></div>`);
	});
}
//#endregion
//#region src/lib/components/HNSWView.svelte
function HNSWView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { nodes, searchPath, queryState, numLayers = 3, width = 320, height = 280 } = $$props;
		const margin = {
			top: 15,
			right: 15,
			bottom: 25,
			left: 25
		};
		width - margin.left - margin.right;
		height - margin.top - margin.bottom;
		$$renderer.push(`<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">3. HNSW Graph Traversal</h3> <div class="flex justify-center"></div> <div class="mt-2 text-center text-xs text-gray-400">${escape_html(numLayers)} layers • Greedy navigation</div></div>`);
	});
}
//#endregion
//#region src/lib/components/MetricsPanel.svelte
function MetricsPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { metrics, stage = "idle" } = $$props;
		const stageLabels = {
			idle: "Ready",
			ivf: "Partitioning",
			pq: "Compressing",
			hnsw: "Navigating",
			exact: "Reranking",
			complete: "Complete"
		};
		const stageColors = {
			idle: "text-gray-500",
			ivf: "text-blue-500",
			pq: "text-green-500",
			hnsw: "text-purple-500",
			exact: "text-orange-500",
			complete: "text-green-600"
		};
		function formatBytes(bytes) {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		}
		function formatNum(n) {
			if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
			if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
			return n.toString();
		}
		$$renderer.push(`<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">4. Search Metrics</h3> <div class="mb-4 rounded-lg bg-gray-50 p-3 text-center"><div class="text-xs text-gray-400">Current Stage</div> <div${attr_class(`text-lg font-bold ${stringify(stageColors[stage])}`)}>${escape_html(stageLabels[stage])}</div></div> `);
		if (metrics) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="grid grid-cols-2 gap-3 text-xs"><div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">Total Vectors</div> <div class="mono text-base font-semibold text-gray-700">${escape_html(formatNum(metrics.totalVectors))}</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">IVF Candidates</div> <div class="mono text-base font-semibold text-blue-600">${escape_html(formatNum(metrics.ivfCandidates))}</div> <div class="text-[10px] text-gray-400">${escape_html((metrics.ivfCandidates / metrics.totalVectors * 100).toFixed(1))}% of total</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">PQ Comparisons</div> <div class="mono text-base font-semibold text-green-600">${escape_html(formatNum(metrics.pqComparisons))}</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">HNSW Nodes</div> <div class="mono text-base font-semibold text-purple-600">${escape_html(formatNum(metrics.hnswNodesVisited))}</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">Original Memory</div> <div class="mono text-base font-semibold text-gray-700">${escape_html(formatBytes(metrics.memoryOriginal))}</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">Compressed Memory</div> <div class="mono text-base font-semibold text-green-600">${escape_html(formatBytes(metrics.memoryCompressed))}</div> <div class="text-[10px] text-green-500">${escape_html(((1 - metrics.memoryCompressed / metrics.memoryOriginal) * 100).toFixed(0))}% saved</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">Latency</div> <div class="mono text-base font-semibold text-orange-600">${escape_html(metrics.latency)}ms</div></div> <div class="rounded-lg border border-gray-100 p-2"><div class="text-gray-400">Recall</div> <div class="mono text-base font-semibold text-green-600">${escape_html((metrics.recall * 100).toFixed(1))}%</div></div></div> <div class="mt-4"><div class="text-xs text-gray-400 mb-2">Search Space Reduction</div> <div class="relative h-8 w-full overflow-hidden rounded-full bg-gray-100"><div class="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"${attr_style(`width: ${stringify(Math.min(100, metrics.ivfCandidates / metrics.totalVectors * 100))}%`)}></div> <div class="absolute top-0 h-full bg-green-500 transition-all duration-500"${attr_style(`left: ${stringify(Math.min(100, metrics.ivfCandidates / metrics.totalVectors * 100))}%; width: ${stringify(Math.min(100 - metrics.ivfCandidates / metrics.totalVectors * 100, metrics.pqComparisons / metrics.totalVectors * 100))}%`)}></div> <div class="absolute top-0 h-full bg-purple-500 transition-all duration-500"${attr_style(`left: ${stringify(Math.min(100, (metrics.ivfCandidates + metrics.pqComparisons) / metrics.totalVectors * 100))}%; width: ${stringify(Math.min(100 - (metrics.ivfCandidates + metrics.pqComparisons) / metrics.totalVectors * 100, metrics.hnswNodesVisited / metrics.totalVectors * 100))}%`)}></div></div> <div class="flex justify-between text-[10px] text-gray-400 mt-1"><span>100%</span> <span>IVF</span> <span>PQ</span> <span>HNSW</span> <span>Final</span></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="text-center text-sm text-gray-400 py-8">Run a search to see metrics</div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let numPoints = 150;
		let numPartitions = 6;
		let numLayers = 3;
		let ivfProbes = 3;
		let points = [];
		let clusters = [];
		let nodes = [];
		let queryPoint = {
			x: .5,
			y: .5
		};
		let searchPath = [];
		let queryState = null;
		let metrics = null;
		$$renderer.push(`<div id="app" class="min-w-[1200px]"><header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur"><div class="flex items-center gap-6 px-6 py-3"><div class="text-lg font-bold text-gray-800"><span class="text-[var(--hnsw-primary)]">HNSW</span> <span class="text-sm font-normal text-gray-500">Explorer</span></div> <div class="flex items-center gap-4 text-xs"><label class="flex items-center gap-2"><span class="font-medium text-gray-600">Vectors (N)</span> <input type="range" min="50" max="500" step="50"${attr("value", numPoints)} class="w-16"/> <span class="mono w-8 text-center font-medium">${escape_html(numPoints)}</span></label> <label class="flex items-center gap-2"><span class="font-medium text-gray-600">IVF Partitions</span> <input type="range" min="2" max="12" step="1"${attr("value", numPartitions)} class="w-16"/> <span class="mono w-6 text-center font-medium">${escape_html(numPartitions)}</span></label> <label class="flex items-center gap-2"><span class="font-medium text-gray-600">HNSW Layers</span> <input type="range" min="2" max="5" step="1"${attr("value", numLayers)} class="w-16"/> <span class="mono w-6 text-center font-medium">${escape_html(numLayers)}</span></label> <label class="flex items-center gap-2"><span class="font-medium text-gray-600">IVF Probes</span> <input type="range" min="1" max="6" step="1"${attr("value", ivfProbes)} class="w-16"/> <span class="mono w-6 text-center font-medium">${escape_html(ivfProbes)}</span></label></div> <div class="ml-auto flex items-center gap-2"><button class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Random Query</button> <button class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Reset</button> <button${attr("disabled", false, true)} class="rounded-lg bg-[var(--hnsw-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">${escape_html("Run Search")}</button></div></div></header> <main class="p-6"><div class="mb-4 flex items-center justify-between"><div><h2 class="text-sm font-semibold text-gray-700">Query Vector Position</h2> <p class="text-xs text-gray-400">Click anywhere in the IVF view to set query position</p></div> <div class="mono text-sm"><span class="text-gray-500">Query:</span> <span class="ml-2 font-medium text-[var(--hnsw-query)]">(${escape_html(queryPoint.x.toFixed(3))}, ${escape_html(queryPoint.y.toFixed(3))})</span></div></div> <div class="grid grid-cols-4 gap-4">`);
		IVFView($$renderer, {
			points,
			clusters,
			queryState,
			width: 280,
			height: 260
		});
		$$renderer.push(`<!----> `);
		PQView($$renderer, {
			points,
			queryState,
			numSubspaces: 8,
			width: 260,
			height: 260
		});
		$$renderer.push(`<!----> `);
		HNSWView($$renderer, {
			nodes,
			searchPath,
			queryState,
			numLayers,
			width: 280,
			height: 260
		});
		$$renderer.push(`<!----> `);
		MetricsPanel($$renderer, {
			metrics,
			stage: "idle"
		});
		$$renderer.push(`<!----></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6"><h2 class="mb-4 text-lg font-semibold text-gray-800">How HNSW Search Works</h2> <div class="grid grid-cols-4 gap-6 text-sm"><div><h3 class="mb-2 font-semibold text-blue-600">1. IVF Partitioning</h3> <p class="text-gray-600">Cluster vectors into ${escape_html(numPartitions)} partitions using k-means. 
            Query only searches ${escape_html(ivfProbes)} nearest partitions instead of all ${escape_html(numPoints)} vectors.
            This reduces candidates from ${escape_html(numPoints)} to ~${escape_html(Math.round(numPoints * ivfProbes / numPartitions))}.</p></div> <div><h3 class="mb-2 font-semibold text-green-600">2. Product Quantization</h3> <p class="text-gray-600">Split vectors into 8 sub-spaces, each with 256 centroids.
            Compresses each 128-float vector (512 bytes) to 8 bytes.
            Massive memory savings enable fitting large datasets in RAM.</p></div> <div><h3 class="mb-2 font-semibold text-purple-600">3. HNSW Graph</h3> <p class="text-gray-600">Navigate a ${escape_html(numLayers)}-layer graph using greedy routing.
            Start from sparse top layer, descend to dense bottom layer.
            Logarithmic complexity: O(log N) instead of O(N).</p></div> <div><h3 class="mb-2 font-semibold text-orange-600">4. Exact Reranking</h3> <p class="text-gray-600">Compute exact distances to final candidates.
            Return top-K nearest neighbors with high recall.
            Typical latency: ${escape_html("~")}ms vs ${escape_html(numPoints * .01)}ms for brute force.</p></div></div></section></main></div>`);
	});
}
//#endregion
export { _page as default };
