import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionNearSupportCappedFarHits/);
assert.match(source, /Math\.min\(\s*nextResumedHits,\s*nearestResumedHits \* 2\s*\)/);

function positionWeight(availableBins, nearestHits, nextHits) {
  if (availableBins < 2) return 1;
  const distanceWeight = 1 / 3;
  const cappedFarHits = Math.min(nextHits, nearestHits * 2);
  return Math.min(
    1,
    (nearestHits + cappedFarHits * distanceWeight) /
      Math.max(1, (nearestHits + nextHits) * ((1 + distanceWeight) / 2))
  );
}

assert.equal(positionWeight(1, 1, 20), 1, "one-bin edges should remain unaffected");
assert.equal(positionWeight(2, 2, 2), 1, "balanced resumed support should retain full authority");
assert.ok(
  positionWeight(2, 1, 8) < positionWeight(2, 2, 4),
  "a distant cluster should carry less authority when near-obstruction support is weak"
);
assert.ok(
  positionWeight(2, 1, 8) < 0.4,
  "one near hit must not let a large distant cluster validate the endpoint continuation"
);
assert.equal(positionWeight(2, 0, 8), 0, "far-only support must remain invalid");

console.log("near-support-gated short-edge endpoint evidence smoke passed");
