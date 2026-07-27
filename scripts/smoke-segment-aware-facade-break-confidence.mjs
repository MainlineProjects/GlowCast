import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function trimConfidence({ distance, worstResidual, worstOffset, contextSamples }) {
  const distanceTrimConfidence = Math.max(0, Math.min(1, (distance - 2) / 3));
  const severityRatio = Math.max(0, Math.min(1, worstResidual / residualLimit));
  const worstSampleSide = Math.sign(worstOffset);
  const sameSideContextSamples = contextSamples.filter(
    (sample) => Math.sign(sample.offset) === worstSampleSide
  );
  const confirmedBreakSamplesOnWorstSide = sameSideContextSamples.filter(
    (sample) => sample.residual >= residualLimit * 0.75
  );
  const confirmedBreakResidualCountOnWorstSide = confirmedBreakSamplesOnWorstSide.length
    + (severityRatio >= 0.75 ? 1 : 0);
  const nearestConfirmedBreakDistance = confirmedBreakSamplesOnWorstSide.reduce(
    (nearest, sample) => Math.min(nearest, Math.abs(sample.offset)),
    Number.POSITIVE_INFINITY
  );
  const contiguousWorstSideSamples = Number.isFinite(nearestConfirmedBreakDistance)
    ? sameSideContextSamples.filter((sample) => Math.abs(sample.offset) >= nearestConfirmedBreakDistance)
    : sameSideContextSamples;
  const segmentContextSamples = contiguousWorstSideSamples.length >= 2
    ? contiguousWorstSideSamples
    : contextSamples;
  const segmentContextMeanResidual = segmentContextSamples.reduce(
    (sum, sample) => sum + sample.residual,
    0
  ) / Math.max(segmentContextSamples.length, 1);
  const segmentContextCoherence = 1 - Math.min(1, segmentContextMeanResidual / residualLimit);
  const segmentContextSeverityWeight = 0.25 + 0.75 * segmentContextCoherence;
  const crossBreakTrimScale = confirmedBreakResidualCountOnWorstSide >= 2 ? 0.2 : 1;
  return distanceTrimConfidence
    * (1 - 0.8 * severityRatio * segmentContextSeverityWeight)
    * crossBreakTrimScale;
}

const cleanBothSides = [
  { offset: -4, residual: 0.010 },
  { offset: -3, residual: 0.011 },
  { offset: -2, residual: 0.012 },
  { offset: 2, residual: 0.011 },
  { offset: 3, residual: 0.012 },
  { offset: 4, residual: 0.013 },
];

const isolatedWorst = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  worstOffset: -5,
  contextSamples: cleanBothSides,
});

const sameSideBreak = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  worstOffset: -5,
  contextSamples: cleanBothSides.map((sample) => sample.offset === -4
    ? { ...sample, residual: residualLimit * 0.84 }
    : sample),
});

const oppositeSideBreak = trimConfidence({
  distance: 5,
  worstResidual: residualLimit * 0.95,
  worstOffset: -5,
  contextSamples: cleanBothSides.map((sample) => sample.offset === 3
    ? { ...sample, residual: residualLimit * 0.84 }
    : sample),
});

const outerCleanSegment = trimConfidence({
  distance: 6,
  worstResidual: residualLimit * 0.95,
  worstOffset: -6,
  contextSamples: [
    { offset: -5, residual: 0.011 },
    { offset: -4, residual: 0.012 },
    { offset: -3, residual: residualLimit * 0.88 },
    { offset: -2, residual: 0.010 },
    { offset: 2, residual: 0.011 },
    { offset: 3, residual: 0.012 },
  ],
});

assert.ok(sameSideBreak < isolatedWorst * 0.35,
  "a confirmed break on the worst side should strongly reduce cross-break trim authority");
assert.ok(oppositeSideBreak > sameSideBreak * 3,
  "damage on the opposite side must not collapse the clean worst-side segment");
assert.ok(oppositeSideBreak > isolatedWorst * 0.65,
  "opposite-side damage should preserve most confidence for the unaffected side");
assert.ok(outerCleanSegment > sameSideBreak,
  "clean support beyond a nearer break should retain segment-local authority instead of borrowing across the break");
assert.equal(trimConfidence({
  distance: 2,
  worstResidual: residualLimit * 0.95,
  worstOffset: -2,
  contextSamples: cleanBothSides,
}), 0,
  "near-gap severe evidence must remain fully influential");

console.log("segment-aware facade-break confidence smoke passed");
