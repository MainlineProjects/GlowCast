import assert from "node:assert/strict";

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

function chooseEndpointSupport(points) {
  const evaluate = (members) => {
    const slopes = [];
    const steps = [];
    for (let index = 1; index < members.length; index += 1) {
      const step = members[index].x - members[index - 1].x;
      if (step <= 0) continue;
      steps.push(step);
      slopes.push((members[index].y - members[index - 1].y) / step);
    }
    if (slopes.length < 3 || steps.length < 3) return null;
    const medianSlope = median(slopes);
    const slopeDeviation = median(slopes.map((slope) => Math.abs(slope - medianSlope)));
    const slopeDeltas = slopes.slice(1).map((slope, index) => slope - slopes[index]);
    const medianSlopeDelta = median(slopeDeltas);
    const curvatureDeviation = median(slopeDeltas.map((delta) => Math.abs(delta - medianSlopeDelta)));
    const slopeLimit = Math.max(0.08, Math.abs(medianSlope) * 0.4);
    const curvatureLimit = Math.max(0.04, Math.abs(medianSlopeDelta) * 0.55);
    const slopeRange = Math.max(...slopes) - Math.min(...slopes);
    const slopeRangeCoherent = slopeRange <= Math.max(0.18, Math.abs(medianSlope) * 0.9);
    const slopeCoherent = slopeDeviation <= slopeLimit && slopeRangeCoherent;
    const curvatureCoherent = slopeDeltas.length >= 2 && curvatureDeviation <= curvatureLimit && Math.abs(medianSlopeDelta) <= 0.18;
    if (!slopeCoherent && !curvatureCoherent) return null;
    return {
      members,
      slopeCoherent,
      curvatureCoherent,
      score: Math.min(slopeDeviation / slopeLimit, curvatureDeviation / curvatureLimit),
    };
  };

  const candidates = [points];
  if (points.length >= 5) {
    for (let omitted = 0; omitted < points.length; omitted += 1) {
      candidates.push(points.filter((_, index) => index !== omitted));
    }
  }
  return candidates.map(evaluate).filter(Boolean).sort((left, right) => left.score - right.score)[0] ?? null;
}

const cleanCurve = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 16 },
  { x: 80, y: 22 },
  { x: 100, y: 30 },
];
assert.ok(chooseEndpointSupport(cleanCurve), "clean curved endpoint support should remain coherent");

const oneNoisyNeighbor = [
  { x: 20, y: 10 },
  { x: 40, y: 12 },
  { x: 60, y: 31 },
  { x: 80, y: 22 },
  { x: 100, y: 30 },
];
const robustSupport = chooseEndpointSupport(oneNoisyNeighbor);
assert.ok(robustSupport, "one noisy supporting opening should not destroy endpoint evidence");
assert.equal(
  robustSupport.members.some((point) => point.x === 60 && point.y === 31),
  false,
  "the most coherent support set should omit the single noisy neighbor",
);

const broadlyNoisy = [
  { x: 20, y: 10 },
  { x: 40, y: 25 },
  { x: 60, y: 8 },
  { x: 80, y: 30 },
  { x: 100, y: 12 },
];
assert.equal(chooseEndpointSupport(broadlyNoisy), null, "multiple noisy neighbors should still make endpoint extrapolation stand down");

console.log("robust endpoint neighbor consensus smoke passed");
