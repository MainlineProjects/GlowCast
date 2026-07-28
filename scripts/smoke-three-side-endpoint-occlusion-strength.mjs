import assert from "node:assert/strict";

function endpointGapRisk({ runStart, runEnd, binHits, minHits = 4, binCount = 8 }) {
  const runLength = runEnd - runStart + 1;
  const runRatio = runLength / binCount;
  const touchesEndpoint = runStart === 0 || runEnd === binCount - 1;
  const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));
  const endpointOcclusionStrengthSupported = (bin) => (binHits.get(bin) ?? 0) >= resumedBinMinHits;
  const endpointOcclusionSupported = !touchesEndpoint || (
    runStart === 0
      ? endpointOcclusionStrengthSupported(runEnd + 1) && endpointOcclusionStrengthSupported(runEnd + 2)
      : endpointOcclusionStrengthSupported(runStart - 1) && endpointOcclusionStrengthSupported(runStart - 2)
  );
  const allowedRatio = touchesEndpoint && endpointOcclusionSupported ? 0.375 : 0.25;
  return runRatio / allowedRatio;
}

assert.ok(
  endpointGapRisk({ runStart: 0, runEnd: 2, binHits: new Map([[3, 2], [4, 2], [5, 3], [6, 2], [7, 2]]) }) <= 1,
  "a three-bin endpoint gap should remain acceptable when the outline resumes with substantial support"
);

assert.ok(
  endpointGapRisk({ runStart: 0, runEnd: 2, binHits: new Map([[3, 1], [4, 1], [5, 4], [6, 3], [7, 3]]) }) > 1,
  "single-pixel occupancy in the resumed bins must not qualify as strong endpoint-occlusion support"
);

assert.ok(
  endpointGapRisk({ runStart: 5, runEnd: 7, binHits: new Map([[0, 3], [1, 3], [2, 2], [3, 2], [4, 2]]) }) <= 1,
  "substantial resumed support should work symmetrically at the far endpoint"
);

assert.ok(
  endpointGapRisk({ runStart: 2, runEnd: 4, binHits: new Map([[0, 3], [1, 3], [5, 3], [6, 3], [7, 3]]) }) > 1,
  "interior gaps must keep the stricter continuity allowance regardless of resumed-edge strength"
);

console.log("three-sided fallback endpoint occlusion strength smoke passed");
