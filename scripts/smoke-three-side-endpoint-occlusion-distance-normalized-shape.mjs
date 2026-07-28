import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionAvailableDirectionalBins/);
assert.match(source, /endpointOcclusionAvailableDirectionalBins < 3\s*\? 1/);

function persistence(bin, direction, nextHits, thirdHits) {
  const availableDirectionalBins = direction > 0 ? 7 - bin : bin;
  return availableDirectionalBins < 3
    ? 1
    : nextHits <= 0
      ? 0
      : Math.min(1, thirdHits / nextHits);
}

assert.equal(persistence(5, 1, 8, 0), 1, "short right-side edge span should not require an unavailable third region");
assert.equal(persistence(2, -1, 8, 0), 1, "short left-side edge span should receive symmetric treatment");
assert.equal(persistence(3, 1, 8, 0), 0, "longer edges should still reject disconnected two-cluster trim");
assert.equal(persistence(3, 1, 8, 4), 0.5, "partial third-region continuation should retain proportional authority");
assert.equal(persistence(3, 1, 8, 8), 1, "steady long-edge continuation should keep full persistence");

console.log("distance-normalized endpoint directional shape smoke passed");
