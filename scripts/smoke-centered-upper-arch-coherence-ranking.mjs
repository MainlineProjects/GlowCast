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
  const upperSamples = profile.map((value, index) => ({
    value,
    sin: Math.sin((Math.PI * 2 * index) / profile.length),
    cos: Math.cos((Math.PI * 2 * index) / profile.length),
  })).filter((sample) => sample.sin > 0.55);
  const lowerSamples = profile.map((value, index) => ({
    value,
    sin: Math.sin((Math.PI * 2 * index) / profile.length),
  })).filter((sample) => sample.sin < -0.55);
  const upperMean = upperSamples.reduce((sum, sample) => sum + sample.value, 0) / Math.max(1, upperSamples.length);
  const lowerMean = lowerSamples.reduce((sum, sample) => sum + sample.value, 0) / Math.max(1, lowerSamples.length);
  const upperLeft = upperSamples.filter((sample) => sample.cos < -0.25);
  const upperRight = upperSamples.filter((sample) => sample.cos > 0.25);
  const upperLeftMean = upperLeft.reduce((sum, sample) => sum + sample.value, 0) / Math.max(1, upperLeft.length);
  const upperRightMean = upperRight.reduce((sum, sample) => sum + sample.value, 0) / Math.max(1, upperRight.length);
  const verticalLocationBias = upperMean - lowerMean;
  const upperLateralImbalance = Math.abs(upperLeftMean - upperRightMean);
  const axisCoherent = Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25;
  const architectural = strength <= 0.08 || (
    axisCoherent
    && verticalLocationBias >= 0.06
    && upperLateralImbalance <= 0.12
  );
  return { strength, verticalLocationBias, upperLateralImbalance, axisCoherent, architectural };
}

const centeredArch = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.35 * Math.max(0, Math.sin(angle)) ** 2;
});
const centered = curvatureEvidence(centeredArch);
assert.ok(
  centered.strength > 0.08 && centered.verticalLocationBias >= 0.06 && centered.upperLateralImbalance <= 0.12 && centered.architectural,
  "a centered upper arch should retain paired-opening confidence",
);

const mildPerspectiveArch = centeredArch.map((value, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return value * (1 + 0.08 * Math.cos(angle));
});
const perspective = curvatureEvidence(mildPerspectiveArch);
assert.ok(
  perspective.upperLateralImbalance <= 0.12 && perspective.architectural,
  "mild perspective asymmetry should remain eligible for architectural confidence",
);

const offCenterUpperBulge = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  const upper = Math.max(0, Math.sin(angle)) ** 2;
  const lateral = 0.35 + Math.max(0, Math.cos(angle));
  return 0.7 * upper * lateral;
});
const offCenter = curvatureEvidence(offCenterUpperBulge);
assert.ok(
  offCenter.strength > 0.08 && offCenter.verticalLocationBias >= 0.06 && offCenter.upperLateralImbalance > 0.12 && !offCenter.architectural,
  "an off-center upper bulge should not inherit centered-arch confidence",
);

console.log("centered upper-arch coherence ranking smoke passed");
