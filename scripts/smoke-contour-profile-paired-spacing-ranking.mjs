import assert from "node:assert/strict";

function normalizedContourProfile(candidate) {
  const centerX = candidate.box.x + candidate.box.width / 2;
  const centerY = candidate.box.y + candidate.box.height / 2;
  const halfWidth = Math.max(candidate.box.width / 2, 0.01);
  const halfHeight = Math.max(candidate.box.height / 2, 0.01);
  const normalizedPoints = candidate.points.map((point) => ({
    x: (point.x - centerX) / halfWidth,
    y: (point.y - centerY) / halfHeight,
  }));

  return Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 8;
    const rayX = Math.cos(angle);
    const rayY = Math.sin(angle);
    let nearest = Number.POSITIVE_INFINITY;

    for (let pointIndex = 0; pointIndex < normalizedPoints.length; pointIndex += 1) {
      const start = normalizedPoints[pointIndex];
      const end = normalizedPoints[(pointIndex + 1) % normalizedPoints.length];
      const segmentX = end.x - start.x;
      const segmentY = end.y - start.y;
      const denominator = rayX * segmentY - rayY * segmentX;
      if (Math.abs(denominator) < 0.000001) continue;

      const rayDistance = (start.x * segmentY - start.y * segmentX) / denominator;
      const segmentFraction = (start.x * rayY - start.y * rayX) / denominator;
      if (rayDistance >= 0 && segmentFraction >= 0 && segmentFraction <= 1) {
        nearest = Math.min(nearest, rayDistance);
      }
    }

    return Number.isFinite(nearest) ? nearest : 0;
  });
}

function contourProfileSimilarity(left, right) {
  const leftProfile = normalizedContourProfile(left);
  const rightProfile = normalizedContourProfile(right);
  return leftProfile.reduce((sum, leftRadius, index) => {
    const rightRadius = rightProfile[index];
    if (leftRadius <= 0 && rightRadius <= 0) return sum + 1;
    if (leftRadius <= 0 || rightRadius <= 0) return sum;
    return sum + Math.min(leftRadius, rightRadius) / Math.max(leftRadius, rightRadius, 0.01);
  }, 0) / leftProfile.length;
}

const rectangle = {
  box: { x: 0, y: 0, width: 20, height: 30 },
  points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 30 }, { x: 0, y: 30 }],
};
const chamferedWindow = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 24, y: 2 }, { x: 26, y: 0 }, { x: 42, y: 0 }, { x: 44, y: 2 }, { x: 44, y: 28 }, { x: 42, y: 30 }, { x: 26, y: 30 }, { x: 24, y: 28 }],
};
const deeplyNotchedFragment = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 24, y: 0 }, { x: 44, y: 0 }, { x: 44, y: 30 }, { x: 36, y: 30 }, { x: 36, y: 12 }, { x: 32, y: 12 }, { x: 32, y: 30 }, { x: 24, y: 30 }],
};
const shallowArch = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 24, y: 30 }, { x: 24, y: 10 }, { x: 26, y: 5 }, { x: 30, y: 1 }, { x: 34, y: 0 }, { x: 38, y: 1 }, { x: 42, y: 5 }, { x: 44, y: 10 }, { x: 44, y: 30 }],
};

assert.ok(
  contourProfileSimilarity(rectangle, chamferedWindow) >= 0.82,
  "minor corner chamfers should remain contour-compatible with a rectangular architectural opening",
);
assert.ok(
  contourProfileSimilarity(rectangle, shallowArch) >= 0.82,
  "a smooth shallow architectural arch should remain close enough to a rectangular opening to avoid false rejection",
);
assert.ok(
  contourProfileSimilarity(rectangle, deeplyNotchedFragment) < 0.82,
  "a similarly filled but deeply notched fragment should not masquerade as a coherent paired opening",
);

console.log("contour-profile paired-spacing ranking smoke passed");
