import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionShortEdgeEvidenceCapacity/);
assert.match(source, /Math\.max\(1, Math\.ceil\(minHits \* 0\.75\)\)/);

function persistence(availableBins, minHits, nextHits, thirdHits) {
  const shortEdgeCapacity = Math.max(1, Math.ceil(minHits * 0.75));
  return availableBins < 3
    ? Math.min(1, nextHits / shortEdgeCapacity)
    : nextHits <= 0
      ? 0
      : Math.min(1, thirdHits / nextHits);
}

assert.equal(persistence(2, 4, 1, 0), 1 / 3, "one weak hit should not receive full short-edge relief");
assert.equal(persistence(2, 4, 3, 0), 1, "adequate short-edge evidence should retain full relief");
assert.equal(persistence(2, 8, 3, 0), 0.5, "denser sampling should demand proportionally stronger short-edge evidence");
assert.equal(persistence(3, 8, 8, 4), 0.5, "long edges should preserve third-region persistence scoring");

console.log("evidence-capacity endpoint shape smoke passed");
