import assert from "node:assert/strict";

function acceptsFallbackShape({ sides, aspect }) {
  if (aspect < 0.18 || aspect > 5.4) return false;
  const threeSideShapeGuard = sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);
  return threeSideShapeGuard;
}

assert.equal(acceptsFallbackShape({ sides: 3, aspect: 0.2 }), false,
  "a very tall three-sided fragment should not become an automatic fallback mask");
assert.equal(acceptsFallbackShape({ sides: 3, aspect: 4.4 }), false,
  "a very wide three-sided trim fragment should not become an automatic fallback mask");
assert.equal(acceptsFallbackShape({ sides: 3, aspect: 0.5 }), true,
  "a plausible doorway-like three-sided fallback should remain eligible");
assert.equal(acceptsFallbackShape({ sides: 3, aspect: 2.8 }), true,
  "a plausible wide architectural opening should remain eligible");
assert.equal(acceptsFallbackShape({ sides: 4, aspect: 0.22 }), true,
  "a fully closed narrow fallback should retain the broader established aspect allowance");
assert.equal(acceptsFallbackShape({ sides: 4, aspect: 4.6 }), true,
  "a fully closed wide fallback should retain the broader established aspect allowance");

console.log("three-sided fallback shape guard smoke passed");
