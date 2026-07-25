import assert from "node:assert/strict";

function directionalTaperResidual(leftContour, rightContour) {
  const ratios = leftContour.map((leftRadius, index) => {
    const rightRadius = rightContour[index];
    if (leftRadius <= 0 || rightRadius <= 0) return 0;
    return Math.log(Math.max(rightRadius, 0.01) / Math.max(leftRadius, 0.01));
  });
  const mean = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  const directionalCos = ratios.reduce((sum, value, index) => (
    sum + (value - mean) * Math.cos((Math.PI * 2 * index) / ratios.length)
  ), 0) * 2 / ratios.length;
  const directionalSin = ratios.reduce((sum, value, index) => (
    sum + (value - mean) * Math.sin((Math.PI * 2 * index) / ratios.length)
  ), 0) * 2 / ratios.length;
  return Math.sqrt(ratios.reduce((sum, value, index) => {
    const angle = (Math.PI * 2 * index) / ratios.length;
    const expected = mean + directionalCos * Math.cos(angle) + directionalSin * Math.sin(angle);
    return sum + (value - expected) ** 2;
  }, 0) / ratios.length);
}

const architecturalOpening = [1, 1, 1, 1, 1, 1, 1, 1];
const smoothlyTaperedOpening = [1.16, 1.12, 1, 0.9, 0.86, 0.9, 1, 1.12];
const localizedDent = [1, 1, 1, 0.58, 1, 1, 1, 1];

assert.ok(
  directionalTaperResidual(architecturalOpening, smoothlyTaperedOpening) <= 0.12,
  "smooth perspective taper should remain a coherent paired architectural contour",
);
assert.ok(
  directionalTaperResidual(architecturalOpening, localizedDent) > 0.12,
  "a localized one-sided dent should not masquerade as smooth architectural taper",
);
const forwardResidual = directionalTaperResidual(architecturalOpening, smoothlyTaperedOpening);
const reverseResidual = directionalTaperResidual(smoothlyTaperedOpening, architecturalOpening);
assert.ok(
  Math.abs(forwardResidual - reverseResidual) < 1e-12,
  "directional taper coherence should be order-independent within floating-point tolerance",
);

console.log("directional taper contour coherence ranking smoke passed");
