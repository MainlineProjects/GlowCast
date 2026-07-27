import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function trimConfidence({ distance, worstResidual, contextResiduals }) {
  const distanceTrimConfidence = Math.max(0, Math.min(1, (distance - 2) / 3));
  const severityRatio = Math.max(0, Math.min(1, worstResidual / residualLimit));
  const contextMeanResidual = contextResiduals.reduce((sum, residual) => sum + residual, 0)
    / Math.max(contextResiduals.length, 1);
  const contextCoherence = 1 - Math.min(1, contextMeanResidual / residualLimit);
  const contextSeverityWeight = 0.25 + 0.75 * contextCoherence;
  const confirmedBreakResidualCount = contextResiduals.filter(
    (residual) => residual >= residualLimit * 0.75
  ).length + (severityRatio >= 0.75 ? 1 : 0);
  const crossBreakTrimScale = confirmedBreakResidualCount >= 2 ? 0.2 : 1;
  return distanceTrimConfidence
    * (1 - 0.8 * severityRatio * contextSeverityWeight)
    * crossBreakTrimScale;
}

const isolatedBreak = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  contextResiduals: [0.010, 0.011, 0.012, 0.013]
});
const confirmedDiscontinuity = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  contextResiduals: [0.010, 0.011, residualLimit * 0.82, 0.013]
});
const mildNeighborNoise = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  contextResiduals: [0.010, 0.011, residualLimit * 0.45, 0.013]
});

assert.ok(isolatedBreak > confirmedDiscontinuity * 3,
  "a confirmed second structural break should sharply reduce worst-sample trimming");
assert.ok(Math.abs(isolatedBreak - mildNeighborNoise) < 0.06,
  "mild neighboring detector noise must not be mistaken for a facade discontinuity");
assert.equal(trimConfidence({
  distance: 2,
  worstResidual: residualLimit * 0.95,
  contextResiduals: [residualLimit * 0.82, 0.011, 0.012, 0.013]
}), 0,
  "near-gap severe evidence must remain fully influential regardless of discontinuity scaling");

console.log("facade-break confidence split smoke passed");
