import assert from "node:assert/strict";

function endpointGapRisk({ runStart, runEnd, occupied, binCount = 8 }) {
  const runLength = runEnd - runStart + 1;
  const runRatio = runLength / binCount;
  const touchesEndpoint = runStart === 0 || runEnd === binCount - 1;
  const endpointOcclusionSupported = !touchesEndpoint || (
    runStart === 0
      ? occupied.has(runEnd + 1) && occupied.has(runEnd + 2)
      : occupied.has(runStart - 1) && occupied.has(runStart - 2)
  );
  const allowedRatio = touchesEndpoint && endpointOcclusionSupported ? 0.375 : 0.25;
  return runRatio / allowedRatio;
}

assert.ok(
  endpointGapRisk({ runStart: 0, runEnd: 2, occupied: new Set([3, 4, 5, 6, 7]) }) <= 1,
  "a three-bin endpoint gap should remain acceptable when the outline resumes strongly immediately after the occlusion"
);

assert.ok(
  endpointGapRisk({ runStart: 0, runEnd: 2, occupied: new Set([3, 5, 6, 7]) }) > 1,
  "a three-bin endpoint gap should be rejected when evidence fades instead of resuming continuously"
);

assert.ok(
  endpointGapRisk({ runStart: 5, runEnd: 7, occupied: new Set([0, 1, 2, 3, 4]) }) <= 1,
  "the same occlusion rule should work symmetrically at the far endpoint"
);

assert.ok(
  endpointGapRisk({ runStart: 2, runEnd: 4, occupied: new Set([0, 1, 5, 6, 7]) }) > 1,
  "interior gaps must keep the stricter continuity allowance"
);

console.log("three-sided fallback endpoint occlusion support smoke passed");
