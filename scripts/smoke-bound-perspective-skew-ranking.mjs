import assert from "node:assert/strict";

function perspectiveCoherence(upper, lower) {
  const magnitude = Math.max(Math.abs(upper), Math.abs(lower));
  return (
    Math.abs(lower) >= 0.04
    && upper * lower > 0
    && Math.abs(upper - lower) <= 0.08
    && magnitude <= 0.34
  );
}

assert.equal(
  perspectiveCoherence(0.17, 0.13),
  true,
  "ordinary oblique perspective should retain paired-opening confidence",
);
assert.equal(
  perspectiveCoherence(-0.23, -0.18),
  true,
  "coherent perspective should work symmetrically in the opposite direction",
);
assert.equal(
  perspectiveCoherence(0.42, 0.38),
  false,
  "extreme whole-opening lateral skew should not masquerade as a paired architectural opening",
);
assert.equal(
  perspectiveCoherence(0.25, 0.08),
  false,
  "upper-only lateral distortion must remain rejected even below the absolute skew cap",
);

console.log("bounded perspective-skew ranking smoke passed");
