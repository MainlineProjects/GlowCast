import assert from "node:assert/strict";

function sampledProfile(sampleCount, defectAngle = null, defectRadius = 1) {
  return Array.from({ length: sampleCount }, (_, index) => {
    const angle = (Math.PI * 2 * index) / sampleCount;
    if (defectAngle == null) return 1;
    const wrapped = Math.atan2(Math.sin(angle - defectAngle), Math.cos(angle - defectAngle));
    return Math.abs(wrapped) < Math.PI / 32 ? defectRadius : 1;
  });
}

function directionalResidual(leftContour, rightContour) {
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

const defectAngle = Math.PI / 8;
const coarseArchitectural = sampledProfile(8);
const coarseDefect = sampledProfile(8, defectAngle, 0.4);
const fineArchitectural = sampledProfile(16);
const fineDefect = sampledProfile(16, defectAngle, 0.4);

assert.equal(
  directionalResidual(coarseArchitectural, coarseDefect),
  0,
  "an eight-ray profile demonstrates the blind spot by missing a narrow defect between sampled directions",
);
assert.ok(
  directionalResidual(fineArchitectural, fineDefect) > 0.12,
  "a sixteen-ray profile should expose the same narrow localized defect to the taper-coherence guard",
);

const smoothArch = Array.from({ length: 16 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 16;
  const topBias = Math.max(0, Math.sin(angle));
  return 1 + topBias * 0.12;
});
assert.ok(
  directionalResidual(fineArchitectural, smoothArch) <= 0.12,
  "higher contour resolution should preserve a smooth shallow architectural arch",
);

console.log("high-resolution paired contour profile ranking smoke passed");
