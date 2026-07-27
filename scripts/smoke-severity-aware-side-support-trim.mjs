import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function quality(samples) {
  if (!samples.length) return 1;
  const sorted = [...samples].sort((a, b) => a.residual - b.residual);
  const worst = sorted[sorted.length - 1];
  const distanceTrimConfidence = samples.length >= 4
    ? Math.max(0, Math.min(1, (worst.distance - 2) / 3))
    : 0;
  const severityRatio = Math.max(0, Math.min(1, worst.residual / residualLimit));
  const trimConfidence = distanceTrimConfidence * (1 - 0.65 * severityRatio);
  const residualSum = sorted.reduce((sum, sample) => {
    const weight = sample === worst ? 1 - trimConfidence : 1;
    return sum + sample.residual * weight;
  }, 0);
  const residualWeight = sorted.reduce((sum, sample) =>
    sum + (sample === worst ? 1 - trimConfidence : 1), 0);
  const mean = residualSum / Math.max(residualWeight, 1e-9);
  return 1 - 0.55 * Math.min(1, mean / residualLimit);
}

const cleanBase = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.012 },
  { distance: 4, residual: 0.013 },
  { distance: 5, residual: 0.014 },
];

function withResidual(distance, residual) {
  return cleanBase.map((sample) => ({
    ...sample,
    residual: sample.distance === distance ? residual : sample.residual,
  }));
}

const mildFar = quality(withResidual(5, Math.log(1.035)));
const severeFar = quality(withResidual(5, Math.log(1.095)));
const severeNear = quality(withResidual(2, Math.log(1.095)));
const mildNear = quality(withResidual(2, Math.log(1.035)));

assert.ok(mildFar > severeFar + 0.08,
  "a severe distant residual must retain materially more penalty than mild distant noise");
assert.ok(severeFar > severeNear,
  "distance should still matter after severity-aware trimming");
assert.ok(mildFar > mildNear,
  "mild distant noise should remain safer to discount than equally mild near-gap evidence");

const verySevereFar = quality(withResidual(5, residualLimit * 1.5));
assert.ok(verySevereFar < mildFar - 0.12,
  "extreme distant structural breaks must not be almost completely trimmed away");

const shortSupport = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.012 },
  { distance: 5, residual: Math.log(1.035) },
];
assert.ok(quality(shortSupport) < mildFar,
  "short support must not gain severity or distance trim confidence");

console.log("severity-aware side-support trim smoke passed");
