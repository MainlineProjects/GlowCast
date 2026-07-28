import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionNearSupportStrengthAuthority/);
assert.match(
  source,
  /nearestResumedHits \/ Math\.max\(1, endpointOcclusionShortEdgeEvidenceCapacity\)/
);

function cappedFarHits(capacity, nearestHits, nextHits) {
  const strengthAuthority = Math.min(1, nearestHits / Math.max(1, capacity));
  return Math.min(nextHits, nearestHits * (1 + strengthAuthority));
}

assert.equal(cappedFarHits(4, 0, 10), 0, "far-only evidence must remain invalid");
assert.equal(cappedFarHits(4, 1, 10), 1.25, "one weak near hit should authorize only limited distant evidence");
assert.equal(cappedFarHits(4, 2, 10), 3, "partial near support should receive proportional authority");
assert.equal(cappedFarHits(4, 4, 10), 8, "full near support should retain the established two-to-one cap");
assert.ok(
  cappedFarHits(6, 2, 10) < cappedFarHits(3, 2, 10),
  "the same hit count should carry less authority on a denser edge"
);

console.log("strength-aware near-support endpoint evidence smoke passed");
