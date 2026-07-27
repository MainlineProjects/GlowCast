import assert from "node:assert/strict";

function acceptsFallbackShape({ sides, aspect, weakestPresentRatio }) {
  if (aspect < 0.18 || aspect > 5.4) return false;
  const threeSideShapeGuard = sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);
  if (!threeSideShapeGuard) return false;
  const threeSideClosureQuality = sides !== 3 || weakestPresentRatio >= 1.35;
  return threeSideClosureQuality;
}

assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.7, weakestPresentRatio: 1.05 }),
  false,
  "a three-sided candidate whose weakest detected edge barely clears the hit threshold should be rejected"
);
assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 0.7, weakestPresentRatio: 1.6 }),
  true,
  "a plausible three-sided opening with convincing coverage on all detected edges should remain eligible"
);
assert.equal(
  acceptsFallbackShape({ sides: 3, aspect: 3.95, weakestPresentRatio: 2 }),
  false,
  "strong edge coverage should not bypass the established three-sided aspect guard"
);
assert.equal(
  acceptsFallbackShape({ sides: 4, aspect: 0.22, weakestPresentRatio: 1.02 }),
  true,
  "fully closed candidates should retain the broader existing closure behavior"
);

console.log("three-sided fallback closure-quality smoke passed");
