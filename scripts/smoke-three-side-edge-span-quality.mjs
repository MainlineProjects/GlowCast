import assert from "node:assert/strict";

function acceptsFallbackShape({ sides, aspect, weakestPresentRatio, weakestPresentSpan }) {
  if (aspect < 0.18 || aspect > 5.4) return false;
  const threeSideShapeGuard = sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);
  if (!threeSideShapeGuard) return false;
  const threeSideClosureQuality = sides !== 3 || weakestPresentRatio >= 1.35;
  if (!threeSideClosureQuality) return false;
  const threeSideEdgeSpanQuality = sides !== 3 || weakestPresentSpan >= 0.42;
  return threeSideEdgeSpanQuality;
}

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.75, weakestPresentRatio: 1.7, weakestPresentSpan: 0.18 }),
  false,
  "clustered corner pixels should not pass merely because their raw edge-hit count is high"
);
assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.75, weakestPresentRatio: 1.7, weakestPresentSpan: 0.58 }),
  true,
  "a plausible three-sided opening with support distributed across each detected edge should remain eligible"
);
assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.75, weakestPresentRatio: 1.1, weakestPresentSpan: 0.8 }),
  false,
  "wide edge span should not bypass the established closure-strength requirement"
);
assert.equal(
  acceptsFallbackShape({ sides: 4, aspect: 0.22, weakestPresentRatio: 1.02, weakestPresentSpan: 0.2 }),
  true,
  "fully closed candidates should retain their established broader behavior"
);

console.log("three-sided fallback edge-span quality smoke passed");
