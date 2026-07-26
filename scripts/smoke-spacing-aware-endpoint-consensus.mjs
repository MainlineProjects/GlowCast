import assert from "node:assert/strict";

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

function supportSpacingIsSafe(points) {
  const steps = points.slice(1).map((point, index) => point.x - points[index].x).filter((step) => step > 0);
  if (steps.length < 3) return true;
  const medianStep = median(steps);
  return Math.max(...steps) <= medianStep * 1.75;
}

const regular = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 16 },
  { x: 80, y: 22 },
  { x: 100, y: 30 },
];
assert.equal(supportSpacingIsSafe(regular), true, "regular repeated-opening support should remain eligible");

const perspectiveSpacing = [
  { x: 18, y: 10 },
  { x: 37, y: 12 },
  { x: 58, y: 16 },
  { x: 81, y: 22 },
  { x: 106, y: 30 },
];
assert.equal(supportSpacingIsSafe(perspectiveSpacing), true, "gradually changing perspective spacing should remain eligible");

const missingOpeningGap = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 16 },
  { x: 100, y: 22 },
  { x: 120, y: 30 },
];
assert.equal(supportSpacingIsSafe(missingOpeningGap), false, "a missing-opening-sized gap should make endpoint consensus stand down");

const oneNoisyGeometryNeighbor = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 31 },
  { x: 80, y: 22 },
  { x: 100, y: 30 },
];
assert.equal(supportSpacingIsSafe(oneNoisyGeometryNeighbor), true, "geometry noise alone should not be mistaken for a spacing gap");

console.log("spacing-aware endpoint consensus smoke passed");
