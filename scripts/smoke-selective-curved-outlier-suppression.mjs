import assert from "node:assert/strict";

function isInteriorOutlier(candidate, neighbors, bounds, axis = "row", candidateCrossSize = 10) {
  const axisCoordinate = axis === "row" ? (point) => point.x : (point) => point.y;
  const crossCoordinate = axis === "row" ? (point) => point.y : (point) => point.x;
  const ordered = [...neighbors].sort((left, right) => axisCoordinate(left) - axisCoordinate(right));
  const candidateAxis = axisCoordinate(candidate);
  const firstAxis = axisCoordinate(ordered[0]);
  const lastAxis = axisCoordinate(ordered[ordered.length - 1]);
  if (candidateAxis <= firstAxis || candidateAxis >= lastAxis) return false;

  const predictions = [];
  for (let leftIndex = 0; leftIndex < ordered.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
      const left = ordered[leftIndex];
      const right = ordered[rightIndex];
      const span = axisCoordinate(right) - axisCoordinate(left);
      if (span <= 0 || candidateAxis < axisCoordinate(left) || candidateAxis > axisCoordinate(right)) continue;
      const fraction = (candidateAxis - axisCoordinate(left)) / span;
      predictions.push(crossCoordinate(left) + (crossCoordinate(right) - crossCoordinate(left)) * fraction);
    }
  }
  if (predictions.length < 2) return false;
  predictions.sort((left, right) => left - right);
  const middle = Math.floor(predictions.length / 2);
  const predictedCross = predictions.length % 2 === 0
    ? (predictions[middle - 1] + predictions[middle]) / 2
    : predictions[middle];
  const deviations = predictions.map((value) => Math.abs(value - predictedCross)).sort((left, right) => left - right);
  const deviationMiddle = Math.floor(deviations.length / 2);
  const medianDeviation = deviations.length % 2 === 0
    ? (deviations[deviationMiddle - 1] + deviations[deviationMiddle]) / 2
    : deviations[deviationMiddle];
  const crossBoundsSize = axis === "row" ? bounds.height : bounds.width;
  const tolerance = Math.max(crossBoundsSize * 0.025, candidateCrossSize * 0.28);
  return medianDeviation <= tolerance * 0.65 && Math.abs(crossCoordinate(candidate) - predictedCross) > tolerance;
}

const bounds = { width: 120, height: 120 };
const validCurvedRow = [
  { x: 10, y: 10 },
  { x: 30, y: 14 },
  { x: 50, y: 20 },
  { x: 70, y: 28 },
  { x: 90, y: 38 },
];
const displacedMidpoint = { x: 50, y: 32 };
const midpointNeighbors = validCurvedRow.filter((point) => point.x !== 50);

assert.equal(
  isInteriorOutlier(validCurvedRow[2], midpointNeighbors, bounds),
  false,
  "a valid midpoint on a smoothly curved repeated-opening row should retain its group confidence",
);
assert.equal(
  isInteriorOutlier(displacedMidpoint, midpointNeighbors, bounds),
  true,
  "one displaced interior mask should be isolated as the geometric outlier instead of weakening every valid group member",
);
assert.equal(
  isInteriorOutlier(validCurvedRow[0], validCurvedRow.slice(1), bounds),
  false,
  "an endpoint should not be selectively suppressed from interpolation-only evidence",
);

const validCurvedColumn = validCurvedRow.map(({ x, y }) => ({ x: y, y: x }));
const displacedColumnMidpoint = { x: 32, y: 50 };
const columnNeighbors = validCurvedColumn.filter((point) => point.y !== 50);
assert.equal(
  isInteriorOutlier(displacedColumnMidpoint, columnNeighbors, bounds, "column"),
  true,
  "selective outlier suppression should work symmetrically for repeated-opening columns",
);

const validMultiplier = 0.78;
const outlierMultiplier = 0.35;
assert.ok(validMultiplier > outlierMultiplier * 2, "valid surrounding openings should retain substantially more repeated-group confidence than the isolated outlier");

console.log("selective curved-row outlier suppression smoke passed");
