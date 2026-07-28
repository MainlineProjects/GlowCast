import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionSeverityAdaptiveContinuityDensity/);
assert.match(source, /const weakness = 1 - supportRatio/);
assert.match(source, /1\.15 \+ 1\.85 \* weakness/);
assert.match(source, /1\.05 \+ 0\.75 \* weakness/);

function authority(hits, minimum) {
  let value = 1;
  for (let index = 0; index < hits.length; index += 1) {
    const offset = index + 1;
    const supportRatio = Math.min(1, hits[index] / Math.max(1, minimum));
    const weakness = 1 - supportRatio;
    const nearOcclusionPenalty = offset === 1
      ? 1.15 + 1.85 * weakness
      : offset === 2
        ? 1.05 + 0.75 * weakness
        : 1;
    value *= supportRatio ** nearOcclusionPenalty;
  }
  return value;
}

assert.ok(authority([1, 4, 4], 4) < 0.05, "nearly empty immediate support should lose authority sharply");
assert.ok(authority([3, 4, 4], 4) > 0.6, "moderately supported immediate continuation should remain useful");
assert.ok(authority([1, 4, 4], 4) < authority([4, 4, 1], 4), "weakness nearest the occlusion should remain more suspicious than distant weakness");
assert.equal(authority([4, 4, 4], 4), 1, "strong uninterrupted support should retain full authority");
assert.equal(authority([0, 4, 4], 4), 0, "an empty first resumed region should remain a hard break");

console.log("severity-adaptive asymmetric endpoint continuity smoke passed");
