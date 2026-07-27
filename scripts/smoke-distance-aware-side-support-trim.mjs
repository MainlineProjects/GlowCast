import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function quality(samples) {
  if (!samples.length) return 1;
  const sorted = [...samples].sort((a, b) => a.residual - b.residual);
  const worst = sorted[sorted.length - 1];
  const canTrimWorst = samples.length >= 4 && worst.distance >= 3;
  const robust = canTrimWorst ? sorted.slice(0, -1) : sorted;
  const mean = robust.reduce((sum, sample) => sum + sample.residual, 0) / robust.length;
  return 1 - 0.55 * Math.min(1, mean / residualLimit);
}

const clean = [
  { distance: 1, residual: 0.009 },
  { distance: 2, residual: 0.011 },
  { distance: 3, residual: 0.010 },
  { distance: 4, residual: 0.012 },
  { distance: 5, residual: 0.013 },
];

const distantSpike = clean.map((sample) => ({ ...sample }));
distantSpike[4].residual = Math.log(1.095);
assert.ok(Math.abs(quality(clean) - quality(distantSpike)) < 0.02,
  "an isolated residual spike far from the suspected gap should remain trimmable");

const adjacentSpike = clean.map((sample) => ({ ...sample }));
adjacentSpike[0].residual = Math.log(1.095);
assert.ok(quality(adjacentSpike) < quality(distantSpike) - 0.07,
  "an equally large adjacent residual must reduce side quality instead of being discarded");

const secondNeighborSpike = clean.map((sample) => ({ ...sample }));
secondNeighborSpike[1].residual = Math.log(1.095);
assert.ok(quality(secondNeighborSpike) < quality(distantSpike) - 0.05,
  "second-neighbor noise should remain meaningful local evidence");

const twoDistantSpikes = clean.map((sample) => ({ ...sample }));
twoDistantSpikes[3].residual = Math.log(1.085);
twoDistantSpikes[4].residual = Math.log(1.095);
assert.ok(quality(twoDistantSpikes) < quality(distantSpike) - 0.08,
  "trimming one distant spike must not hide sustained distant incoherence");

const shortSupport = [
  { distance: 1, residual: 0.010 },
  { distance: 2, residual: 0.012 },
  { distance: 4, residual: Math.log(1.095) },
];
assert.ok(quality(shortSupport) < quality(distantSpike),
  "short support sets must never trim away their only noisy residual");

console.log("distance-aware side-support trimming smoke passed");
