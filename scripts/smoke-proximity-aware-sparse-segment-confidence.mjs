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
  const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2) * sparseSegmentProximityScale;
  return (1 - Math.min(1, segmentContextMeanResidual / residualLimit)) * segmentEvidenceScale;
}

const adjacentSingle = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [{ offset: -4, residual: 0.01 }],
});
const remoteSingle = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [{ offset: -2, residual: 0.01 }],
});
assert.ok(adjacentSingle > 0.4,
  "one immediately adjacent clean opening should retain useful sparse-segment confidence");
assert.ok(remoteSingle < adjacentSingle * 0.7,
  "one remote isolated opening should contribute materially less sparse-segment confidence");

const twoClean = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [
    { offset: -4, residual: 0.01 },
    { offset: -3, residual: 0.011 },
  ],
});
assert.ok(twoClean > adjacentSingle * 1.8,
  "two clean openings should recover full segment evidence without the sparse proximity penalty");

const twoRemote = segmentCoherence({
  worstOffset: -5,
  segmentContextSamples: [
    { offset: -2, residual: 0.01 },
    { offset: -1, residual: 0.011 },
  ],
});
assert.ok(Math.abs(twoClean - twoRemote) < 0.02,
  "proximity penalty should apply only to a single sparse support sample, not established two-opening segments");

console.log("proximity-aware sparse facade segment confidence smoke passed");
