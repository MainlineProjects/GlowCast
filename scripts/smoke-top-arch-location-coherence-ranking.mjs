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
  const positiveVerticalSamples = profile.filter((_, index) => (
    Math.sin((Math.PI * 2 * index) / profile.length) > 0.55
  ));
  const negativeVerticalSamples = profile.filter((_, index) => (
    Math.sin((Math.PI * 2 * index) / profile.length) < -0.55
  ));
  const verticalLocationBias = (
    positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / positiveVerticalSamples.length
    - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / negativeVerticalSamples.length
  );
  const axisCoherent = Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25;
  const architectural = strength <= 0.08 || (axisCoherent && verticalLocationBias >= 0.06);
  return { strength, verticalLocationBias, axisCoherent, architectural };
}

const topArch = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.35 * Math.max(0, Math.sin(angle)) ** 2;
});
const topEvidence = curvatureEvidence(topArch);
assert.ok(
  topEvidence.strength > 0.08 && topEvidence.axisCoherent && topEvidence.verticalLocationBias >= 0.06 && topEvidence.architectural,
  "a smooth upper arch should remain eligible for paired-opening confidence",
);

const lowerBulge = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.35 * Math.max(0, -Math.sin(angle)) ** 2;
});
const lowerEvidence = curvatureEvidence(lowerBulge);
assert.ok(
  lowerEvidence.strength > 0.08 && lowerEvidence.axisCoherent && lowerEvidence.verticalLocationBias <= -0.06 && !lowerEvidence.architectural,
  "a smooth lower-localized bulge should not inherit upper-arch architectural confidence",
);

const sideBulge = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.35 * Math.max(0, Math.cos(angle)) ** 2;
});
const sideEvidence = curvatureEvidence(sideBulge);
assert.ok(
  sideEvidence.strength > 0.08 && sideEvidence.verticalLocationBias < 0.06 && !sideEvidence.architectural,
  "a side-localized smooth bulge should remain below the architectural curvature threshold",
);

console.log("top-arch location coherence ranking smoke passed");
