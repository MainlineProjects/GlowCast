import assert from "node:assert/strict";

function radialSimilarity(leftRadius, rightRadius) {
  if (leftRadius <= 0 && rightRadius <= 0) return 1;
  if (leftRadius <= 0 || rightRadius <= 0) return 0;
  return Math.min(leftRadius, rightRadius) / Math.max(leftRadius, rightRadius, 0.01);
}

function adjacentContourSimilarity(sourceContour, targetContour) {
  return sourceContour.reduce((sum, sourceRadius, index) => {
    const previous = targetContour[(index + targetContour.length - 1) % targetContour.length];
    const current = targetContour[index];
    const next = targetContour[(index + 1) % targetContour.length];
    return sum + Math.max(
      radialSimilarity(sourceRadius, previous),
      radialSimilarity(sourceRadius, current),
      radialSimilarity(sourceRadius, next),
    );
  }, 0) / sourceContour.length;
}

function directContourSimilarity(leftContour, rightContour) {
  return leftContour.reduce((sum, leftRadius, index) => (
    sum + radialSimilarity(leftRadius, rightContour[index])
  ), 0) / leftContour.length;
}

function contourSimilarity(leftContour, rightContour, bidirectional) {
  const direct = directContourSimilarity(leftContour, rightContour);
  const leftToRight = adjacentContourSimilarity(leftContour, rightContour);
  const rightToLeft = adjacentContourSimilarity(rightContour, leftContour);
  const perspective = bidirectional ? Math.min(leftToRight, rightToLeft) : leftToRight;
  return direct * 0.75 + perspective * 0.25;
}

const architecturalOpening = [1, 1, 1, 1, 1, 1, 1, 1];
const mildPerspectiveOpening = [0.96, 1, 1, 1, 0.96, 1, 1, 1];
const alternatingRadialFragment = [1, 0.6, 1, 0.6, 1, 0.6, 1, 0.6];

assert.ok(
  contourSimilarity(architecturalOpening, mildPerspectiveOpening, true) >= 0.82,
  "bidirectional contour tolerance should preserve a mildly distorted architectural pair",
);

assert.ok(
  contourSimilarity(architecturalOpening, alternatingRadialFragment, false) >= 0.82,
  "regression fixture should expose the overly generous one-way adjacent-ray match",
);

assert.ok(
  contourSimilarity(architecturalOpening, alternatingRadialFragment, true) < 0.82,
  "paired contours should fail when only one comparison direction supports the perspective match",
);

assert.equal(
  contourSimilarity(architecturalOpening, alternatingRadialFragment, true),
  contourSimilarity(alternatingRadialFragment, architecturalOpening, true),
  "bidirectional perspective contour similarity should be order-independent",
);

console.log("bidirectional perspective contour-profile ranking smoke passed");
