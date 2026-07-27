import assert from "node:assert/strict";

function localityWeight(distance) {
  return 1 + (0.35 * Math.exp(-0.80 * Math.max(0, distance - 1)));
}

function approximatelyEqual(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`);
}

const adjacent = localityWeight(1);
const secondNeighbor = localityWeight(2);
const thirdNeighbor = localityWeight(3);
const distant = localityWeight(5);

approximatelyEqual(adjacent, 1.35, 1e-12,
  "immediately adjacent spacing evidence should retain the strongest established locality weight");
assert.ok(secondNeighbor < adjacent && secondNeighbor > 1.15,
  "second-neighbor evidence should matter less than adjacent evidence without an abrupt band change");
assert.ok(thirdNeighbor < secondNeighbor && thirdNeighbor > 1.06,
  "third-neighbor evidence should retain a smaller but nonzero locality influence");
assert.ok(distant < thirdNeighbor && distant < 1.02 && distant > 1,
  "distant support should smoothly approach neutral weighting rather than dropping abruptly to exactly one");

for (let distance = 1; distance < 8; distance += 1) {
  assert.ok(localityWeight(distance + 1) < localityWeight(distance),
    "locality weighting should decrease monotonically with distance from the suspected gap");
}

function spacingConsistency(ratio, distance) {
  const weightedResidual = Math.abs(Math.log(Math.max(ratio, 1e-6))) * localityWeight(distance);
  return Math.max(0, Math.min(1,
    1 - (weightedResidual / Math.log(1.10))
  ));
}

const sameNoiseAdjacent = spacingConsistency(1.05, 1);
const sameNoiseSecond = spacingConsistency(1.05, 2);
const sameNoiseThird = spacingConsistency(1.05, 3);
assert.ok(sameNoiseAdjacent < sameNoiseSecond && sameNoiseSecond < sameNoiseThird,
  "the same spacing error should reduce confidence progressively less as it moves away from the suspected gap");

console.log("continuous local perspective coherence smoke passed");
