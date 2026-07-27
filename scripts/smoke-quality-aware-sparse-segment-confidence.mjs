import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function segmentCoherence({ worstOffset, segmentContextSamples }) {
  const segmentContextMeanResidual = segmentContextSamples.length > 0
    ? segmentContextSamples.reduce((sum, sample) => sum + sample.residual, 0) / segmentContextSamples.length
    : residualLimit;
  const nearestSegmentDistance = segmentContextSamples.length > 0
    ? Math.min(...segmentContextSamples.map((sample) => Math.abs(sample.offset - worstOffset)))
    : Number.POSITIVE_INFINITY;
  const sparseSegmentProximityScale = segmentContextSamples.length === 1
    ? Math.max(0.45, 1 - Math.max(0, nearestSegmentDistance - 1) * 0.2)
    : 1;
  const sparseSegmentQualityScale = segmentContextSamples.length === 1
    ? Math.max(0.35, 1 - Math.min(1, segmentContextMeanResidual / residualLimit) * 0.45)
    : 1;
  const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2)
    * sparseSegmentProximityScale
    * sparseSegmentQualityScale;
  return (1 - Math.min(1, segmentContextMeanResidual / residualLimit)) * segmentEvidenceScale;
}

const cleanAdjacentSingle = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [{ offset: -4, residual: 0.01 }],
});
const weakAdjacentSingle = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [{ offset: -4, residual: 0.055 }],
});
assert.ok(cleanAdjacentSingle > 0.4,
  "one nearby clean opening should retain useful sparse-segment confidence");
assert.ok(weakAdjacentSingle < cleanAdjacentSingle * 0.55,
  "one nearby but weakly aligned opening should contribute substantially less sparse confidence");

const twoWeakSupports = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [
    { offset: -4, residual: 0.055 },
    { offset: -3, residual: 0.055 },
  ],
});
assert.ok(twoWeakSupports > weakAdjacentSingle * 2,
  "an established two-opening segment should not receive the single-sample quality penalty");

const remoteWeakSingle = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [{ offset: -2, residual: 0.055 }],
});
assert.ok(remoteWeakSingle < weakAdjacentSingle * 0.7,
  "weak sparse support should still compound with the existing proximity penalty when remote");

console.log("quality-aware sparse facade segment confidence smoke passed");
