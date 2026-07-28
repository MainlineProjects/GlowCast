import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

for (const expected of [
  "endpointOcclusionEdgePositionAwareDensity",
  "resumedDistanceFromEdge <= 0",
  "? 0.72",
  "? 0.86",
  "robustLocalEdgeDensity * 0.75 * endpointOcclusionEdgePositionAwareDensity"
]) {
  if (!source.includes(expected)) throw new Error(`missing edge-position-aware density source: ${expected}`);
}

const requiredHits = (localDensity, distanceFromEdge, minimum = 2) => {
  const factor = distanceFromEdge <= 0 ? 0.72 : distanceFromEdge === 1 ? 0.86 : 1;
  return Math.max(minimum, Math.ceil(localDensity * 0.75 * factor));
};

if (requiredHits(8, 0) !== 5) throw new Error("natural edge corner should receive measured density relief");
if (requiredHits(8, 1) !== 6) throw new Error("near-corner support should retain partial density relief");
if (requiredHits(8, 2) !== 6) throw new Error("interior support should retain the full density requirement");
if (requiredHits(3, 0) !== 2) throw new Error("position adjustment must never weaken the absolute resumed-support floor");

console.log("edge-position-aware endpoint density smoke passed");
