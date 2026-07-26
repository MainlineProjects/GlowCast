import assert from "node:assert/strict";

function isEndpointOutlier(candidate, neighbors, bounds, axis = "row", candidateCrossSize = 10) {
  if (neighbors.length < 4) return false;
  const axisCoordinate = axis === "row" ? (point) => point.x : (point) => point.y;
  const crossCoordinate = axis === "row" ? (point) => point.y : (point) => point.x;
  const ordered = [...neighbors].sort((left, right) => axisCoordinate(left) - axisCoordinate(right));
  const candidateAxis = axisCoordinate(candidate);
  const firstAxis = axisCoordinate(ordered[0]);
  const lastAxis = axisCoordinate(ordered[ordered.length - 1]);
  const beforeRow = candidateAxis < firstAxis;
  const afterRow = candidateAxis > lastAxis;
  if (!beforeRow && !afterRow) return false;

  const local = beforeRow ? ordered.slice(0, 4) : ordered.slice(-4);
  const slopes = [];
  const steps = [];
  for (let index = 1; index < local.length; index += 1) {
    const previous = local[index - 1];
    const current = local[index];
    const axisStep = axisCoordinate(current) - axisCoordinate(previous);
    if (axisStep <= 0) continue;
    steps.push(axisStep);
    slopes.push((crossCoordinate(current) - crossCoordinate(previous)) / axisStep);
  }
  if (slopes.length < 3 || steps.length < 3) return false;
  const median = (values) => {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  };
  const medianSlope = median(slopes);
  const slopeDeviation = median(slopes.map((slope) => Math.abs(slope - medianSlope)));
  const medianStep = median(steps);
  const nearest = beforeRow ? local[0] : local[local.length - 1];
  const endpointGap = Math.abs(candidateAxis - axisCoordinate(nearest));
  if (endpointGap > medianStep * 1.75) return false;
  if (slopeDeviation > Math.max(0.08, Math.abs(medianSlope) * 0.4)) return false;

  const predictedCross = crossCoordinate(nearest) + medianSlope * (candidateAxis - axisCoordinate(nearest));
  const crossBoundsSize = axis === "row" ? bounds.height : bounds.width;
  const tolerance = Math.max(crossBoundsSize * 0.03, candidateCrossSize * 0.34);
  return Math.abs(crossCoordinate(candidate) - predictedCross) > tolerance;
}

const bounds = { width: 140, height: 140 };
const row = [
  { x: 20, y: 12 },
  { x: 40, y: 15 },
  { x: 60, y: 19 },
  { x: 80, y: 24 },
];

assert.equal(
  isEndpointOutlier({ x: 100, y: 30 }, row, bounds),
  false,
  "a valid endpoint continuing a coherent perspective trend should keep its repeated-row confidence",
);
assert.equal(
  isEndpointOutlier({ x: 100, y: 45 }, row, bounds),
  true,
  "a displaced endpoint should be isolated when four coherent neighbors support the extrapolated trend",
);
assert.equal(
  isEndpointOutlier({ x: 120, y: 45 }, row, bounds),
  false,
  "a far-away satellite should not be selectively classified from unsafe long-range extrapolation",
);
assert.equal(
  isEndpointOutlier({ x: 50, y: 40 }, row, bounds),
  false,
  "interior candidates should remain the responsibility of the existing interpolation-based guard",
);

const noisyNeighbors = [
  { x: 20, y: 12 },
  { x: 40, y: 20 },
  { x: 60, y: 13 },
  { x: 80, y: 25 },
];
assert.equal(
  isEndpointOutlier({ x: 100, y: 45 }, noisyNeighbors, bounds),
  false,
  "endpoint suppression should stand down when neighboring slope evidence is not coherent",
);

const column = row.map(({ x, y }) => ({ x: y, y: x }));
assert.equal(
  isEndpointOutlier({ x: 45, y: 100 }, column, bounds, "column"),
  true,
  "endpoint outlier suppression should work symmetrically for repeated-opening columns",
);

console.log("selective endpoint outlier suppression smoke passed");
