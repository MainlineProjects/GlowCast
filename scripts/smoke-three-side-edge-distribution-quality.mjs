import assert from "node:assert/strict";

function acceptsFallbackShape({ sides, aspect, weakestPresentRatio, weakestPresentSpan, weakestPresentDistribution }) {
  if (aspect < 0.18 || aspect > 5.4) return false;
  const threeSideShapeGuard = sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);
  if (!threeSideShapeGuard) return false;
  const threeSideClosureQuality = sides !== 3 || weakestPresentRatio >= 1.35;
  if (!threeSideClosureQuality) return false;
  const threeSideEdgeSpanQuality = sides !== 3 || weakestPresentSpan >= 0.42;
  if (!threeSideEdgeSpanQuality) return false;
  const threeSideEdgeDistributionQuality = sides !== 3 || weakestPresentDistribution >= 0.5;
  return threeSideEdgeDistributionQuality;
}

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.8, weakestPresentRatio: 1.8, weakestPresentSpan: 0.72, weakestPresentDistribution: 0.34 }),
  false,
  "two distant edge clusters should not pass merely because they create a wide overall span"
);

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.8, weakestPresentRatio: 1.8, weakestPresentSpan: 0.72, weakestPresentDistribution: 0.67 }),
  true,
  "three-sided openings with evidence distributed along every detected edge should remain eligible"
);

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.8, weakestPresentRatio: 1.8, weakestPresentSpan: 0.3, weakestPresentDistribution: 0.83 }),
  false,
  "distributed points should not bypass the established minimum edge-span requirement"
);

assert.equal(
  acceptsFallbackShape({ sides: 4, aspect: 0.22, weakestPresentRatio: 1.02, weakestPresentSpan: 0.2, weakestPresentDistribution: 0.16 }),
  true,
  "fully closed candidates should keep their established broader fallback behavior"
);

console.log("three-sided fallback edge-distribution quality smoke passed");
