import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionShortEdgePositionWeight/);
assert.match(source, /\(nearestResumedHits \+ 1\) \/ \(nextResumedHits \+ 1\)/);

function persistence(availableBins, minHits, nearestHits, nextHits) {
  const capacity = Math.max(1, Math.ceil(minHits * 0.75));
  const total = nearestHits + nextHits;
  const distribution = availableBins < 2
    ? 1
    : Math.sqrt(Math.min(nearestHits, nextHits) / Math.max(1, Math.max(nearestHits, nextHits)));
  const positionWeight = availableBins < 2 ? 1 : Math.min(1, (nearestHits + 1) / (nextHits + 1));
  return Math.min(1, total / capacity) * distribution * positionWeight;
}

assert.equal(persistence(1, 4, 3, 0), 1, "one-bin edges should use all physically available evidence");
assert.equal(persistence(2, 4, 2, 2), 1, "balanced short-edge support should retain full relief");
assert.ok(
  persistence(2, 4, 2, 1) > persistence(2, 4, 1, 2),
  "evidence nearest the obstruction should carry more authority than far-heavy support"
);
assert.ok(persistence(2, 4, 1, 2) < 0.5, "far-heavy support should receive materially reduced relief");
assert.equal(persistence(2, 4, 0, 3), 0, "support only far from the obstruction should not earn relief");

console.log("position-weighted short-edge endpoint evidence smoke passed");
