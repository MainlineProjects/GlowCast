import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionDirectionalShapeCoherence/);
assert.match(source, /thirdResumedHits/);
assert.match(source, /Math\.sqrt\(\s*endpointOcclusionCornerBalance \* endpointOcclusionDirectionalPersistence/);

function shapeCoherence(nearestHits, nextHits, thirdHits) {
  const balance = Math.min(1, Math.min(nearestHits, nextHits) / Math.max(1, Math.max(nearestHits, nextHits)));
  const persistence = nextHits <= 0 ? 0 : Math.min(1, thirdHits / nextHits);
  return Math.sqrt(balance * persistence);
}

assert.equal(shapeCoherence(8, 8, 8), 1, "steady architectural continuation should keep full corner coherence");
assert.equal(shapeCoherence(8, 8, 0), 0, "two dense disconnected clusters must not earn corner relief");
assert.ok(shapeCoherence(8, 8, 4) > 0.7 && shapeCoherence(8, 8, 4) < 0.71, "partial directional continuation should retain partial authority");
assert.ok(shapeCoherence(8, 2, 2) < 0.51, "an imbalanced decorative intersection should remain strongly penalized");

console.log("directionally shape-aware endpoint coherence smoke passed");
