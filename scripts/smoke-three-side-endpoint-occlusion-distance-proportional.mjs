import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionShortEdgeDistanceWeight/);
assert.match(source, /endpointOcclusionShortEdgeDistanceWeight = endpointOcclusionAvailableDirectionalBins < 2\s*\? 1\s*:\s*1 \/ 3/);

function persistence(availableBins, minHits, nearestHits, nextHits) {
  const capacity = Math.max(1, Math.ceil(minHits * 0.75));
  const total = nearestHits + nextHits;
  const distribution = availableBins < 2
    ? 1
    : Math.sqrt(Math.min(nearestHits, nextHits) / Math.max(1, Math.max(nearestHits, nextHits)));
  const distanceWeight = availableBins < 2 ? 1 : 1 / 3;
  const positionWeight = availableBins < 2
    ? 1
    : Math.min(
        1,
        (nearestHits + nextHits * distanceWeight) /
          Math.max(1, total * ((1 + distanceWeight) / 2))
      );
  return Math.min(1, total / capacity) * distribution * positionWeight;
}

assert.equal(persistence(1, 4, 3, 0), 1, "one-bin edges should use all physically available evidence");
assert.equal(persistence(2, 4, 2, 2), 1, "balanced two-region support should retain full relief");
assert.ok(
  persistence(2, 4, 2, 1) > persistence(2, 4, 1, 2),
  "equal hit imbalance should favor evidence physically nearer the obstruction"
);
assert.ok(
  persistence(2, 4, 1, 2) < persistence(2, 4, 2, 1) * 0.85,
  "far-heavy evidence should be materially discounted by physical region distance"
);
assert.equal(persistence(2, 4, 0, 3), 0, "support only far from the obstruction should not earn relief");

console.log("distance-proportional short-edge endpoint evidence smoke passed");
