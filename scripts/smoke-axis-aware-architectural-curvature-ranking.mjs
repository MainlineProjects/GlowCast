import assert from "node:assert/strict";

function curvatureEvidence(profile) {
  const mean = profile.reduce((sum, value) => sum + value, 0) / profile.length;
  const directionalCos = profile.reduce((sum, value, index) => (
    sum + (value - mean) * Math.cos((Math.PI * 2 * index) / profile.length)
  ), 0) * 2 / profile.length;
  const directionalSin = profile.reduce((sum, value, index) => (
    sum + (value - mean) * Math.sin((Math.PI * 2 * index) / profile.length)
  ), 0) * 2 / profile.length;
  const curvatureCos = profile.reduce((sum, value, index) => (
    sum + (value - mean) * Math.cos((Math.PI * 4 * index) / profile.length)
  ), 0) * 2 / profile.length;
  const curvatureSin = profile.reduce((sum, value, index) => (
    sum + (value - mean) * Math.sin((Math.PI * 4 * index) / profile.length)
  ), 0) * 2 / profile.length;
  const curvatureStrength = Math.hypot(curvatureCos, curvatureSin);
  const residual = Math.sqrt(profile.reduce((sum, value, index) => {
    const angle = (Math.PI * 2 * index) / profile.length;
    const expected = mean
      + directionalCos * Math.cos(angle)
      + directionalSin * Math.sin(angle)
      + curvatureCos * Math.cos(angle * 2)
      + curvatureSin * Math.sin(angle * 2);
    return sum + (value - expected) ** 2;
  }, 0) / profile.length);
  const axisCoherent = curvatureStrength <= 0.08 || Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25;
  return { curvatureStrength, residual, axisCoherent };
}

const shallowArchitecturalArch = Array.from({ length: 16 }, (_, index) => (
  0.18 * Math.cos((Math.PI * 4 * index) / 16)
));
const archEvidence = curvatureEvidence(shallowArchitecturalArch);
assert.ok(
  archEvidence.residual <= 0.12 && archEvidence.curvatureStrength <= 0.22 && archEvidence.axisCoherent,
  "principal-axis shallow architectural curvature should remain eligible for paired-opening confidence",
);

const diagonalSmoothBlob = Array.from({ length: 16 }, (_, index) => (
  0.18 * Math.sin((Math.PI * 4 * index) / 16)
));
const blobEvidence = curvatureEvidence(diagonalSmoothBlob);
assert.ok(
  blobEvidence.residual <= 0.12 && blobEvidence.curvatureStrength <= 0.22 && !blobEvidence.axisCoherent,
  "smooth diagonal curvature should no longer masquerade as an axis-aligned architectural arch",
);

const mildDiagonalPerspectiveNoise = Array.from({ length: 16 }, (_, index) => (
  0.05 * Math.sin((Math.PI * 4 * index) / 16)
));
const mildEvidence = curvatureEvidence(mildDiagonalPerspectiveNoise);
assert.ok(
  mildEvidence.curvatureStrength <= 0.08 && mildEvidence.axisCoherent,
  "small diagonal contour drift should remain tolerated rather than overfitting the architectural-axis guard",
);

console.log("axis-aware architectural curvature ranking smoke passed");
