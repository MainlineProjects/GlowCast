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
  const verticalLocationBias = Math.abs(
    positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / positiveVerticalSamples.length
    - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / negativeVerticalSamples.length
  );
  const axisCoherent = Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25;
  const architectural = strength <= 0.08 || (axisCoherent && verticalLocationBias >= 0.06);
  return { strength, verticalLocationBias, axisCoherent, architectural };
}

const topArchedOpening = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.35 * Math.max(0, Math.sin(angle)) ** 2;
});
const archEvidence = curvatureEvidence(topArchedOpening);
assert.ok(
  archEvidence.strength > 0.08 && archEvidence.axisCoherent && archEvidence.verticalLocationBias >= 0.06 && archEvidence.architectural,
  "a smooth top-localized arch should remain eligible for paired-opening confidence",
);

const symmetricSmoothBulge = Array.from({ length: 16 }, (_, index) => (
  0.18 * Math.cos((Math.PI * 4 * index) / 16)
));
const bulgeEvidence = curvatureEvidence(symmetricSmoothBulge);
assert.ok(
  bulgeEvidence.strength > 0.08 && bulgeEvidence.axisCoherent && bulgeEvidence.verticalLocationBias < 0.06 && !bulgeEvidence.architectural,
  "a smooth but vertically unlocated symmetric bulge should no longer inherit architectural curvature confidence",
);

const taperedFrame = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  return 0.13 * Math.sin(angle) + 0.12 * Math.cos(angle * 2);
});
const taperEvidence = curvatureEvidence(taperedFrame);
assert.ok(
  taperEvidence.strength > 0.08 && taperEvidence.verticalLocationBias >= 0.06 && taperEvidence.architectural,
  "smooth perspective taper with axis-coherent curvature should remain eligible",
);

console.log("location-aware architectural curvature ranking smoke passed");
