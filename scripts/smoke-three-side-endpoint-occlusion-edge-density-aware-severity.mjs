import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionEdgeDensityAwareContinuityDensity/);
assert.match(source, /const robustLocalEdgeDensity = nearbyEdgeHits\[1\] \?\? 0/);
assert.match(source, /Math\.ceil\(robustLocalEdgeDensity \* 0\.75\)/);
assert.match(source, /hits \/ Math\.max\(1, densityAwareMinimum\)/);

function densityAwareMinimum(hits, minimum) {
  const sorted = [...hits].sort((a, b) => a - b);
  const robustLocalEdgeDensity = sorted[1] ?? 0;
  return Math.max(minimum, Math.ceil(robustLocalEdgeDensity * 0.75));
}

assert.equal(densityAwareMinimum([1, 2, 2], 4), 4, "lightly sampled edges should retain the base minimum");
assert.equal(densityAwareMinimum([2, 8, 8], 4), 6, "dense edges should demand stronger resumed support");
assert.equal(densityAwareMinimum([2, 2, 20], 4), 4, "one isolated dense bin should not inflate the requirement");
assert.equal(densityAwareMinimum([8, 8, 20], 4), 6, "consistently dense local support should raise the requirement");

console.log("edge-density-aware endpoint severity smoke passed");
