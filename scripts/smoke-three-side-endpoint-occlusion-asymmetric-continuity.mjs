import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionAsymmetricContinuityDensity/);
assert.match(source, /nearOcclusionPenalty = offset === 1 \? 1\.6 : offset === 2 \? 1\.2 : 1/);
assert.match(source, /supportRatio \*\* nearOcclusionPenalty/);

function authority(hits, minimum) {
  let value = 1;
  for (let index = 0; index < hits.length; index += 1) {
    const offset = index + 1;
    const supportRatio = Math.min(1, hits[index] / Math.max(1, minimum));
    const nearOcclusionPenalty = offset === 1 ? 1.6 : offset === 2 ? 1.2 : 1;
    value *= supportRatio ** nearOcclusionPenalty;
  }
  return value;
}

assert.ok(
  authority([1, 4, 4], 4) < authority([4, 4, 1], 4),
  "weak support immediately after the occlusion must lose more authority than equally weak distant support"
);
assert.equal(authority([4, 4, 4], 4), 1, "strong uninterrupted support should retain full authority");
assert.equal(authority([0, 4, 4], 4), 0, "an empty first resumed region should remain a hard break");
assert.ok(authority([3, 4, 4], 4) > 0.6, "moderately strong immediate support should remain useful");

console.log("asymmetric soft endpoint continuity smoke passed");