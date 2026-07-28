import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionSoftContinuityDensity/);
assert.match(source, /continuityAuthority \*= supportRatio/);
assert.match(source, /continuityAuthority < 0\.18/);

function authority(hits, minimum) {
  let value = 1;
  for (const hitCount of hits) {
    value *= Math.min(1, hitCount / Math.max(1, minimum));
  }
  return value;
}

assert.equal(authority([4, 4, 4], 4), 1, "continuous strong support should retain full authority");
assert.equal(authority([4, 0, 8], 4), 0, "a truly empty intermediate bin should stop distant support");
assert.ok(authority([4, 1, 8], 4) > 0, "one weak pixel should not behave exactly like an empty bin");
assert.ok(authority([4, 1, 8], 4) < authority([4, 3, 8], 4), "weaker continuity must reduce distant support more strongly");
assert.ok(authority([4, 1, 8], 4) < 0.3, "nearly empty continuity should sharply limit distant authority");

console.log("soft endpoint continuity density smoke passed");
