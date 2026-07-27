import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function segmentCoherence({ worstOffset, contextSamples, nearestBreakDistance = Number.POSITIVE_INFINITY }) {
  const worstSampleSide = Math.sign(worstOffset);
  const sameSideContextSamples = contextSamples.filter(
    (sample) => Math.sign(sample.offset) === worstSampleSide
  );
  const contiguousWorstSideSamples = Number.isFinite(nearestBreakDistance)
    ? sameSideContextSamples.filter((sample) => Math.abs(sample.offset) >= nearestBreakDistance)
    : sameSideContextSamples;
  const segmentContextSamples = contiguousWorstSideSamples.length > 0
    ? contiguousWorstSideSamples
    : sameSideContextSamples;
  const segmentContextMeanResidual = segmentContextSamples.length > 0
    ? segmentContextSamples.reduce((sum, sample) => sum + sample.residual, 0) / segmentContextSamples.length
    : residualLimit;
  const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2);
  return (1 - Math.min(1, segmentContextMeanResidual / residualLimit)) * segmentEvidenceScale;
}

const mostlyClean = [
  { offset: -4, residual: 0.011 },
  { offset: 2, residual: 0.010 },
  { offset: 3, residual: 0.011 },
  { offset: 4, residual: 0.012 },
];

const sparseLeft = segmentCoherence({
  worstOffset: -5,
  contextSamples: mostlyClean,
  nearestBreakDistance: 4,
});

const sparseLeftWithNoisyRight = segmentCoherence({
  worstOffset: -5,
  contextSamples: mostlyClean.map((sample) => sample.offset > 0
    ? { ...sample, residual: residualLimit * 0.95 }
    : sample),
  nearestBreakDistance: 4,
});

assert.ok(sparseLeft > 0.35 && sparseLeft < 0.5,
  "one clean sample should provide useful but deliberately reduced segment confidence");
assert.ok(Math.abs(sparseLeft - sparseLeftWithNoisyRight) < 1e-12,
  "opposite-side noise must not alter sparse confidence on the current facade segment");

const twoCleanLeft = segmentCoherence({
  worstOffset: -5,
  contextSamples: [
    { offset: -4, residual: 0.011 },
    { offset: -3, residual: 0.012 },
    { offset: 2, residual: residualLimit * 0.95 },
    { offset: 3, residual: residualLimit * 0.95 },
  ],
  nearestBreakDistance: 3,
});
assert.ok(twoCleanLeft > sparseLeft * 1.7,
  "two clean contiguous samples should recover strong segment-local confidence");

const noLeftSupport = segmentCoherence({
  worstOffset: -5,
  contextSamples: [
    { offset: 2, residual: 0.010 },
    { offset: 3, residual: 0.011 },
    { offset: 4, residual: 0.012 },
  ],
});
assert.equal(noLeftSupport, 0,
  "a segment with no same-side support must not borrow confidence from the opposite side");

console.log("independent facade segment confidence smoke passed");
