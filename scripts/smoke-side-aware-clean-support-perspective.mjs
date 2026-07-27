import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function cleanSupportDistanceForSide(samples, side) {
  const sideSamples = samples.filter((sample) => Math.sign(sample.offset) === side);
  if (!sideSamples.length) return 2;
  const sideMaxSupportDistance = Math.max(2, ...sideSamples.map((sample) => sample.distance));
  const firstBreak = Math.min(
    ...sideSamples
      .filter((sample) => sample.residual > residualLimit)
      .map((sample) => sample.distance),
    Number.POSITIVE_INFINITY,
  );
  return Number.isFinite(firstBreak)
    ? Math.max(2, Math.min(sideMaxSupportDistance, firstBreak - 1))
    : sideMaxSupportDistance;
}

function effectiveCleanSupportDistance(samples) {
  return Math.max(
    2,
    cleanSupportDistanceForSide(samples, -1),
    cleanSupportDistanceForSide(samples, 1),
  );
}

const cleanBothSides = [
  { offset: -3, distance: 3, residual: 0.02 },
  { offset: -2, distance: 2, residual: 0.01 },
  { offset: -1, distance: 1, residual: 0.01 },
  { offset: 1, distance: 1, residual: 0.01 },
  { offset: 2, distance: 2, residual: 0.02 },
  { offset: 3, distance: 3, residual: 0.02 },
  { offset: 4, distance: 4, residual: 0.03 },
];
assert.equal(effectiveCleanSupportDistance(cleanBothSides), 4,
  "clean support should retain the longest coherent side around a suspected gap");

const leftBreakRightClean = [
  { offset: -4, distance: 4, residual: 0.02 },
  { offset: -3, distance: 3, residual: Math.log(1.24) },
  { offset: -2, distance: 2, residual: 0.02 },
  { offset: -1, distance: 1, residual: 0.01 },
  { offset: 1, distance: 1, residual: 0.01 },
  { offset: 2, distance: 2, residual: 0.02 },
  { offset: 3, distance: 3, residual: 0.02 },
  { offset: 4, distance: 4, residual: 0.03 },
  { offset: 5, distance: 5, residual: 0.02 },
];
assert.equal(cleanSupportDistanceForSide(leftBreakRightClean, -1), 2,
  "a coherence break should shorten only its own side of the facade");
assert.equal(cleanSupportDistanceForSide(leftBreakRightClean, 1), 5,
  "uninterrupted support on the opposite side should remain fully usable");
assert.equal(effectiveCleanSupportDistance(leftBreakRightClean), 5,
  "one-sided damage should not erase strong clean support across the suspected gap");

const rightBreakLeftClean = leftBreakRightClean.map((sample) => ({
  ...sample,
  offset: -sample.offset,
}));
assert.equal(cleanSupportDistanceForSide(rightBreakLeftClean, 1), 2,
  "the side-aware rule should behave symmetrically for a right-side break");
assert.equal(cleanSupportDistanceForSide(rightBreakLeftClean, -1), 5,
  "clean left-side support should survive a right-side coherence break");

const brokenBothSides = [
  { offset: -3, distance: 3, residual: Math.log(1.22) },
  { offset: -2, distance: 2, residual: 0.01 },
  { offset: -1, distance: 1, residual: 0.01 },
  { offset: 1, distance: 1, residual: 0.01 },
  { offset: 2, distance: 2, residual: 0.01 },
  { offset: 3, distance: 3, residual: Math.log(1.20) },
];
assert.equal(effectiveCleanSupportDistance(brokenBothSides), 2,
  "breaks on both sides should keep the short-facade locality floor rather than inflating support");

console.log("side-aware clean-support perspective smoke passed");
