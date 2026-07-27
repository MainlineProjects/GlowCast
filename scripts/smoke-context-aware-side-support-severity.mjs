import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function trimConfidence(samples) {
  const sorted = [...samples].sort((a, b) => a.residual - b.residual);
  const worst = sorted[sorted.length - 1];
  const distanceTrimConfidence = samples.length >= 4
    ? Math.max(0, Math.min(1, (worst.distance - 2) / 3))
    : 0;
  const context = sorted.filter((sample) => sample !== worst);
  const contextMeanResidual = context.reduce((sum, sample) => sum + sample.residual, 0)
    / Math.max(context.length, 1);
  const contextCoherence = 1 - Math.min(1, contextMeanResidual / residualLimit);
  const severityRatio = Math.max(0, Math.min(1, worst.residual / residualLimit));
  const contextSeverityWeight = 0.25 + 0.75 * contextCoherence;
  return distanceTrimConfidence * (1 - 0.8 * severityRatio * contextSeverityWeight);
}

function quality(samples) {
  if (!samples.length) return 1;
  const sorted = [...samples].sort((a, b) => a.residual - b.residual);
  const worst = sorted[sorted.length - 1];
  const trim = trimConfidence(samples);
  const residualSum = sorted.reduce((sum, sample) =>
    sum + sample.residual * (sample === worst ? 1 - trim : 1), 0);
  const residualWeight = sorted.reduce((sum, sample) =>
    sum + (sample === worst ? 1 - trim : 1), 0);
  const mean = residualSum / Math.max(residualWeight, 1e-9);
  return 1 - 0.55 * Math.min(1, mean / residualLimit);
}

const severeFar = Math.log(1.095);
const coherentContext = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.012 },
  { distance: 4, residual: 0.013 },
  { distance: 5, residual: severeFar },
];
const noisyContext = [
  { distance: 1, residual: 0.040 },
  { distance: 2, residual: 0.045 },
  { distance: 3, residual: 0.050 },
  { distance: 4, residual: 0.042 },
  { distance: 5, residual: severeFar },
];

assert.ok(trimConfidence(coherentContext) < trimConfidence(noisyContext) - 0.15,
  "an isolated severe residual in coherent support must retain more influence than the same residual inside noisy support");
assert.ok(trimConfidence(coherentContext) < 0.35,
  "clean surrounding geometry must strongly limit trimming of a severe structural-break candidate");
assert.ok(trimConfidence(noisyContext) > 0.45,
  "already-noisy context should reduce the standalone authority of one severe residual");

const mildFar = coherentContext.map((sample) => ({ ...sample }));
mildFar[mildFar.length - 1].residual = Math.log(1.035);
assert.ok(trimConfidence(mildFar) > trimConfidence(coherentContext) + 0.25,
  "mild distant noise must remain substantially safer to trim than a severe isolated break");
assert.ok(quality(coherentContext) < quality(mildFar) - 0.05,
  "severe isolated structural evidence must materially reduce side-support quality versus mild distant noise");

const shortSupport = coherentContext.slice(0, 3).map((sample) => ({ ...sample }));
shortSupport[2].residual = severeFar;
assert.equal(trimConfidence(shortSupport), 0,
  "short support must never gain context-based trim confidence");

console.log("context-aware side-support severity smoke passed");
