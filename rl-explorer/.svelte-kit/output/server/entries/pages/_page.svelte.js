import "../../chunks/index-server.js";
import { R as attr, a as ensure_array_like, c as stringify, i as derived, n as attr_class, r as attr_style, z as escape_html } from "../../chunks/dev.js";
import "d3";
//#region src/lib/rlhf.ts
var SCENARIOS = [{
	prompt: "Explain why the sky is blue",
	vocab: [
		"the",
		"sky",
		"is",
		"blue",
		"because",
		"light",
		"scatters",
		"atmosphere",
		"reflects",
		"ocean",
		"sun",
		"wavelengths",
		"short",
		"molecules",
		"air"
	],
	positions: 6,
	rewardFn: (tokens) => {
		let score = 0;
		if (tokens.includes("scatters")) score += .3;
		if (tokens.includes("wavelengths")) score += .25;
		if (tokens.includes("atmosphere")) score += .2;
		if (tokens.includes("molecules")) score += .2;
		if (tokens.includes("light")) score += .15;
		if (tokens.includes("short")) score += .15;
		if (tokens.includes("reflects") && tokens.includes("ocean")) score -= .3;
		if (new Set(tokens).size < tokens.length * .7) score -= .2;
		return Math.max(0, Math.min(1, .3 + score));
	},
	initialDistributions: [
		{
			"the": .15,
			"light": .12,
			"because": .12,
			"sky": .1,
			"blue": .08,
			"is": .08,
			"scatters": .06,
			"atmosphere": .05,
			"reflects": .05,
			"ocean": .04,
			"sun": .04,
			"wavelengths": .04,
			"short": .03,
			"molecules": .02,
			"air": .02
		},
		{
			"light": .14,
			"scatters": .1,
			"atmosphere": .09,
			"wavelengths": .08,
			"is": .08,
			"the": .08,
			"reflects": .08,
			"blue": .07,
			"sky": .06,
			"ocean": .06,
			"because": .05,
			"sun": .04,
			"short": .03,
			"molecules": .02,
			"air": .02
		},
		{
			"in": .01,
			"the": .12,
			"atmosphere": .11,
			"scatters": .1,
			"light": .09,
			"blue": .09,
			"wavelengths": .08,
			"sky": .07,
			"molecules": .06,
			"reflects": .06,
			"short": .06,
			"is": .05,
			"ocean": .04,
			"sun": .03,
			"air": .03
		},
		{
			"the": .13,
			"blue": .11,
			"short": .1,
			"light": .1,
			"wavelengths": .09,
			"scatters": .08,
			"atmosphere": .07,
			"molecules": .07,
			"sky": .06,
			"is": .06,
			"reflects": .05,
			"sun": .04,
			"ocean": .02,
			"air": .02,
			"because": 0
		},
		{
			"light": .13,
			"molecules": .1,
			"wavelengths": .1,
			"the": .09,
			"atmosphere": .09,
			"scatters": .08,
			"blue": .08,
			"short": .07,
			"air": .07,
			"sky": .06,
			"is": .05,
			"reflects": .04,
			"sun": .02,
			"ocean": .01,
			"because": .01
		},
		{
			"blue": .12,
			"light": .11,
			"the": .1,
			"atmosphere": .09,
			"scatters": .09,
			"wavelengths": .08,
			"sky": .07,
			"molecules": .07,
			"short": .07,
			"air": .06,
			"is": .05,
			"sun": .04,
			"reflects": .03,
			"ocean": .01,
			"because": .01
		}
	]
}, {
	prompt: "What is machine learning?",
	vocab: [
		"machines",
		"learn",
		"from",
		"data",
		"patterns",
		"algorithms",
		"find",
		"predict",
		"train",
		"models",
		"statistics",
		"magic",
		"computers",
		"neural",
		"optimize"
	],
	positions: 6,
	rewardFn: (tokens) => {
		let score = 0;
		if (tokens.includes("learn")) score += .2;
		if (tokens.includes("data")) score += .25;
		if (tokens.includes("patterns")) score += .25;
		if (tokens.includes("algorithms")) score += .15;
		if (tokens.includes("predict")) score += .15;
		if (tokens.includes("train")) score += .1;
		if (tokens.includes("models")) score += .1;
		if (tokens.includes("magic")) score -= .4;
		if (new Set(tokens).size < tokens.length * .7) score -= .2;
		return Math.max(0, Math.min(1, .25 + score));
	},
	initialDistributions: [
		{
			"machines": .12,
			"algorithms": .11,
			"computers": .1,
			"models": .09,
			"data": .08,
			"learn": .08,
			"patterns": .07,
			"find": .07,
			"predict": .06,
			"train": .06,
			"from": .05,
			"statistics": .04,
			"magic": .03,
			"neural": .02,
			"optimize": .02
		},
		{
			"learn": .14,
			"find": .11,
			"from": .1,
			"predict": .09,
			"train": .08,
			"data": .08,
			"patterns": .08,
			"algorithms": .07,
			"models": .06,
			"machines": .05,
			"optimize": .05,
			"computers": .04,
			"statistics": .03,
			"neural": .01,
			"magic": .01
		},
		{
			"data": .14,
			"patterns": .12,
			"from": .1,
			"models": .09,
			"algorithms": .08,
			"learn": .08,
			"predict": .07,
			"train": .07,
			"find": .06,
			"machines": .05,
			"statistics": .05,
			"optimize": .04,
			"computers": .03,
			"neural": .01,
			"magic": .01
		},
		{
			"patterns": .13,
			"data": .12,
			"models": .1,
			"predict": .09,
			"from": .08,
			"algorithms": .08,
			"learn": .08,
			"find": .07,
			"train": .06,
			"optimize": .06,
			"machines": .05,
			"statistics": .04,
			"neural": .02,
			"computers": .01,
			"magic": .01
		},
		{
			"predict": .12,
			"data": .11,
			"patterns": .11,
			"train": .1,
			"models": .09,
			"algorithms": .08,
			"learn": .07,
			"from": .07,
			"find": .06,
			"optimize": .06,
			"machines": .05,
			"statistics": .04,
			"computers": .02,
			"neural": .01,
			"magic": .01
		},
		{
			"data": .12,
			"patterns": .11,
			"models": .1,
			"optimize": .09,
			"train": .09,
			"predict": .08,
			"algorithms": .08,
			"learn": .07,
			"from": .07,
			"find": .06,
			"machines": .05,
			"statistics": .04,
			"neural": .02,
			"computers": .01,
			"magic": .01
		}
	]
}];
/** Normalize a distribution so it sums to 1 */
function normalize(dist) {
	const sum = Object.values(dist).reduce((a, b) => a + b, 0);
	if (sum === 0) return dist;
	const result = {};
	for (const [k, v] of Object.entries(dist)) result[k] = v / sum;
	return result;
}
/** Deep clone a policy */
function clonePolicy(policy) {
	return { distributions: policy.distributions.map((d) => ({ ...d })) };
}
var DEFAULT_PPO_CONFIG = {
	learningRate: .08,
	clipEpsilon: .2,
	klPenalty: .1,
	entropyBonus: .01
};
var DEFAULT_DPO_CONFIG = {
	learningRate: .06,
	beta: .1
};
var DEFAULT_GRPO_CONFIG = {
	learningRate: .07,
	klPenalty: .08,
	groupSize: 6
};
function createSimulation(scenarioIndex = 0) {
	const scenario = SCENARIOS[scenarioIndex];
	const referencePolicy = { distributions: scenario.initialDistributions.map((d) => normalize(d)).map((d) => ({ ...d })) };
	return {
		prompt: scenario.prompt,
		vocab: scenario.vocab,
		referencePolicy,
		currentPolicies: {
			PPO: clonePolicy(referencePolicy),
			DPO: clonePolicy(referencePolicy),
			GRPO: clonePolicy(referencePolicy)
		},
		history: {
			PPO: [],
			DPO: [],
			GRPO: []
		},
		stepCount: 0
	};
}
//#endregion
//#region src/lib/components/TokenDistChart.svelte
function TokenDistChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { oldDist, newDist, label = "Token Distribution", color = "#6366F1", maxTokens = 8 } = $$props;
		const margin = {
			top: 8,
			right: 12,
			bottom: 4,
			left: 75
		};
		const width = 320;
		const barHeight = 22;
		derived(() => maxTokens * barHeight + margin.top + margin.bottom + 10);
		width - margin.left - margin.right;
		$$renderer.push(`<div class="rounded-lg border border-gray-100 bg-white p-3"><div class="mb-1 text-xs font-semibold text-gray-500">${escape_html(label)}</div> <div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/KLGauge.svelte
function KLGauge($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { klValue, maxKL = 2, label = "KL Divergence from Reference" } = $$props;
		$$renderer.push(`<div class="rounded-lg border border-gray-100 bg-white p-3"><div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">${escape_html(label)}</div> <div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/TimelineChart.svelte
function TimelineChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { history, color = "#6366F1", algorithm = "PPO" } = $$props;
		const margin = {
			top: 16,
			right: 16,
			bottom: 24,
			left: 40
		};
		const width = 340;
		const height = 140;
		width - margin.left - margin.right;
		height - margin.top - margin.bottom;
		$$renderer.push(`<div class="rounded-lg border border-gray-100 bg-white p-3"><div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">${escape_html(algorithm)} Training Progress</div> <div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/GRPOGroupView.svelte
function GRPOGroupView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { rollouts, groupAdvantages } = $$props;
		function barWidth(reward) {
			return `${Math.max(reward * 100, 2)}%`;
		}
		function advantageColor(adv) {
			if (adv > .3) return "#10B981";
			if (adv > 0) return "#6ee7b7";
			if (adv > -.3) return "#fca5a5";
			return "#EF4444";
		}
		function advantageBg(adv) {
			if (adv > 0) return "rgba(16, 185, 129, 0.08)";
			return "rgba(239, 68, 68, 0.08)";
		}
		$$renderer.push(`<div class="space-y-1"><div class="mb-2 grid grid-cols-[1fr_60px_80px_60px] gap-1 text-[9px] font-semibold uppercase text-gray-400"><span>Sample</span> <span class="text-center">Reward</span> <span class="text-center">Relative Adv.</span> <span class="text-center">Signal</span></div> <!--[-->`);
		const each_array = ensure_array_like(rollouts);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let rollout = each_array[i];
			const adv = groupAdvantages[i] ?? 0;
			$$renderer.push(`<div class="grid grid-cols-[1fr_60px_80px_60px] items-center gap-1 rounded-md p-1.5 transition-colors"${attr_style(`background: ${stringify(advantageBg(adv))}`)}><div class="mono flex flex-wrap gap-0.5 text-[10px]"><!--[-->`);
			const each_array_1 = ensure_array_like(rollout.tokens);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let token = each_array_1[$$index];
				$$renderer.push(`<span class="rounded bg-white/60 px-1 py-0.5">${escape_html(token)}</span>`);
			}
			$$renderer.push(`<!--]--></div> <div class="flex items-center gap-1"><div class="h-3 w-full rounded-full bg-gray-100"><div class="h-3 rounded-full transition-all"${attr_style(`width: ${stringify(barWidth(rollout.reward))}; background-color: ${stringify(advantageColor(adv))}`)}></div></div></div> <div class="mono text-center text-[10px] font-semibold"${attr_style(`color: ${stringify(advantageColor(adv))}`)}>${escape_html(adv > 0 ? "+" : "")}${escape_html(adv.toFixed(2))}</div> <div class="text-center text-sm">`);
			if (adv > .3) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="text-green-500">⬆⬆</span>`);
			} else if (adv > 0) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<span class="text-green-400">⬆</span>`);
			} else if (adv > -.3) {
				$$renderer.push("<!--[2-->");
				$$renderer.push(`<span class="text-red-400">⬇</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="text-red-500">⬇⬇</span>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--> <div class="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-[9px] text-gray-500"><span>Mean reward: <strong class="mono">${escape_html((rollouts.reduce((s, r) => s + r.reward, 0) / rollouts.length).toFixed(3))}</strong></span> <span>Above avg: <strong class="text-green-600">${escape_html(groupAdvantages.filter((a) => a > 0).length)}</strong> / ${escape_html(rollouts.length)}</span></div></div>`);
	});
}
//#endregion
//#region src/lib/components/PPOSignalView.svelte
function PPOSignalView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { rollouts, ppoConfig } = $$props;
		let avgReward = derived(() => rollouts.reduce((s, r) => s + r.reward, 0) / rollouts.length);
		function isClipped(rollout) {
			const advantage = rollout.reward - avgReward();
			return Math.abs(advantage) > ppoConfig.clipEpsilon * 2;
		}
		$$renderer.push(`<div class="space-y-3"><div class="rounded-lg border border-amber-100 bg-amber-50/50 p-3"><div class="mb-2 text-[10px] font-semibold uppercase text-amber-700">Optimization Forces</div> <div class="space-y-2"><div class="flex items-center gap-2"><span class="w-20 text-[10px] text-gray-600">Reward →</span> <div class="relative h-4 flex-1 rounded bg-gray-100"><div class="absolute left-0 top-0 h-4 rounded bg-green-400 transition-all"${attr_style(`width: ${stringify(Math.min(avgReward() * 100, 100))}%`)}></div></div> <span class="mono w-10 text-right text-[10px] text-green-700">+${escape_html(avgReward().toFixed(2))}</span></div> <div class="flex items-center gap-2"><span class="w-20 text-[10px] text-gray-600">← KL pen.</span> <div class="relative h-4 flex-1 rounded bg-gray-100"><div class="absolute right-0 top-0 h-4 rounded bg-red-400 transition-all"${attr_style(`width: ${stringify(Math.min(ppoConfig.klPenalty * 200, 100))}%`)}></div></div> <span class="mono w-10 text-right text-[10px] text-red-700">-${escape_html(ppoConfig.klPenalty.toFixed(2))}</span></div> <div class="flex items-center gap-2"><span class="w-20 text-[10px] text-gray-600">Entropy →</span> <div class="relative h-4 flex-1 rounded bg-gray-100"><div class="absolute left-0 top-0 h-4 rounded bg-blue-300 transition-all"${attr_style(`width: ${stringify(Math.min(ppoConfig.entropyBonus * 500, 100))}%`)}></div></div> <span class="mono w-10 text-right text-[10px] text-blue-600">+${escape_html(ppoConfig.entropyBonus.toFixed(3))}</span></div></div></div> <div><div class="mb-1.5 text-[10px] font-semibold uppercase text-gray-500">Clipping (ε = ${escape_html(ppoConfig.clipEpsilon)})</div> <div class="space-y-1"><!--[-->`);
		const each_array = ensure_array_like(rollouts);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let rollout = each_array[i];
			const advantage = rollout.reward - avgReward();
			const clipped = isClipped(rollout);
			$$renderer.push(`<div class="flex items-center gap-2 text-[10px]"><span class="mono w-4 text-gray-400">#${escape_html(i + 1)}</span> <div class="relative h-3 flex-1 rounded bg-gray-100"><div class="absolute top-0 h-3 border-l border-r border-dashed border-gray-400"${attr_style(`left: ${stringify((.5 - ppoConfig.clipEpsilon) * 100)}%; right: ${stringify((.5 - ppoConfig.clipEpsilon) * 100)}%`)}></div> <div${attr_class("absolute top-0 h-3 w-1.5 rounded transition-all", void 0, {
				"bg-green-500": !clipped && advantage > 0,
				"bg-red-400": !clipped && advantage < 0,
				"bg-red-600": clipped
			})}${attr_style(`left: ${stringify(Math.max(0, Math.min(95, (advantage + 1) * 50)))}%`)}></div></div> `);
			if (clipped) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="rounded bg-red-100 px-1 py-0.5 text-[8px] font-bold text-red-600">CLIPPED</span>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="rounded bg-green-100 px-1 py-0.5 text-[8px] text-green-600">OK</span>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}
//#endregion
//#region src/lib/components/DPOSignalView.svelte
function DPOSignalView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { chosen, rejected } = $$props;
		$$renderer.push(`<div class="space-y-3"><div class="rounded-lg border border-emerald-100 bg-gradient-to-r from-green-50 via-white to-red-50 p-4"><div class="mb-2 text-center text-[10px] font-semibold uppercase text-gray-500">Preference Signal</div> <div class="mb-3"><div class="mb-1 flex items-center gap-2"><span class="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">↑ CHOSEN</span> <span class="mono text-[10px] text-green-600">r=${escape_html(chosen.reward.toFixed(3))}</span></div> <div class="mono flex flex-wrap gap-0.5 rounded-md border border-green-200 bg-green-50/50 p-2 text-[11px]"><!--[-->`);
		const each_array = ensure_array_like(chosen.tokens);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let token = each_array[$$index];
			$$renderer.push(`<span class="rounded bg-green-100/60 px-1.5 py-0.5">${escape_html(token)}</span>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="relative my-2 flex items-center justify-center"><div class="absolute inset-x-0 top-1/2 h-px bg-gray-200"></div> <span class="relative z-10 rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-gray-400 shadow-sm">vs</span></div> <div><div class="mb-1 flex items-center gap-2"><span class="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">↓ REJECTED</span> <span class="mono text-[10px] text-red-600">r=${escape_html(rejected.reward.toFixed(3))}</span></div> <div class="mono flex flex-wrap gap-0.5 rounded-md border border-red-200 bg-red-50/50 p-2 text-[11px]"><!--[-->`);
		const each_array_1 = ensure_array_like(rejected.tokens);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let token = each_array_1[$$index_1];
			$$renderer.push(`<span class="rounded bg-red-100/60 px-1.5 py-0.5">${escape_html(token)}</span>`);
		}
		$$renderer.push(`<!--]--></div></div></div> <div class="rounded border border-gray-100 bg-gray-50 p-2 text-[10px] text-gray-600"><strong>DPO mechanism:</strong> Increases probability of chosen tokens while decreasing rejected tokens.
    No explicit reward model — learns directly from preference pairs.</div> <div class="flex items-center justify-between text-[10px]"><span class="text-gray-500">Reward gap:</span> <span class="mono font-semibold text-indigo-600">Δ = ${escape_html((chosen.reward - rejected.reward).toFixed(3))}</span></div></div>`);
	});
}
//#endregion
//#region src/lib/components/StepHistory.svelte
function StepHistory($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { history, algorithm, color = "#6366F1" } = $$props;
		$$renderer.push(`<div class="rounded-lg border border-gray-100 bg-white"><button class="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"><span class="text-[10px] font-semibold uppercase tracking-wide text-gray-500">${escape_html(algorithm)} Step History (${escape_html(history.length)} steps)</span> <span class="text-xs text-gray-400">${escape_html("▶")}</span></button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/components/EntropyView.svelte
function EntropyView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { policy, positions = 6, vocab } = $$props;
		const width = 320;
		const height = 100;
		const margin = {
			top: 12,
			right: 12,
			bottom: 20,
			left: 12
		};
		width - margin.left - margin.right;
		height - margin.top - margin.bottom;
		$$renderer.push(`<div class="rounded-lg border border-gray-100 bg-white p-3"><div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Entropy / Exploration per Position</div> <div></div></div>`);
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let scenarioIndex = 0;
		let sim = createSimulation(0);
		let numRollouts = 6;
		let autoTraining = false;
		let speed = 1e3;
		let selectedPosition = 0;
		let ppoConfig = { ...DEFAULT_PPO_CONFIG };
		let dpoConfig = { ...DEFAULT_DPO_CONFIG };
		let grpoConfig = { ...DEFAULT_GRPO_CONFIG };
		let scenario = derived(() => SCENARIOS[scenarioIndex]);
		let latestPPO = derived(() => sim.history.PPO[sim.history.PPO.length - 1] ?? null);
		let latestDPO = derived(() => sim.history.DPO[sim.history.DPO.length - 1] ?? null);
		let latestGRPO = derived(() => sim.history.GRPO[sim.history.GRPO.length - 1] ?? null);
		let ppoKL = derived(() => latestPPO()?.klDivergence ?? 0);
		let dpoKL = derived(() => latestDPO()?.klDivergence ?? 0);
		let grpoKL = derived(() => latestGRPO()?.klDivergence ?? 0);
		$$renderer.push(`<div id="app" class="min-w-[1200px]"><header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur"><div class="flex items-center gap-6 px-6 py-3"><div class="text-lg font-bold text-gray-800"><span class="text-[var(--rl-primary)]">RL</span> E<span class="text-sm">XPLORER</span> <span class="ml-2 text-[10px] font-normal text-gray-400">PPO · DPO · GRPO</span></div> <div class="flex items-center gap-2 text-sm"><span class="text-xs font-medium text-gray-500">Prompt:</span> <select class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"><!--[-->`);
		const each_array = ensure_array_like(SCENARIOS);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let s = each_array[i];
			$$renderer.option({
				value: i,
				selected: i === scenarioIndex
			}, ($$renderer) => {
				$$renderer.push(`"${escape_html(s.prompt)}"`);
			});
		}
		$$renderer.push(`<!--]--></select></div> <div class="flex items-center gap-3"><label class="flex items-center gap-1.5 text-xs"><span class="text-gray-500">Rollouts:</span> <input type="range" min="3" max="10"${attr("value", numRollouts)} class="w-16"/> <span class="mono w-3 font-medium">${escape_html(numRollouts)}</span></label> <label class="flex items-center gap-1.5 text-xs"><span class="text-gray-500">Speed:</span> <input type="range" min="200" max="3000" step="100"${attr("value", speed)} class="w-16"/> <span class="mono w-8 text-[10px]">${escape_html(speed)}ms</span></label></div> <div class="ml-auto flex items-center gap-2"><span class="mono rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Step ${escape_html(sim.stepCount)}</span> <button class="step-btn rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">⏩ Apply One Update</button> <button${attr_class("rounded-lg px-3 py-2 text-xs font-medium transition-colors", void 0, {
			"bg-red-100": autoTraining,
			"text-red-700": autoTraining,
			"bg-gray-100": true,
			"text-gray-700": true
		})}>${escape_html("▶ Auto")}</button> <button class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">↺ Reset</button></div></div></header> <main class="px-6 py-4"><section class="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"><div class="flex items-center gap-3"><span class="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase text-indigo-700">Prompt</span> <span class="text-base font-medium text-gray-800">"${escape_html(scenario().prompt)}"</span> <span class="ml-auto text-[10px] text-gray-400">Vocab: ${escape_html(scenario().vocab.length)} tokens · ${escape_html(scenario().positions)} positions</span></div></section> <div class="grid grid-cols-3 gap-4"><div class="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/20 p-3"><div class="flex items-center gap-2 border-b border-amber-100 pb-2"><div class="h-3 w-3 rounded-full bg-amber-500"></div> <h2 class="text-sm font-bold text-amber-800">PPO</h2> <span class="text-[9px] text-amber-600">Proximal Policy Optimization</span></div> `);
		if (latestPPO()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div><button class="mb-1 flex w-full items-center justify-between text-left"><span class="text-[10px] font-semibold uppercase text-gray-500">Rollouts</span> <span class="text-[10px] text-gray-400">${escape_html("▶")}</span></button> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="mono rounded-md bg-white/60 p-2 text-[10px] text-gray-600">${escape_html(latestPPO().rollouts.length)} rollouts · avg reward: ${escape_html(latestPPO().avgReward.toFixed(3))} <br/>Best: "${escape_html([...latestPPO().rollouts].sort((a, b) => b.reward - a.reward)[0]?.tokens.join(" "))}"</div>`);
			$$renderer.push(`<!--]--></div> `);
			PPOSignalView($$renderer, {
				rollouts: latestPPO().rollouts,
				ppoConfig
			});
			$$renderer.push(`<!----> <div><div class="mb-1 flex items-center gap-2"><span class="text-[10px] font-semibold uppercase text-gray-500">Distribution (pos ${escape_html(1)})</span> <div class="flex gap-0.5"><!--[-->`);
			const each_array_1 = ensure_array_like(Array(scenario().positions));
			for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
				each_array_1[i];
				$$renderer.push(`<button${attr_class("h-4 w-4 rounded text-[8px] transition-colors", void 0, {
					"bg-amber-500": selectedPosition === i,
					"text-white": selectedPosition === i,
					"bg-gray-100": selectedPosition !== i
				})}>${escape_html(i + 1)}</button>`);
			}
			$$renderer.push(`<!--]--></div></div> `);
			TokenDistChart($$renderer, {
				oldDist: latestPPO().oldPolicy.distributions[selectedPosition],
				newDist: latestPPO().newPolicy.distributions[selectedPosition],
				label: "Before → After",
				color: "#F59E0B"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="py-8 text-center text-xs text-gray-400">Click "Apply One Update" to start training</div>`);
		}
		$$renderer.push(`<!--]--> `);
		KLGauge($$renderer, {
			klValue: ppoKL(),
			label: "KL from Reference"
		});
		$$renderer.push(`<!----> `);
		if (latestPPO()) {
			$$renderer.push("<!--[0-->");
			EntropyView($$renderer, {
				policy: latestPPO().newPolicy,
				vocab: scenario().vocab,
				positions: scenario().positions
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		TimelineChart($$renderer, {
			history: sim.history.PPO,
			color: "#F59E0B",
			algorithm: "PPO"
		});
		$$renderer.push(`<!----> `);
		StepHistory($$renderer, {
			history: sim.history.PPO,
			algorithm: "PPO",
			color: "#F59E0B"
		});
		$$renderer.push(`<!----></div> <div class="space-y-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/20 p-3"><div class="flex items-center gap-2 border-b border-emerald-100 pb-2"><div class="h-3 w-3 rounded-full bg-emerald-500"></div> <h2 class="text-sm font-bold text-emerald-800">DPO</h2> <span class="text-[9px] text-emerald-600">Direct Preference Optimization</span></div> `);
		if (latestDPO()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div><button class="mb-1 flex w-full items-center justify-between text-left"><span class="text-[10px] font-semibold uppercase text-gray-500">Rollouts</span> <span class="text-[10px] text-gray-400">${escape_html("▶")}</span></button> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="mono rounded-md bg-white/60 p-2 text-[10px] text-gray-600">${escape_html(latestDPO().rollouts.length)} rollouts · avg reward: ${escape_html(latestDPO().avgReward.toFixed(3))} <br/>Best: "${escape_html([...latestDPO().rollouts].sort((a, b) => b.reward - a.reward)[0]?.tokens.join(" "))}"</div>`);
			$$renderer.push(`<!--]--></div> `);
			if (latestDPO().chosen && latestDPO().rejected) {
				$$renderer.push("<!--[0-->");
				DPOSignalView($$renderer, {
					chosen: latestDPO().chosen,
					rejected: latestDPO().rejected
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div><div class="mb-1 flex items-center gap-2"><span class="text-[10px] font-semibold uppercase text-gray-500">Distribution (pos ${escape_html(1)})</span></div> `);
			TokenDistChart($$renderer, {
				oldDist: latestDPO().oldPolicy.distributions[selectedPosition],
				newDist: latestDPO().newPolicy.distributions[selectedPosition],
				label: "Before → After",
				color: "#10B981"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="py-8 text-center text-xs text-gray-400">Click "Apply One Update" to start training</div>`);
		}
		$$renderer.push(`<!--]--> `);
		KLGauge($$renderer, {
			klValue: dpoKL(),
			label: "KL from Reference"
		});
		$$renderer.push(`<!----> `);
		if (latestDPO()) {
			$$renderer.push("<!--[0-->");
			EntropyView($$renderer, {
				policy: latestDPO().newPolicy,
				vocab: scenario().vocab,
				positions: scenario().positions
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		TimelineChart($$renderer, {
			history: sim.history.DPO,
			color: "#10B981",
			algorithm: "DPO"
		});
		$$renderer.push(`<!----> `);
		StepHistory($$renderer, {
			history: sim.history.DPO,
			algorithm: "DPO",
			color: "#10B981"
		});
		$$renderer.push(`<!----></div> <div class="space-y-3 rounded-xl border-2 border-violet-200 bg-violet-50/20 p-3"><div class="flex items-center gap-2 border-b border-violet-100 pb-2"><div class="h-3 w-3 rounded-full bg-violet-500"></div> <h2 class="text-sm font-bold text-violet-800">GRPO</h2> <span class="text-[9px] text-violet-600">Group Relative Policy Optimization</span></div> `);
		if (latestGRPO()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div><button class="mb-1 flex w-full items-center justify-between text-left"><span class="text-[10px] font-semibold uppercase text-gray-500">Group Rollouts</span> <span class="text-[10px] text-gray-400">${escape_html("▶")}</span></button> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="mono rounded-md bg-white/60 p-2 text-[10px] text-gray-600">${escape_html(latestGRPO().rollouts.length)} samples · avg reward: ${escape_html(latestGRPO().avgReward.toFixed(3))}</div>`);
			$$renderer.push(`<!--]--></div> `);
			if (latestGRPO().groupAdvantages) {
				$$renderer.push("<!--[0-->");
				GRPOGroupView($$renderer, {
					rollouts: latestGRPO().rollouts,
					groupAdvantages: latestGRPO().groupAdvantages
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div><div class="mb-1 flex items-center gap-2"><span class="text-[10px] font-semibold uppercase text-gray-500">Distribution (pos ${escape_html(1)})</span></div> `);
			TokenDistChart($$renderer, {
				oldDist: latestGRPO().oldPolicy.distributions[selectedPosition],
				newDist: latestGRPO().newPolicy.distributions[selectedPosition],
				label: "Before → After",
				color: "#8B5CF6"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="py-8 text-center text-xs text-gray-400">Click "Apply One Update" to start training</div>`);
		}
		$$renderer.push(`<!--]--> `);
		KLGauge($$renderer, {
			klValue: grpoKL(),
			label: "KL from Reference"
		});
		$$renderer.push(`<!----> `);
		if (latestGRPO()) {
			$$renderer.push("<!--[0-->");
			EntropyView($$renderer, {
				policy: latestGRPO().newPolicy,
				vocab: scenario().vocab,
				positions: scenario().positions
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		TimelineChart($$renderer, {
			history: sim.history.GRPO,
			color: "#8B5CF6",
			algorithm: "GRPO"
		});
		$$renderer.push(`<!----> `);
		StepHistory($$renderer, {
			history: sim.history.GRPO,
			algorithm: "GRPO",
			color: "#8B5CF6"
		});
		$$renderer.push(`<!----></div></div> <section class="mt-6 grid grid-cols-3 gap-4"><div class="rounded-xl border border-gray-200 bg-white p-4"><h3 class="mb-3 text-xs font-bold text-amber-700">PPO Configuration</h3> <div class="space-y-2"><label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Learning Rate</span> <div class="flex items-center gap-1"><input type="range" min="0.01" max="0.2" step="0.01"${attr("value", ppoConfig.learningRate)} class="w-20"/> <span class="mono w-8">${escape_html(ppoConfig.learningRate.toFixed(2))}</span></div></label> <label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Clip Epsilon (ε)</span> <div class="flex items-center gap-1"><input type="range" min="0.05" max="0.5" step="0.05"${attr("value", ppoConfig.clipEpsilon)} class="w-20"/> <span class="mono w-8">${escape_html(ppoConfig.clipEpsilon.toFixed(2))}</span></div></label> <label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">KL Penalty (β)</span> <div class="flex items-center gap-1"><input type="range" min="0" max="0.5" step="0.01"${attr("value", ppoConfig.klPenalty)} class="w-20"/> <span class="mono w-8">${escape_html(ppoConfig.klPenalty.toFixed(2))}</span></div></label> <label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Entropy Bonus</span> <div class="flex items-center gap-1"><input type="range" min="0" max="0.1" step="0.005"${attr("value", ppoConfig.entropyBonus)} class="w-20"/> <span class="mono w-8">${escape_html(ppoConfig.entropyBonus.toFixed(3))}</span></div></label></div></div> <div class="rounded-xl border border-gray-200 bg-white p-4"><h3 class="mb-3 text-xs font-bold text-emerald-700">DPO Configuration</h3> <div class="space-y-2"><label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Learning Rate</span> <div class="flex items-center gap-1"><input type="range" min="0.01" max="0.2" step="0.01"${attr("value", dpoConfig.learningRate)} class="w-20"/> <span class="mono w-8">${escape_html(dpoConfig.learningRate.toFixed(2))}</span></div></label> <label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Beta (β)</span> <div class="flex items-center gap-1"><input type="range" min="0.01" max="0.5" step="0.01"${attr("value", dpoConfig.beta)} class="w-20"/> <span class="mono w-8">${escape_html(dpoConfig.beta.toFixed(2))}</span></div></label></div> <div class="mt-3 rounded border border-emerald-100 bg-emerald-50 p-2 text-[10px] text-emerald-700"><strong>DPO</strong> learns directly from preference pairs without a separate reward model. 
          Higher β = stronger constraint toward the reference policy.</div></div> <div class="rounded-xl border border-gray-200 bg-white p-4"><h3 class="mb-3 text-xs font-bold text-violet-700">GRPO Configuration</h3> <div class="space-y-2"><label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Learning Rate</span> <div class="flex items-center gap-1"><input type="range" min="0.01" max="0.2" step="0.01"${attr("value", grpoConfig.learningRate)} class="w-20"/> <span class="mono w-8">${escape_html(grpoConfig.learningRate.toFixed(2))}</span></div></label> <label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">KL Penalty</span> <div class="flex items-center gap-1"><input type="range" min="0" max="0.5" step="0.01"${attr("value", grpoConfig.klPenalty)} class="w-20"/> <span class="mono w-8">${escape_html(grpoConfig.klPenalty.toFixed(2))}</span></div></label> <label class="flex items-center justify-between text-[11px]"><span class="text-gray-600">Group Size</span> <div class="flex items-center gap-1"><input type="range" min="4" max="12" step="1"${attr("value", grpoConfig.groupSize)} class="w-20"/> <span class="mono w-8">${escape_html(grpoConfig.groupSize)}</span></div></label></div> <div class="mt-3 rounded border border-violet-100 bg-violet-50 p-2 text-[10px] text-violet-700"><strong>GRPO</strong> uses group-relative advantages: no critic network. 
          Samples within a group are ranked against each other.</div></div></section> <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6"><h2 class="mb-4 text-lg font-bold text-gray-800">How This Works</h2> <div class="grid grid-cols-3 gap-6 text-sm text-gray-600"><div><h3 class="mb-2 font-semibold text-amber-700">PPO (Proximal Policy Optimization)</h3> <p class="text-xs leading-relaxed">Generates rollouts, scores them with a reward model, then updates the policy using <strong>clipped surrogate objectives</strong>. The clip prevents catastrophically large updates.
            A KL penalty keeps the policy near the reference. Think: "improve, but cautiously."</p> <div class="mt-2 rounded bg-amber-50 p-2 text-[10px]"><strong>Key insight:</strong> PPO balances reward maximization against stability through 
            clipping and KL penalties — two separate safety mechanisms.</div></div> <div><h3 class="mb-2 font-semibold text-emerald-700">DPO (Direct Preference Optimization)</h3> <p class="text-xs leading-relaxed">Skips the reward model entirely. Instead, it uses <strong>preference pairs</strong> (chosen vs rejected) to directly optimize the policy. The implicit reward is derived 
            from the log-ratio between the policy and reference. Simpler, more stable.</p> <div class="mt-2 rounded bg-emerald-50 p-2 text-[10px]"><strong>Key insight:</strong> DPO proves you can optimize preferences without RL — 
            the reference policy acts as an implicit constraint.</div></div> <div><h3 class="mb-2 font-semibold text-violet-700">GRPO (Group Relative Policy Optimization)</h3> <p class="text-xs leading-relaxed">Samples a <strong>group</strong> of completions, scores them, then computes advantages <em>relative to the group mean</em>. No critic network needed. Better-than-average 
            responses get reinforced; worse ones get suppressed.</p> <div class="mt-2 rounded bg-violet-50 p-2 text-[10px]"><strong>Key insight:</strong> GRPO is self-normalizing — it only cares about 
            relative quality within each batch, making it robust to reward scale.</div></div></div> <div class="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4"><h3 class="mb-2 text-sm font-bold text-indigo-800">The Core Idea</h3> <p class="text-xs leading-relaxed text-indigo-700">All three algorithms do the same fundamental thing: <strong>reshape probability distributions 
          over token sequences</strong>. Each training step moves probability mass toward preferred 
          trajectories and away from unpreferred ones. The differences are in <em>how</em> they 
          determine what's preferred and <em>how aggressively</em> they redistribute that mass.</p> <p class="mt-2 text-xs leading-relaxed text-indigo-600">Watch the token distributions above as you train. Notice how probability concentrates 
          on "good" tokens (like "scatters", "wavelengths") and diminishes on misleading ones 
          (like "reflects", "ocean"). That redistribution <em>is</em> the training.</p></div></section></main></div>`);
	});
}
//#endregion
export { _page as default };
