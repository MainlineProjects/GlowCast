import assert from "node:assert/strict";

function narrowSpacingOutlier({ current, previous, next, left, right, rowLike = true }) {
  const expected = Math.sqrt(Math.max(previous, 0.01) * Math.max(next, 0.01));
  const localRatio = current / Math.max(expected, 0.01);
  const visiblyNarrowerThanNeighbors = current <= Math.min(previous, next) * 0.82;
  const widthRatio = Math.min(left.width, right.width) / Math.max(left.width, right.width, 0.01);
  const heightRatio = Math.min(left.height, right.height) / Math.max(left.height, right.height, 0.01);
  const crossAxisOverlap = rowLike
    ? Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y)) / Math.max(Math.min(left.height, right.height), 0.01)
    : Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)) / Math.max(Math.min(left.width, right.width), 0.01);
  const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82;
  const likelyPairedAssembly = localRatio < 0.5 && geometryMatchedPair;
  const suspiciousTightCluster = localRatio >= 0.3 && localRatio < 0.5 && !likelyPairedAssembly;
  return visiblyNarrowerThanNeighbors && ((localRatio >= 0.56 && localRatio <= 0.76) || suspiciousTightCluster);
}

assert.equal(
  narrowSpacingOutlier({
    current: 0.72,
    previous: 1.7,
    next: 1.6,
    left: { x: 10, y: 20, width: 18, height: 30 },
    right: { x: 30, y: 21, width: 17, height: 29 },
  }),
  false,
  "very tight spacing between similarly sized, strongly aligned masks should remain a plausible paired-window assembly",
);

assert.equal(
  narrowSpacingOutlier({
    current: 0.72,
    previous: 1.7,
    next: 1.6,
    left: { x: 10, y: 20, width: 18, height: 30 },
    right: { x: 30, y: 31, width: 9, height: 18 },
  }),
  true,
  "a very tight interval should be treated as suspicious when the neighboring masks do not share paired-assembly geometry",
);

assert.equal(
  narrowSpacingOutlier({
    current: 1.05,
    previous: 1.7,
    next: 1.55,
    left: { x: 10, y: 20, width: 18, height: 30 },
    right: { x: 35, y: 20, width: 18, height: 30 },
  }),
  true,
  "moderately narrow local spacing remains an outlier even when the two masks look similar",
);

console.log("geometry-aware paired-spacing ranking smoke passed");
