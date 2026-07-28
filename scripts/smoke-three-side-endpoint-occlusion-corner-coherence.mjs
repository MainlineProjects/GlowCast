import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /endpointOcclusionCornerCoherence/);
assert.match(source, /const endpointPositionRelief = resumedDistanceFromEdge <= 0/);
assert.match(source, /\(1 - endpointPositionRelief\) \* \(1 - endpointOcclusionCornerCoherence\)/);

function densityFactor(distanceFromEdge, nearestHits, nextHits) {
  const coherence = Math.min(1, Math.min(nearestHits, nextHits) / Math.max(1, Math.max(nearestHits, nextHits)));
  const relief = distanceFromEdge <= 0 ? 0.72 : distanceFromEdge === 1 ? 0.86 : 1;
  return relief + (1 - relief) * (1 - coherence);
}

assert.equal(densityFactor(0, 8, 8), 0.72, "balanced corner continuation should retain full endpoint relief");
assert.ok(densityFactor(0, 8, 1) > 0.95, "one dense decorative intersection should lose nearly all corner relief");
assert.ok(densityFactor(1, 8, 4) > 0.86 && densityFactor(1, 8, 4) < 1, "partially coherent near-corner support should receive only partial relief");
assert.equal(densityFactor(2, 8, 8), 1, "interior edge support must keep the full density requirement");

console.log("corner-coherence-aware endpoint density smoke passed");
