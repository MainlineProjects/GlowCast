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

  const firstOrderResidual = Math.sqrt(profile.reduce((sum, value, index) => {
    const angle = (Math.PI * 2 * index) / profile.length;
    const expected = mean + directionalCos * Math.cos(angle) + directionalSin * Math.sin(angle);
    return sum + (value - expected) ** 2;
  }, 0) / profile.length);

  const curvatureResidual = Math.sqrt(profile.reduce((sum, value, index) => {
    const angle = (Math.PI * 2 * index) / profile.length;
    const expected = mean
      + directionalCos * Math.cos(angle)
      + directionalSin * Math.sin(angle)
      + curvatureCos * Math.cos(angle * 2)
      + curvatureSin * Math.sin(angle * 2);
    return sum + (value - expected) ** 2;
  }, 0) / profile.length);

  return {
    firstOrderResidual,
    curvatureResidual,
    curvatureStrength: Math.hypot(curvatureCos, curvatureSin),
  };
}

const smoothShallowArch = Array.from({ length: 16 }, (_, index) => (
  0.18 * Math.cos((Math.PI * 4 * index) / 16)
));
const archEvidence = curvatureEvidence(smoothShallowArch);
assert.ok(
  archEvidence.firstOrderResidual > 0.12,
  "the previous first-order taper model should demonstrate the shallow-arch false rejection",
);
assert.ok(
  archEvidence.curvatureResidual <= 0.12 && archEvidence.curvatureStrength <= 0.22,
  "bounded second-order curvature should preserve a smooth shallow architectural arch",
);

const localizedDent = Array.from({ length: 16 }, () => 0);
localizedDent[3] = -0.7;
const dentEvidence = curvatureEvidence(localizedDent);
assert.ok(
  dentEvidence.curvatureResidual > 0.12,
  "a localized contour dent should remain too irregular after smooth-curvature modeling",
);

const excessiveBulge = Array.from({ length: 16 }, (_, index) => (
  0.3 * Math.cos((Math.PI * 4 * index) / 16)
));
const bulgeEvidence = curvatureEvidence(excessiveBulge);
assert.ok(
  bulgeEvidence.curvatureResidual <= 0.12 && bulgeEvidence.curvatureStrength > 0.22,
  "strong smooth curvature should still be bounded rather than broadly accepted as an architectural pair",
);

console.log("smooth architectural contour curvature ranking smoke passed");
