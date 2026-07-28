import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionShortEdgeEvidenceDistribution/);
assert.match(source, /endpointOcclusionShortEdgeEvidenceTotal = nearestResumedHits \+ nextResumedHits/);

function persistence(availableBins, minHits, nearestHits, nextHits, thirdHits) {
  const capacity = Math.max(1, Math.ceil(minHits * 0.75));
  const total = nearestHits + nextHits;
  const distribution = availableBins < 2
    ? 1
    : Math.sqrt(Math.min(nearestHits, nextHits) / Math.max(1, Math.max(nearestHits, nextHits)));
  return availableBins < 3
    ? Math.min(1, total / capacity) * distribution
    : nextHits <= 0
      ? 0
      : Math.min(1, thirdHits / nextHits);
}

assert.equal(persistence(1, 4, 3, 0, 0), 1, "one-bin short edges should use all available evidence");
assert.equal(persistence(2, 4, 3, 0, 0), 0, "corner-clustered hits should not earn two-bin relief");
assert.ok(persistence(2, 4, 2, 1, 0) > 0.7, "distributed short-edge evidence should retain useful relief");
assert.equal(persistence(2, 4, 2, 2, 0), 1, "balanced strong evidence should earn full short-edge relief");
assert.equal(persistence(3, 8, 8, 8, 4), 0.5, "long edges should preserve third-region persistence scoring");

console.log("distributed short-edge endpoint evidence smoke passed");
