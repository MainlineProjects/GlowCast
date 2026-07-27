import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function quality(samples) {
  if (!samples.length) return 1;
  const sorted = [...samples].sort((a, b) => a.residual - b.residual);
  const worst = sorted[sorted.length - 1];
  const trimConfidence = samples.length >= 4
    ? Math.max(0, Math.min(1, (worst.distance - 2) / 3))
    : 0;
  const robustResidualSum = sorted.reduce((sum, sample) => {
    const weight = sample === worst ? 1 - trimConfidence : 1;
    return sum + sample.residual * weight;
  }, 0);
  const robustWeight = sorted.reduce((sum, sample) => {
    return sum + (sample === worst ? 1 - trimConfidence : 1);
  }, 0);
  const mean = robustResidualSum / Math.max(robustWeight, 1e-9);
  return 1 - 0.55 * Math.min(1, mean / residualLimit);
}

const base = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.012 },
  { distance: 4, residual: 0.013 },
  { distance: 5, residual: 0.014 },
];

function withSpike(distance) {
  return base.map((sample) => ({
    ...sample,
    residual: sample.distance === distance ? Math.log(1.095) : sample.residual,
  }));
}

const adjacent = quality(withSpike(1));
const secondNeighbor = quality(withSpike(2));
const distanceThree = quality(withSpike(3));
const distanceFour = quality(withSpike(4));
const distanceFive = quality(withSpike(5));

assert.ok(distanceThree > secondNeighbor,
  "distance-three residual spikes should be discounted slightly more than near-gap spikes");
assert.ok(distanceFour > distanceThree,
  "distance-four residual spikes should be safer to discount than distance-three spikes");
assert.ok(distanceFive > distanceFour,
  "far residual spikes should receive the strongest trim confidence");
assert.ok(secondNeighbor < distanceFive - 0.05,
  "near-gap residual evidence must remain materially more influential than far noise");
assert.ok(Math.abs(adjacent - secondNeighbor) < 0.025,
  "adjacent and second-neighbor spikes should both remain effectively untrimmed");

const shortSupport = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.012 },
  { distance: 5, residual: Math.log(1.095) },
];
assert.ok(quality(shortSupport) < distanceFive,
  "short support must not gain trim confidence merely because its noisy sample is distant");

console.log("graduated side-support trim-confidence smoke passed");
