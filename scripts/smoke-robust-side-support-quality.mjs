import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function quality(residuals) {
  if (!residuals.length) return 1;
  const sorted = [...residuals].sort((a, b) => a - b);
  const robust = residuals.length >= 4 ? sorted.slice(0, -1) : sorted;
  const mean = robust.reduce((sum, residual) => sum + residual, 0) / robust.length;
  return 1 - 0.55 * Math.min(1, mean / residualLimit);
}

const clean = [0.009, 0.011, 0.010, 0.012, 0.013];
const oneSpike = [0.009, 0.011, 0.010, 0.012, Math.log(1.095)];
assert.ok(Math.abs(quality(clean) - quality(oneSpike)) < 0.02,
  "one isolated residual spike should not erase otherwise strong side-support quality");

const sustainedMarginal = [
  Math.log(1.070),
  Math.log(1.075),
  Math.log(1.072),
  Math.log(1.078),
  Math.log(1.074),
];
assert.ok(quality(sustainedMarginal) < quality(oneSpike) - 0.20,
  "sustained marginal support must still lose substantial quality credit");

const shortNoisy = [0.010, 0.012, Math.log(1.095)];
assert.ok(quality(shortNoisy) < quality(oneSpike),
  "short support sets must not trim away their only noisy sample");

const twoSpikes = [0.010, 0.012, 0.011, Math.log(1.085), Math.log(1.095)];
assert.ok(quality(twoSpikes) < quality(oneSpike) - 0.08,
  "the one-sample trim must not hide two noisy support residuals");

console.log("robust side-support quality smoke passed");
