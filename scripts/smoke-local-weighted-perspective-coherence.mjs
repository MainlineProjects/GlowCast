import assert from "node:assert/strict";

function weightedSpacingConsistency(samples) {
  const supportResiduals = samples.map(({ ratio, distance }) => ({
    residual: Math.abs(Math.log(Math.max(ratio, 1e-6))),
    distance,
  }));

  let trimmedIndex = -1;
  if (supportResiduals.length >= 3) {
    let largestDistantResidual = -1;
    supportResiduals.forEach((sample, index) => {
      if (sample.distance <= 1) return;
      if (sample.residual > largestDistantResidual) {
        largestDistantResidual = sample.residual;
        trimmedIndex = index;
      }
    });
  }

  const weightedResiduals = supportResiduals
    .filter((_, index) => index !== trimmedIndex)
    .map((sample) => {
      const localityWeight = sample.distance <= 1
        ? 1.35
        : (sample.distance === 2 ? 1.15 : 1);
      return sample.residual * localityWeight;
    });

  const supportConsistencyResidual = Math.max(0, ...weightedResiduals);
  return Math.max(0, Math.min(1,
    1 - (supportConsistencyResidual / Math.log(1.10))
  ));
}

function weightedPerspectiveStrength(robustSlope, samples) {
  return Math.min(1, Math.abs(robustSlope) / 0.18) * weightedSpacingConsistency(samples);
}

const clean = weightedPerspectiveStrength(0.18, [
  { ratio: 1.00, distance: 1 },
  { ratio: 1.01, distance: 2 },
  { ratio: 0.99, distance: 3 },
]);
assert.ok(clean > 0.86,
  "clean support near and far from the candidate should retain strong perspective confidence");

const adjacentNoise = weightedPerspectiveStrength(0.18, [
  { ratio: 1.07, distance: 1 },
  { ratio: 1.00, distance: 2 },
  { ratio: 1.00, distance: 3 },
]);
assert.ok(adjacentNoise < 0.08,
  "a materially inconsistent interval beside the suspected gap should sharply reduce perspective confidence");

const distantNoise = weightedPerspectiveStrength(0.18, [
  { ratio: 1.00, distance: 1 },
  { ratio: 1.00, distance: 2 },
  { ratio: 1.30, distance: 4 },
]);
assert.ok(distantNoise > 0.99,
  "one isolated distant spacing outlier should still be trimmed from an otherwise clean perspective trend");

const mediumLocalNoise = weightedPerspectiveStrength(0.18, [
  { ratio: 1.00, distance: 1 },
  { ratio: 1.07, distance: 2 },
  { ratio: 1.00, distance: 4 },
]);
assert.ok(mediumLocalNoise > adjacentNoise && mediumLocalNoise < 0.25,
  "second-neighbor inconsistency should matter, but less than immediately adjacent inconsistency");

const flat = weightedPerspectiveStrength(0, [
  { ratio: 1.08, distance: 1 },
  { ratio: 1.00, distance: 2 },
  { ratio: 1.00, distance: 3 },
]);
assert.equal(flat, 0, "spacing locality alone must not create perspective confidence");

console.log("local-weighted perspective coherence smoke passed");
