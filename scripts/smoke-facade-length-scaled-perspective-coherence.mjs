import assert from "node:assert/strict";

function localityDecay(maxSupportDistance) {
  return 0.80 * Math.sqrt(2 / Math.max(2, maxSupportDistance));
}

function localityWeight(distance, maxSupportDistance) {
  return 1 + (0.35 * Math.exp(-localityDecay(maxSupportDistance) * Math.max(0, distance - 1)));
}

const shortAdjacent = localityWeight(1, 2);
const shortSecond = localityWeight(2, 2);
const longAdjacent = localityWeight(1, 6);
const longSecond = localityWeight(2, 6);
const longFourth = localityWeight(4, 6);
const shortFourth = localityWeight(4, 2);

assert.ok(Math.abs(shortAdjacent - 1.35) <= 1e-12,
  "short facade groups should retain the established strongest adjacent locality weight");
assert.ok(Math.abs(longAdjacent - 1.35) <= 1e-12,
  "long facade groups should retain the same strongest adjacent locality weight");
assert.ok(shortSecond < shortAdjacent,
  "short facade evidence should still fall off with distance");
assert.ok(longSecond < longAdjacent,
  "long facade evidence should still fall off with distance");
assert.ok(longFourth > shortFourth,
  "long facade groups should retain more useful distant perspective evidence than short groups");
assert.ok(longFourth < longSecond,
  "even on long facade groups, locality influence should remain monotonic with distance");
assert.ok(localityDecay(6) < localityDecay(2),
  "long facade groups should use a gentler locality decay than short groups");

for (const span of [2, 3, 4, 6, 8]) {
  let previous = localityWeight(1, span);
  for (let distance = 2; distance <= span + 2; distance += 1) {
    const current = localityWeight(distance, span);
    assert.ok(current < previous,
      `locality weighting should decrease monotonically for facade span ${span}`);
    assert.ok(current > 1,
      `locality weighting should approach neutral without dropping below one for facade span ${span}`);
    previous = current;
  }
}

console.log("facade-length-scaled perspective coherence smoke passed");
