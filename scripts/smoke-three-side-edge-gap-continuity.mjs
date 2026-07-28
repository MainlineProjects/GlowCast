import assert from "node:assert/strict";

function acceptsFallbackShape({ sides, aspect, weakestPresentRatio, weakestPresentSpan, weakestPresentDistribution, worstPresentGap }) {
  if (aspect < 0.18 || aspect > 5.4) return false;
  const threeSideShapeGuard = sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);
  if (!threeSideShapeGuard) return false;
  const threeSideClosureQuality = sides !== 3 || weakestPresentRatio >= 1.35;
  if (!threeSideClosureQuality) return false;
  const threeSideEdgeSpanQuality = sides !== 3 || weakestPresentSpan >= 0.42;
  if (!threeSideEdgeSpanQuality) return false;
  const threeSideEdgeDistributionQuality = sides !== 3 || weakestPresentDistribution >= 0.5;
  if (!threeSideEdgeDistributionQuality) return false;
  const threeSideEdgeGapContinuity = sides !== 3 || worstPresentGap <= 0.25;
  return threeSideEdgeGapContinuity;
}

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.8, weakestPresentRatio: 1.8, weakestPresentSpan: 0.72, weakestPresentDistribution: 0.5, worstPresentGap: 0.375 }),
  false,
  "three-sided fallback should reject distributed evidence that still leaves one large unsupported edge section"
);

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.8, weakestPresentRatio: 1.8, weakestPresentSpan: 0.72, weakestPresentDistribution: 0.5, worstPresentGap: 0.25 }),
  true,
  "three-sided fallback should retain reasonably continuous distributed edge evidence"
);

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.8, weakestPresentRatio: 1.8, weakestPresentSpan: 0.72, weakestPresentDistribution: 0.34, worstPresentGap: 0.125 }),
  false,
  "continuity should not bypass the established edge-distribution requirement"
);

assert.equal(
  acceptsFallbackShape({ sides: 4, aspect: 0.22, weakestPresentRatio: 1.02, weakestPresentSpan: 0.2, weakestPresentDistribution: 0.16, worstPresentGap: 0.75 }),
  true,
  "fully closed candidates should keep their established broader fallback behavior"
);

console.log("three-sided fallback edge-gap continuity smoke passed");
