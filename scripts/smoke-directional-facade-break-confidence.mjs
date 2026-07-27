import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function trimConfidence({ distance, worstResidual, worstOffset, contextSamples }) {
  const distanceTrimConfidence = Math.max(0, Math.min(1, (distance - 2) / 3));
  const severityRatio = Math.max(0, Math.min(1, worstResidual / residualLimit));
  const contextMeanResidual = contextSamples.reduce((sum, sample) => sum + sample.residual, 0)
    / Math.max(contextSamples.length, 1);
  const contextCoherence = 1 - Math.min(1, contextMeanResidual / residualLimit);
  const contextSeverityWeight = 0.25 + 0.75 * contextCoherence;
  const worstSampleSide = Math.sign(worstOffset);
  const confirmedBreakResidualCountOnWorstSide = contextSamples.filter(
    (sample) => Math.sign(sample.offset) === worstSampleSide
      && sample.residual >= residualLimit * 0.75
  ).length + (severityRatio >= 0.75 ? 1 : 0);
  const crossBreakTrimScale = confirmedBreakResidualCountOnWorstSide >= 2 ? 0.2 : 1;
  return distanceTrimConfidence
    * (1 - 0.8 * severityRatio * contextSeverityWeight)
    * crossBreakTrimScale;
}

const baseContext = [
  { offset: -4, residual: 0.010 },
  { offset: -3, residual: 0.011 },
  { offset: 2, residual: 0.012 },
  { offset: 3, residual: 0.013 },
];

const isolatedWorst = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  worstOffset: -5,
  contextSamples: baseContext,
});

const sameSideBreak = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  worstOffset: -5,
  contextSamples: baseContext.map((sample, index) => index === 0
    ? { ...sample, residual: residualLimit * 0.82 }
    : sample),
});

const oppositeSideBreak = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  worstOffset: -5,
  contextSamples: baseContext.map((sample, index) => index === 2
    ? { ...sample, residual: residualLimit * 0.82 }
    : sample),
});

assert.ok(sameSideBreak < isolatedWorst * 0.35,
  "a second severe residual on the same side should confirm a directional facade break");
assert.ok(oppositeSideBreak > sameSideBreak * 3,
  "a severe residual on the opposite side must not globally weaken the clean side");
assert.ok(oppositeSideBreak > isolatedWorst * 0.75,
  "opposite-side structural damage should preserve most trim authority on the unaffected side");
assert.equal(trimConfidence({
  distance: 2,
  worstResidual: residualLimit * 0.95,
  worstOffset: 2,
  contextSamples: [{ offset: 3, residual: residualLimit * 0.85 }, ...baseContext],
}), 0,
  "near-gap severe evidence must remain fully influential even with directional splitting");

console.log("directional facade-break confidence smoke passed");
