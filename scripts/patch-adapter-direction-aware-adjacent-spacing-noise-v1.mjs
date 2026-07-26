import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const adjacentOnExpandingSide = adjacentToMissingCandidate";
const adjacencyBlock = /const adjacentToMissingCandidate = Math\.abs\(point\.index - candidateIndex\) === 1;\s*const compressedNoiseFloor = adjacentToMissingCandidate \? 0\.70 : 0\.45;\s*const expandedNoiseCeiling = adjacentToMissingCandidate \? 1\.22 : 1\.35;/;

if (!source.includes(marker)) {
  if (!adjacencyBlock.test(source)) {
    throw new Error("Unable to locate adjacency spacing-noise bounds for direction-aware guard");
  }

  source = source.replace(adjacencyBlock, `const adjacentToMissingCandidate = Math.abs(point.index - candidateIndex) === 1;
                    const perspectiveDirection = Math.sign(robustSlope);
                    const adjacentDirection = Math.sign(point.index - candidateIndex);
                    const adjacentOnExpandingSide = adjacentToMissingCandidate
                      && perspectiveDirection !== 0
                      && adjacentDirection === perspectiveDirection;
                    const compressedNoiseFloor = adjacentOnExpandingSide
                      ? 0.78
                      : (adjacentToMissingCandidate ? 0.70 : 0.45);
                    const expandedNoiseCeiling = adjacentOnExpandingSide
                      ? 1.16
                      : (adjacentToMissingCandidate ? 1.22 : 1.35);`);
}

await fs.writeFile(path, source);
await import("./smoke-direction-aware-adjacent-spacing-noise.mjs");
console.log("adjacent spacing-noise support now respects the facade perspective direction");
