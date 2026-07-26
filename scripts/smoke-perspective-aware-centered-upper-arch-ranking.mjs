import assert from "node:assert/strict";

function curvatureEvidence(profile) {
  const mean = profile.reduce((sum, value) => sum + value, 0) / profile.length;
  const curvatureCos = profile.reduce((sum, value, index) => (
    sum + (value - mean) * Math.cos((Math.PI * 4 * index) / profile.length)
  ), 0) * 2 / profile.length;
  const curvatureSin = profile.reduce((sum, value, index) => (
    sum + (value - mean) * Math.sin((Math.PI * 4 * index) / profile.length)
  ), 0) * 2 / profile.length;
  const strength = Math.hypot(curvatureCos, curvatureSin);

  const samples = profile.map((value, index) => {
    const angle = (Math.PI * 2 * index) / profile.length;
    return { value, sin: Math.sin(angle), cos: Math.cos(angle) };
  });
  const upper = samples.filter((sample) => sample.sin > 0.55);
  const lower = samples.filter((sample) => sample.sin < -0.55);
  const meanOf = (items) => items.reduce((sum, sample) => sum + sample.value, 0) / Math.max(1, items.length);
  const upperMean = meanOf(upper);
  const lowerMean = meanOf(lower);
  const upperLeftMean = meanOf(upper.filter((sample) => sample.cos < -0.25));
  const upperRightMean = meanOf(upper.filter((sample) => sample.cos > 0.25));
  const lowerLeftMean = meanOf(lower.filter((sample) => sample.cos < -0.25));
  const lowerRightMean = meanOf(lower.filter((sample) => sample.cos > 0.25));

  const verticalLocationBias = upperMean - lowerMean;
  const upperLateralSigned = upperLeftMean - upperRightMean;
  const lowerLateralSigned = lowerLeftMean - lowerRightMean;
  const upperLateralImbalance = Math.abs(upperLateralSigned);
  const perspectiveLateralCoherence = (
    Math.abs(lowerLateralSigned) >= 0.04
    && upperLateralSigned * lowerLateralSigned > 0
    && Math.abs(upperLateralSigned - lowerLateralSigned) <= 0.08
  );
  const axisCoherent = Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25;
  const architectural = strength <= 0.08 || (
    axisCoherent
    && verticalLocationBias >= 0.06
    && (upperLateralImbalance <= 0.12 || perspectiveLateralCoherence)
  );

  return {
    strength,
    verticalLocationBias,
    upperLateralImbalance,
    upperLateralSigned,
    lowerLateralSigned,
    perspectiveLateralCoherence,
    axisCoherent,
    architectural,
  };
}

const centeredArch = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.35 * Math.max(0, Math.sin(angle)) ** 2;
});
const centered = curvatureEvidence(centeredArch);
assert.ok(centered.architectural, "a centered upper arch should remain architectural");

const obliquePerspectiveArch = centeredArch.map((value, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return value + 0.15 * Math.cos(angle);
});
const oblique = curvatureEvidence(obliquePerspectiveArch);
assert.ok(
  oblique.upperLateralImbalance > 0.12 && oblique.perspectiveLateralCoherence && oblique.architectural,
  "a centered arch under coherent whole-opening perspective skew should retain paired-opening confidence",
);

const oneCornerBulge = centeredArch.map((value, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  const upper = Math.max(0, Math.sin(angle)) ** 2;
  const upperRight = Math.max(0, Math.cos(angle)) * upper;
  return value + 0.5 * upperRight;
});
const corner = curvatureEvidence(oneCornerBulge);
assert.ok(
  corner.upperLateralImbalance > 0.12 && !corner.perspectiveLateralCoherence && !corner.architectural,
  "a one-corner upper bulge should stay rejected because its lateral shift is not shared by the lower contour",
);

const oppositeSkewBulge = centeredArch.map((value, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  const upper = Math.max(0, Math.sin(angle)) ** 2;
  return value + 0.45 * Math.max(0, Math.cos(angle)) * upper - 0.08 * Math.cos(angle);
});
const opposite = curvatureEvidence(oppositeSkewBulge);
assert.ok(
  !opposite.perspectiveLateralCoherence,
  "opposite upper/lower lateral shifts must not be mistaken for coherent perspective",
);

console.log("perspective-aware centered upper-arch ranking smoke passed");
