import assert from "node:assert/strict";

function adjacentBounds(robustSlope, adjacentOnExpandingSide) {
  const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18);
  return {
    compressedNoiseFloor: adjacentOnExpandingSide
      ? (0.70 + (0.08 * perspectiveStrength))
      : 0.70,
    expandedNoiseCeiling: adjacentOnExpandingSide
      ? (1.22 - (0.06 * perspectiveStrength))
      : 1.22,
  };
}

const flat = adjacentBounds(0, true);
assert.equal(flat.compressedNoiseFloor, 0.70, "flat rows should keep symmetric adjacent compression tolerance");
assert.equal(flat.expandedNoiseCeiling, 1.22, "flat rows should keep symmetric adjacent expansion tolerance");

const shallow = adjacentBounds(0.018, true);
assert.ok(shallow.compressedNoiseFloor > 0.70 && shallow.compressedNoiseFloor < 0.72,
  "shallow perspective should tighten compression only slightly");
assert.ok(shallow.expandedNoiseCeiling < 1.22 && shallow.expandedNoiseCeiling > 1.21,
  "shallow perspective should tighten expansion only slightly");

const strong = adjacentBounds(0.18, true);
assert.equal(strong.compressedNoiseFloor, 0.78, "strong perspective should retain the established near-side compression guard");
assert.equal(strong.expandedNoiseCeiling, 1.16, "strong perspective should retain the established near-side expansion guard");

const extreme = adjacentBounds(0.40, true);
assert.equal(extreme.compressedNoiseFloor, 0.78, "perspective strictness should remain bounded at the established maximum");
assert.equal(extreme.expandedNoiseCeiling, 1.16, "perspective strictness should remain bounded at the established maximum");

const farSide = adjacentBounds(0.18, false);
assert.deepEqual(farSide, { compressedNoiseFloor: 0.70, expandedNoiseCeiling: 1.22 },
  "far-side adjacent noise should retain the existing bounds");

console.log("strength-aware adjacent spacing-noise smoke passed");
