import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function quality(samples) {
  if (!samples.length) return 1;
  const meanResidual = samples.reduce((sum, sample) => sum + sample.residual, 0) / samples.length;
  const normalizedResidual = Math.min(1, meanResidual / residualLimit);
  return 1 - 0.50 * normalizedResidual;
}

function adjustedDistance(distance, samples) {
  return 2 + Math.max(0, distance - 2) * quality(samples);
}

const exceptionallyCleanShortSide = [
  { residual: 0.008 },
  { residual: 0.012 },
  { residual: 0.010 },
  { residual: 0.014 },
];
const marginalLongSide = [
  { residual: Math.log(1.085) },
  { residual: Math.log(1.088) },
  { residual: Math.log(1.082) },
  { residual: Math.log(1.087) },
  { residual: Math.log(1.084) },
  { residual: Math.log(1.089) },
];

const cleanShortScore = adjustedDistance(5, exceptionallyCleanShortSide);
const marginalLongScore = adjustedDistance(7, marginalLongSide);
assert.ok(cleanShortScore > marginalLongScore,
  "a shorter exceptionally coherent side should outrank a longer marginal side");

const cleanLongSide = [
  { residual: 0.010 },
  { residual: 0.011 },
  { residual: 0.012 },
  { residual: 0.010 },
  { residual: 0.013 },
  { residual: 0.012 },
];
assert.ok(adjustedDistance(7, cleanLongSide) > cleanShortScore,
  "a genuinely long and coherent side should still retain the strongest support");

assert.equal(adjustedDistance(2, marginalLongSide), 2,
  "the short-facade safety floor must remain unchanged by quality adjustment");

const moderateSide = [
  { residual: Math.log(1.035) },
  { residual: Math.log(1.040) },
  { residual: Math.log(1.038) },
  { residual: Math.log(1.042) },
];
const moderateScore = adjustedDistance(5, moderateSide);
assert.ok(moderateScore > 3.5 && moderateScore < 5,
  "moderately coherent evidence should retain partial, bounded distance credit");

console.log("quality-balanced side support smoke passed");
