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

function radialSimilarity(leftRadius, rightRadius) {
  if (leftRadius <= 0 && rightRadius <= 0) return 1;
  if (leftRadius <= 0 || rightRadius <= 0) return 0;
  return Math.min(leftRadius, rightRadius) / Math.max(leftRadius, rightRadius, 0.01);
}

function perspectiveTolerantSimilarity(left, right) {
  const leftProfile = normalizedContourProfile(left);
  const rightProfile = normalizedContourProfile(right);
  const direct = leftProfile.reduce((sum, leftRadius, index) => (
    sum + radialSimilarity(leftRadius, rightProfile[index])
  ), 0) / leftProfile.length;
  const perspective = leftProfile.reduce((sum, leftRadius, index) => {
    const previous = rightProfile[(index + rightProfile.length - 1) % rightProfile.length];
    const current = rightProfile[index];
    const next = rightProfile[(index + 1) % rightProfile.length];
    return sum + Math.max(
      radialSimilarity(leftRadius, previous),
      radialSimilarity(leftRadius, current),
      radialSimilarity(leftRadius, next),
    );
  }, 0) / leftProfile.length;
  return direct * 0.75 + perspective * 0.25;
}

const rectangle = {
  box: { x: 0, y: 0, width: 20, height: 30 },
  points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 30 }, { x: 0, y: 30 }],
};
const perspectiveWindow = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 26, y: 0 }, { x: 37, y: 0 }, { x: 42, y: 30 }, { x: 24, y: 30 }],
};
const deeplyNotchedFragment = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 24, y: 0 }, { x: 44, y: 0 }, { x: 44, y: 30 }, { x: 36, y: 30 }, { x: 36, y: 12 }, { x: 32, y: 12 }, { x: 32, y: 30 }, { x: 24, y: 30 }],
};

assert.ok(
  perspectiveTolerantSimilarity(rectangle, perspectiveWindow) >= 0.82,
  "a mildly perspective-skewed architectural opening should remain contour-compatible",
);
assert.ok(
  perspectiveTolerantSimilarity(rectangle, deeplyNotchedFragment) < 0.82,
  "limited angular tolerance must not make deeply notched clutter look like a paired opening",
);

console.log("perspective-tolerant contour-profile ranking smoke passed");
