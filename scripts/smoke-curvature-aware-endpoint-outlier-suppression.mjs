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
  const slopeDeltas = slopes.slice(1).map((slope, index) => slope - slopes[index]);
  const medianSlopeDelta = median(slopeDeltas);
  const slopeDeltaDeviation = median(slopeDeltas.map((delta) => Math.abs(delta - medianSlopeDelta)));
  const medianStep = median(steps);
  const nearest = beforeRow ? local[0] : local[local.length - 1];
  const endpointGap = Math.abs(candidateAxis - axisCoordinate(nearest));
  if (endpointGap > medianStep * 1.75) return false;

  const slopeCoherent = slopeDeviation <= Math.max(0.08, Math.abs(medianSlope) * 0.4);
  const curvatureCoherent = slopeDeltas.length >= 2
    && slopeDeltaDeviation <= Math.max(0.04, Math.abs(medianSlopeDelta) * 0.55)
    && Math.abs(medianSlopeDelta) <= 0.18;
  if (!slopeCoherent && !curvatureCoherent) return false;

  const endpointStepRatio = medianStep > 0 ? endpointGap / medianStep : 1;
  const nearestSlope = beforeRow ? slopes[0] : slopes[slopes.length - 1];
  const extrapolatedSlope = curvatureCoherent
    ? nearestSlope + (beforeRow ? -1 : 1) * medianSlopeDelta * endpointStepRatio
    : medianSlope;
  const predictedCross = crossCoordinate(nearest) + extrapolatedSlope * (candidateAxis - axisCoordinate(nearest));
  const crossBoundsSize = axis === "row" ? bounds.height : bounds.width;
  const tolerance = Math.max(crossBoundsSize * 0.03, candidateCrossSize * 0.34);
  return Math.abs(crossCoordinate(candidate) - predictedCross) > tolerance;
}

const bounds = { width: 160, height: 160 };
const curvedRow = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 16 },
  { x: 80, y: 22 },
];

assert.equal(
  isEndpointOutlier({ x: 100, y: 30 }, curvedRow, bounds),
  false,
  "a valid endpoint continuing bounded gradual curvature should preserve repeated-row confidence",
);
assert.equal(
  isEndpointOutlier({ x: 100, y: 44 }, curvedRow, bounds),
  true,
  "a displaced endpoint should be isolated even when neighboring slopes form a coherent curve",
);

const curvedColumn = curvedRow.map(({ x, y }) => ({ x: y, y: x }));
assert.equal(
  isEndpointOutlier({ x: 44, y: 100 }, curvedColumn, bounds, "column"),
  true,
  "curvature-aware endpoint suppression should work symmetrically for repeated-opening columns",
);

const noisyNeighbors = [
  { x: 20, y: 10 },
  { x: 40, y: 18 },
  { x: 60, y: 12 },
  { x: 80, y: 25 },
];
assert.equal(
  isEndpointOutlier({ x: 100, y: 44 }, noisyNeighbors, bounds),
  false,
  "endpoint suppression should still stand down when neither slope nor curvature evidence is coherent",
);

const excessiveCurvature = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 20 },
  { x: 80, y: 40 },
];
assert.equal(
  isEndpointOutlier({ x: 100, y: 70 }, excessiveCurvature, bounds),
  false,
  "extreme bending should not be trusted for endpoint extrapolation",
);

console.log("curvature-aware selective endpoint outlier suppression smoke passed");
