import "../../chunks/index-server.js";
import { B as escape_html, a as derived, i as bind_props, l as stringify, n as attr_class, o as ensure_array_like, r as attr_style, z as attr } from "../../chunks/dev.js";
import "d3";
//#region src/lib/gcn.ts
/**
* Small "academic social network" graph for node classification.
* Three groups: ML researchers, Systems researchers, Theory researchers.
* Features: [#papers, #citations_norm, years_active_norm, collab_score]
*/
function createKarateGraph() {
	return {
		nodes: [
			{
				id: 0,
				label: "Alice",
				features: [
					.9,
					.8,
					.7,
					.6
				],
				trueClass: 0,
				isLabeled: true
			},
			{
				id: 1,
				label: "Bob",
				features: [
					.7,
					.9,
					.5,
					.8
				],
				trueClass: 0,
				isLabeled: true
			},
			{
				id: 2,
				label: "Carol",
				features: [
					.8,
					.7,
					.6,
					.7
				],
				trueClass: 0,
				isLabeled: false
			},
			{
				id: 3,
				label: "Dan",
				features: [
					.6,
					.6,
					.8,
					.5
				],
				trueClass: 0,
				isLabeled: false
			},
			{
				id: 4,
				label: "Eve",
				features: [
					.85,
					.75,
					.4,
					.9
				],
				trueClass: 0,
				isLabeled: false
			},
			{
				id: 5,
				label: "Frank",
				features: [
					.4,
					.3,
					.9,
					.2
				],
				trueClass: 1,
				isLabeled: true
			},
			{
				id: 6,
				label: "Grace",
				features: [
					.3,
					.4,
					.8,
					.3
				],
				trueClass: 1,
				isLabeled: true
			},
			{
				id: 7,
				label: "Hank",
				features: [
					.5,
					.2,
					.7,
					.4
				],
				trueClass: 1,
				isLabeled: false
			},
			{
				id: 8,
				label: "Iris",
				features: [
					.35,
					.35,
					.85,
					.25
				],
				trueClass: 1,
				isLabeled: false
			},
			{
				id: 9,
				label: "Jack",
				features: [
					.2,
					.5,
					.3,
					.1
				],
				trueClass: 2,
				isLabeled: true
			},
			{
				id: 10,
				label: "Kate",
				features: [
					.1,
					.6,
					.2,
					.15
				],
				trueClass: 2,
				isLabeled: true
			},
			{
				id: 11,
				label: "Leo",
				features: [
					.25,
					.4,
					.4,
					.2
				],
				trueClass: 2,
				isLabeled: false
			},
			{
				id: 12,
				label: "Mia",
				features: [
					.15,
					.55,
					.25,
					.1
				],
				trueClass: 2,
				isLabeled: false
			}
		],
		edges: [
			{
				source: 0,
				target: 1
			},
			{
				source: 0,
				target: 2
			},
			{
				source: 0,
				target: 3
			},
			{
				source: 1,
				target: 2
			},
			{
				source: 1,
				target: 4
			},
			{
				source: 2,
				target: 4
			},
			{
				source: 3,
				target: 4
			},
			{
				source: 5,
				target: 6
			},
			{
				source: 5,
				target: 7
			},
			{
				source: 5,
				target: 8
			},
			{
				source: 6,
				target: 7
			},
			{
				source: 6,
				target: 8
			},
			{
				source: 7,
				target: 8
			},
			{
				source: 9,
				target: 10
			},
			{
				source: 9,
				target: 11
			},
			{
				source: 9,
				target: 12
			},
			{
				source: 10,
				target: 11
			},
			{
				source: 10,
				target: 12
			},
			{
				source: 11,
				target: 12
			},
			{
				source: 3,
				target: 5
			},
			{
				source: 4,
				target: 7
			},
			{
				source: 8,
				target: 11
			},
			{
				source: 2,
				target: 9
			}
		],
		numClasses: 3,
		classNames: [
			"ML",
			"Systems",
			"Theory"
		],
		classColors: [
			"#3B82F6",
			"#10B981",
			"#F59E0B"
		]
	};
}
/**
* Molecule graph — classify atoms as part of a ring vs chain vs functional group
*/
function createMoleculeGraph() {
	return {
		nodes: [
			{
				id: 0,
				label: "C₁",
				features: [
					.8,
					0,
					1,
					.5
				],
				trueClass: 0,
				isLabeled: true
			},
			{
				id: 1,
				label: "C₂",
				features: [
					.8,
					0,
					1,
					.5
				],
				trueClass: 0,
				isLabeled: false
			},
			{
				id: 2,
				label: "C₃",
				features: [
					.8,
					0,
					1,
					.5
				],
				trueClass: 0,
				isLabeled: true
			},
			{
				id: 3,
				label: "C₄",
				features: [
					.8,
					0,
					1,
					.5
				],
				trueClass: 0,
				isLabeled: false
			},
			{
				id: 4,
				label: "C₅",
				features: [
					.8,
					0,
					1,
					.5
				],
				trueClass: 0,
				isLabeled: false
			},
			{
				id: 5,
				label: "C₆",
				features: [
					.8,
					0,
					1,
					.5
				],
				trueClass: 0,
				isLabeled: true
			},
			{
				id: 6,
				label: "C₇",
				features: [
					.8,
					0,
					.5,
					.3
				],
				trueClass: 1,
				isLabeled: true
			},
			{
				id: 7,
				label: "C₈",
				features: [
					.8,
					0,
					.5,
					.2
				],
				trueClass: 1,
				isLabeled: false
			},
			{
				id: 8,
				label: "C₉",
				features: [
					.8,
					0,
					.5,
					.1
				],
				trueClass: 1,
				isLabeled: true
			},
			{
				id: 9,
				label: "O",
				features: [
					0,
					1,
					0,
					.8
				],
				trueClass: 2,
				isLabeled: true
			},
			{
				id: 10,
				label: "H₁",
				features: [
					0,
					0,
					0,
					.1
				],
				trueClass: 2,
				isLabeled: false
			},
			{
				id: 11,
				label: "H₂",
				features: [
					0,
					0,
					0,
					.1
				],
				trueClass: 2,
				isLabeled: true
			}
		],
		edges: [
			{
				source: 0,
				target: 1
			},
			{
				source: 1,
				target: 2
			},
			{
				source: 2,
				target: 3
			},
			{
				source: 3,
				target: 4
			},
			{
				source: 4,
				target: 5
			},
			{
				source: 5,
				target: 0
			},
			{
				source: 0,
				target: 6
			},
			{
				source: 6,
				target: 7
			},
			{
				source: 7,
				target: 8
			},
			{
				source: 8,
				target: 9
			},
			{
				source: 9,
				target: 10
			},
			{
				source: 8,
				target: 11
			}
		],
		numClasses: 3,
		classNames: [
			"Ring",
			"Chain",
			"Functional"
		],
		classColors: [
			"#3B82F6",
			"#10B981",
			"#F59E0B"
		]
	};
}
var DATASETS = [{
	name: "Academic Network",
	create: createKarateGraph
}, {
	name: "Molecule",
	create: createMoleculeGraph
}];
function zeros(rows, cols) {
	return Array.from({ length: rows }, () => Array(cols).fill(0));
}
function zerosVec(n) {
	return Array(n).fill(0);
}
/** Xavier/Glorot initialization */
function xavierInit(rows, cols) {
	const scale = Math.sqrt(2 / (rows + cols));
	return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() * 2 - 1) * scale));
}
/**
* Compute normalized adjacency matrix with self-loops:
*   Â = D̃^(-½) Ã D̃^(-½)
* where Ã = A + I
*/
function computeNormAdjacency(graph) {
	const n = graph.nodes.length;
	const A = zeros(n, n);
	for (let i = 0; i < n; i++) A[i][i] = 1;
	for (const { source, target } of graph.edges) {
		A[source][target] = 1;
		A[target][source] = 1;
	}
	const D = zerosVec(n);
	for (let i = 0; i < n; i++) D[i] = A[i].reduce((a, b) => a + b, 0);
	const Anorm = zeros(n, n);
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (A[i][j] !== 0) Anorm[i][j] = A[i][j] / Math.sqrt(D[i] * D[j]);
	return Anorm;
}
function initGCN(graph, hiddenDim = 8, learningRate = .05) {
	const inputDim = graph.nodes[0].features.length;
	const numClasses = graph.numClasses;
	return {
		graph,
		weights: {
			W1: xavierInit(inputDim, hiddenDim),
			W2: xavierInit(hiddenDim, numClasses),
			b1: zerosVec(hiddenDim),
			b2: zerosVec(numClasses)
		},
		history: [],
		epoch: 0,
		learningRate,
		hiddenDim
	};
}
//#endregion
//#region src/lib/components/GraphView.svelte
function GraphView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { graph, forwardResult = void 0, selectedNode = -1, highlightLayer = 0, showMessages = false, mode = "features" } = $$props;
		let width = 520;
		let height = 400;
		let nodePositions = [];
		function getNodeColor(nodeId) {
			if (mode === "predictions" && forwardResult) {
				const predicted = forwardResult.predictedClasses[nodeId];
				return graph.classColors[predicted];
			}
			return graph.classColors[graph.nodes[nodeId].trueClass];
		}
		function getNodeOpacity(nodeId) {
			if (mode === "predictions" && forwardResult) {
				const probs = forwardResult.predictions[nodeId];
				return .4 + .6 * Math.max(...probs);
			}
			return graph.nodes[nodeId].isLabeled ? 1 : .6;
		}
		function getNodeStroke(nodeId) {
			if (selectedNode === nodeId) return "#1F2937";
			if (mode === "predictions" && forwardResult) return forwardResult.predictedClasses[nodeId] === graph.nodes[nodeId].trueClass ? "#10B981" : "#EF4444";
			return graph.nodes[nodeId].isLabeled ? "#374151" : "#D1D5DB";
		}
		function getNodeStrokeWidth(nodeId) {
			if (selectedNode === nodeId) return 3;
			if (mode === "predictions") return 2.5;
			return graph.nodes[nodeId].isLabeled ? 2 : 1.5;
		}
		let activeMessages = derived(() => showMessages && forwardResult ? highlightLayer === 1 ? forwardResult.layer1.messages : forwardResult.layer2.messages : []);
		$$renderer.push(`<svg${attr("width", width)}${attr("height", height)} class="rounded-xl border border-gray-200 bg-white"><defs><marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#F59E0B" opacity="0.7"></polygon></marker></defs>`);
		if (nodePositions.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(graph.edges);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let edge = each_array[$$index];
				$$renderer.push(`<line${attr("x1", nodePositions[edge.source]?.x)}${attr("y1", nodePositions[edge.source]?.y)}${attr("x2", nodePositions[edge.target]?.x)}${attr("y2", nodePositions[edge.target]?.y)} stroke="#E5E7EB" stroke-width="1.5"${attr("opacity", selectedNode >= 0 && edge.source !== selectedNode && edge.target !== selectedNode ? .2 : .8)}></line>`);
			}
			$$renderer.push(`<!--]-->`);
			if (showMessages && selectedNode >= 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(activeMessages().filter((m) => m.to === selectedNode));
				for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
					let msg = each_array_1[i];
					$$renderer.push(`<line${attr("x1", nodePositions[msg.from]?.x)}${attr("y1", nodePositions[msg.from]?.y)}${attr("x2", nodePositions[msg.to]?.x)}${attr("y2", nodePositions[msg.to]?.y)} stroke="#F59E0B" stroke-width="2.5" opacity="0.8" marker-end="url(#arrowhead)" class="message-path"${attr_style(`animation-delay: ${stringify(i * 200)}ms`)}></line>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--><!--[-->`);
			const each_array_2 = ensure_array_like(graph.nodes);
			for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
				let node = each_array_2[i];
				$$renderer.push(`<g${attr_class("graph-node", void 0, { "node-active": selectedNode === i && showMessages })}${attr("transform", `translate(${stringify(nodePositions[i]?.x ?? 0)}, ${stringify(nodePositions[i]?.y ?? 0)})`)} role="button" tabindex="0"><circle${attr("r", graph.nodes[i].isLabeled ? 18 : 14)}${attr("fill", getNodeColor(i))}${attr("opacity", getNodeOpacity(i))}${attr("stroke", getNodeStroke(i))}${attr("stroke-width", getNodeStrokeWidth(i))}></circle><text text-anchor="middle" dy="0.35em"${attr("font-size", graph.nodes[i].isLabeled ? "9" : "8")}${attr("font-weight", graph.nodes[i].isLabeled ? "600" : "400")} fill="white">${escape_html(node.label.length > 4 ? node.label.slice(0, 4) : node.label)}</text>`);
				if (graph.nodes[i].isLabeled) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<circle r="4" cx="12" cy="-12" fill="#374151" stroke="white" stroke-width="1"></circle><text x="12" y="-9" text-anchor="middle" font-size="5" fill="white" font-weight="700">L</text>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></g>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--><g transform="translate(10, 340)"><!--[-->`);
		const each_array_3 = ensure_array_like(graph.classNames);
		for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
			let cls = each_array_3[i];
			$$renderer.push(`<g${attr("transform", `translate(0, ${stringify(i * 18)})`)}><circle r="5" cx="5" cy="0"${attr("fill", graph.classColors[i])}></circle><text x="15" y="4" font-size="10" fill="#6B7280">${escape_html(cls)}</text></g>`);
		}
		$$renderer.push(`<!--]--></g><text${attr("x", width - 10)} y="18" text-anchor="end" font-size="9" fill="#9CA3AF" class="mono">${escape_html(mode === "features" ? "Ground Truth" : mode === "predictions" ? "Predictions" : "Embeddings")}</text></svg>`);
		bind_props($$props, { selectedNode });
	});
}
//#endregion
//#region src/lib/components/FeatureView.svelte
function FeatureView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { graph, selectedNode = -1 } = $$props;
		let displayNodes = derived(() => selectedNode >= 0 ? [graph.nodes[selectedNode]] : graph.nodes.slice(0, 6));
		function featureColor(v) {
			const intensity = Math.abs(v);
			if (v >= .5) return `rgba(59, 130, 246, ${.3 + intensity * .7})`;
			if (v >= .25) return `rgba(59, 130, 246, ${intensity * .6})`;
			return `rgba(156, 163, 175, ${.2 + intensity * .3})`;
		}
		const featureNames = [
			"papers",
			"citations",
			"years",
			"collab"
		];
		$$renderer.push(`<div class="rounded-lg border border-gray-200 bg-white p-3"><div class="mb-2 flex items-center gap-2"><span class="text-[10px] font-bold uppercase text-gray-500">Node Features (H⁰)</span> `);
		if (selectedNode >= 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="rounded-full px-1.5 py-0.5 text-[8px] font-medium text-white"${attr_style(`background-color: ${stringify(graph.classColors[graph.nodes[selectedNode].trueClass])}`)}>${escape_html(graph.nodes[selectedNode].label)}</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="mb-1 flex items-center gap-1 pl-12"><!--[-->`);
		const each_array = ensure_array_like(featureNames);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let name = each_array[$$index];
			$$renderer.push(`<span class="w-11 text-center text-[7px] text-gray-400">${escape_html(name)}</span>`);
		}
		$$renderer.push(`<!--]--></div> <div class="space-y-0.5"><!--[-->`);
		const each_array_1 = ensure_array_like(displayNodes());
		for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
			let node = each_array_1[$$index_2];
			$$renderer.push(`<div class="flex items-center gap-1"><span class="w-10 truncate text-[9px] font-medium text-gray-600">${escape_html(node.label)}</span> <div class="flex gap-0.5"><!--[-->`);
			const each_array_2 = ensure_array_like(node.features);
			for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
				let feat = each_array_2[$$index_1];
				$$renderer.push(`<div class="feature-cell flex h-5 w-11 items-center justify-center rounded text-[8px] font-medium"${attr_style(`background-color: ${stringify(featureColor(feat))}; color: ${feat > .5 ? "white" : "#374151"}`)}>${escape_html(feat.toFixed(2))}</div>`);
			}
			$$renderer.push(`<!--]--></div> <div class="ml-1 h-3 w-3 rounded-full"${attr_style(`background-color: ${stringify(graph.classColors[node.trueClass])}`)}></div></div>`);
		}
		$$renderer.push(`<!--]--></div> `);
		if (selectedNode < 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<p class="mt-2 text-[8px] text-gray-400">Showing first 6 nodes. Click a node to see its features.</p>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let datasetIndex = 0;
		let graph = DATASETS[0].create();
		computeNormAdjacency(graph);
		initGCN(graph, 8, .05);
		let forwardResult = void 0;
		let selectedNode = -1;
		let highlightLayer = 1;
		let showMessages = false;
		let graphMode = derived(() => "features");
		derived(() => null);
		derived(() => null);
		derived(() => null);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div id="app" class="min-w-[1100px]"><header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur"><div class="flex items-center gap-4 px-6 py-3"><div class="text-lg font-bold text-gray-800"><span class="text-[var(--gcn-primary)]">GCN</span> E<span class="text-sm">XPLORER</span> <span class="ml-2 text-[10px] font-normal text-gray-400">Graph Convolutional Networks</span></div> <div class="flex items-center gap-2 text-sm"><span class="text-xs font-medium text-gray-500">Dataset:</span> <select class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"><!--[-->`);
			const each_array = ensure_array_like(DATASETS);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let ds = each_array[i];
				$$renderer.option({
					value: i,
					selected: i === datasetIndex
				}, ($$renderer) => {
					$$renderer.push(`${escape_html(ds.name)}`);
				});
			}
			$$renderer.push(`<!--]--></select></div> <div class="flex items-center gap-1 rounded-lg bg-gray-100 p-1"><button${attr_class("rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors", void 0, {
				"bg-white": true,
				"shadow-sm": true,
				"text-indigo-700": true,
				"text-gray-500": false
			})}>① Explore</button> <button${attr_class("rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors", void 0, {
				"bg-white": false,
				"shadow-sm": false,
				"text-indigo-700": false,
				"text-gray-500": true
			})}>② Train</button> <button${attr_class("rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors", void 0, {
				"bg-white": false,
				"shadow-sm": false,
				"text-indigo-700": false,
				"text-gray-500": true
			})}>③ Inference</button></div> <div class="ml-auto flex items-center gap-2">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">↺ Reset</button></div></div></header> <main class="px-6 py-4"><section${attr_class("mb-4 rounded-xl border p-4", void 0, {
				"border-blue-100": true,
				"bg-blue-50": true,
				"border-purple-100": false,
				"bg-purple-50": false,
				"border-emerald-100": false,
				"bg-emerald-50": false
			})}>`);
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-3"><span class="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase text-blue-700">Explore</span> <span class="text-sm text-gray-700">Examine the graph structure, node features, and how message passing aggregates neighborhood information.</span> <button class="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-700">Run Forward Pass →</button></div>`);
			$$renderer.push(`<!--]--></section> <div class="grid grid-cols-[1fr_380px] gap-4"><div class="space-y-4">`);
			GraphView($$renderer, {
				graph,
				forwardResult,
				highlightLayer,
				showMessages,
				mode: graphMode(),
				get selectedNode() {
					return selectedNode;
				},
				set selectedNode($$value) {
					selectedNode = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			FeatureView($$renderer, {
				graph,
				selectedNode
			});
			$$renderer.push(`<!----> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="space-y-4">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 class="mb-2 text-sm font-bold text-blue-800">What is a GCN?</h3> <p class="text-xs leading-relaxed text-blue-700">A <strong>Graph Convolutional Network</strong> learns node representations by
              iteratively aggregating features from each node's neighborhood.</p> <div class="mt-3 space-y-2 text-[10px] text-blue-600"><div class="flex items-start gap-2"><span class="font-bold text-blue-800">1.</span> <span>Each node starts with an input feature vector (H⁰)</span></div> <div class="flex items-start gap-2"><span class="font-bold text-blue-800">2.</span> <span>In each layer, nodes collect ("aggregate") their neighbors' features</span></div> <div class="flex items-start gap-2"><span class="font-bold text-blue-800">3.</span> <span>Aggregated features are transformed via learned weight matrices</span></div> <div class="flex items-start gap-2"><span class="font-bold text-blue-800">4.</span> <span>After L layers, each node's representation encodes its L-hop neighborhood</span></div></div> <div class="mono mt-4 rounded bg-white/60 p-2 text-[10px] text-blue-800">H<sup>(l+1)</sup> = σ( D̃<sup>-½</sup> Ã D̃<sup>-½</sup> H<sup>(l)</sup> W<sup>(l)</sup> )</div></div> <div class="rounded-lg border border-gray-200 bg-white p-4"><h3 class="mb-2 text-xs font-bold text-gray-700">Graph Statistics</h3> <div class="grid grid-cols-2 gap-2 text-[10px]"><div class="rounded bg-gray-50 p-2"><span class="text-gray-500">Nodes:</span> <span class="mono ml-1 font-bold">${escape_html(graph.nodes.length)}</span></div> <div class="rounded bg-gray-50 p-2"><span class="text-gray-500">Edges:</span> <span class="mono ml-1 font-bold">${escape_html(graph.edges.length)}</span></div> <div class="rounded bg-gray-50 p-2"><span class="text-gray-500">Classes:</span> <span class="mono ml-1 font-bold">${escape_html(graph.numClasses)}</span></div> <div class="rounded bg-gray-50 p-2"><span class="text-gray-500">Labeled:</span> <span class="mono ml-1 font-bold">${escape_html(graph.nodes.filter((n) => n.isLabeled).length)}/${escape_html(graph.nodes.length)}</span></div> <div class="rounded bg-gray-50 p-2"><span class="text-gray-500">Features:</span> <span class="mono ml-1 font-bold">${escape_html(graph.nodes[0].features.length)}D</span></div> <div class="rounded bg-gray-50 p-2"><span class="text-gray-500">Hidden dim:</span> <span class="mono ml-1 font-bold">8</span></div></div></div>`);
			$$renderer.push(`<!--]--> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div> <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6"><h2 class="mb-4 text-lg font-bold text-gray-800">How GCNs Work</h2> <div class="grid grid-cols-3 gap-6 text-sm text-gray-600"><div><h3 class="mb-2 font-semibold text-blue-700">① Message Passing</h3> <p class="text-xs leading-relaxed">Each node collects features from its neighbors. In a GCN, messages are scaled by <strong>1/√(deg(i)·deg(j))</strong> — the symmetric normalization.
            This prevents high-degree nodes from dominating.</p> <div class="mt-2 rounded bg-blue-50 p-2 text-[10px]"><strong>Key insight:</strong> After L layers of message passing, each node's
            representation captures information from its L-hop neighborhood. The network
            effectively "smooths" features over the graph.</div></div> <div><h3 class="mb-2 font-semibold text-purple-700">② Training (Node Classification)</h3> <p class="text-xs leading-relaxed">We have labels for a <strong>subset</strong> of nodes. Cross-entropy loss is computed
            only on labeled nodes, but gradients flow through the entire graph during backprop
            — unlabeled nodes still get useful representations!</p> <div class="mt-2 rounded bg-purple-50 p-2 text-[10px]"><strong>Key insight:</strong> This is <em>semi-supervised learning</em>. The graph
            structure acts as an inductive bias, encouraging connected nodes to share
            similar representations (homophily assumption).</div></div> <div><h3 class="mb-2 font-semibold text-emerald-700">③ Inference</h3> <p class="text-xs leading-relaxed">At inference time, the trained model runs a forward pass over all nodes.
            Unlabeled nodes get classified based on their <strong>features + neighborhood
            context</strong>. No retraining needed.</p> <div class="mt-2 rounded bg-emerald-50 p-2 text-[10px]"><strong>Key insight:</strong> Even if a node's own features are ambiguous,
            the GCN can correctly classify it by leveraging its neighbors' information.
            This is the power of graph-based learning.</div></div></div> <div class="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4"><h3 class="mb-2 text-sm font-bold text-indigo-800">The GCN Formula</h3> <div class="mono text-sm text-indigo-700">H<sup>(l+1)</sup> = σ( D̃<sup>-½</sup> Ã D̃<sup>-½</sup> H<sup>(l)</sup> W<sup>(l)</sup> )</div> <div class="mt-2 grid grid-cols-2 gap-2 text-[10px] text-indigo-600"><div><strong>Ã = A + I</strong> — adjacency matrix with self-loops</div> <div><strong>D̃</strong> — degree matrix of Ã</div> <div><strong>H<sup>(l)</sup></strong> — node features at layer l</div> <div><strong>W<sup>(l)</sup></strong> — learnable weight matrix</div> <div><strong>σ</strong> — ReLU (hidden) or Softmax (output)</div> <div><strong>D̃<sup>-½</sup> Ã D̃<sup>-½</sup></strong> — symmetric normalization</div></div> <p class="mt-3 text-xs leading-relaxed text-indigo-600">The normalization ensures that aggregating over neighbors gives a <em>weighted average</em> rather than a sum that scales with node degree. This is what makes GCNs work on graphs
          with varying connectivity — the same architecture handles both hub nodes and leaf nodes gracefully.</p></div> <div class="mt-4 rounded border border-gray-100 bg-gray-50 p-3 text-[10px] text-gray-500"><strong>Reference:</strong> Kipf &amp; Welling, "Semi-Supervised Classification with Graph Convolutional Networks" (ICLR 2017).
        Visualization inspired by <a href="https://distill.pub/2021/gnn-intro/" class="text-indigo-600 underline" target="_blank">Distill: A Gentle Introduction to Graph Neural Networks</a>.</div></section></main></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
export { _page as default };
