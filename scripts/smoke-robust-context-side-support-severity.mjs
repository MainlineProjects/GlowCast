import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function trimConfidence(samples) {
  const sorted = [...samples].sort((a, b) => a.residual - b.residual);
  const worst = sorted[sorted.length - 1];
  const distanceTrimConfidence = samples.length >= 4
    ? Math.max(0, Math.min(1, (worst.distance - 2) / 3))
    : 0;
  const context = sorted.filter((sample) => sample !== worst);
  const contextResiduals = context.map((sample) => sample.residual).sort((a, b) => a - b);
  const contextResidualCap = contextResiduals.length >= 4
    ? contextResiduals[contextResiduals.length - 2]
    : Number.POSITIVE_INFINITY;
  const contextMeanResidual = contextResiduals.reduce((sum, residual) =>
    sum + Math.min(residual, contextResidualCap), 0) / Math.max(contextResiduals.length, 1);
  const contextCoherence = 1 - Math.min(1, contextMeanResidual / residualLimit);
  const severityRatio = Math.max(0, Math.min(1, worst.residual / residualLimit));
  const contextSeverityWeight = 0.25 + 0.75 * contextCoherence;
  return distanceTrimConfidence * (1 - 0.8 * severityRatio * contextSeverityWeight);
}

const severeFar = Math.log(1.095);
const cleanContext = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.012 },
  { distance: 4, residual: 0.013 },
  { distance: 5, residual: severeFar },
];
const oneMildSecondaryOutlier = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.012 },
  { distance: 4, residual: 0.035 },
  { distance: 5, residual: severeFar },
];
const twoSecondaryOutliers = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.032 },
  { distance: 4, residual: 0.035 },
  { distance: 5, residual: severeFar },
];

assert.ok(Math.abs(trimConfidence(oneMildSecondaryOutlier) - trimConfidence(cleanContext)) < 0.01,
  "one secondary mild residual must not make an otherwise isolated severe break look like noisy context");
assert.ok(trimConfidence(twoSecondaryOutliers) > trimConfidence(oneMildSecondaryOutlier) + 0.05,
  "two secondary residual problems must still reduce the standalone authority of the severe break");

const shortContext = oneMildSecondaryOutlier.slice(0, 3);
assert.equal(trimConfidence(shortContext), 0,
  "short support must not gain trim confidence from robust context handling");

console.log("robust context-aware side-support severity smoke passed");
