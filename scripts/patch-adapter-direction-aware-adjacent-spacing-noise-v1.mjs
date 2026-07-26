import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `                    const adjacentToMissingCandidate = Math.abs(point.index - candidateIndex) === 1;
                     const compressedNoiseFloor = adjacentToMissingCandidate ? 0.70 : 0.45;
                     const expandedNoiseCeiling = adjacentToMissingCandidate ? 1.22 : 1.35;`;

const newBlock = `                    const adjacentToMissingCandidate = Math.abs(point.index - candidateIndex) === 1;
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
                       : (adjacentToMissingCandidate ? 1.22 : 1.35);`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const adjacentOnExpandingSide = adjacentToMissingCandidate")) {
  throw new Error("Unable to locate adjacency spacing-noise bounds for direction-aware guard");
}

await fs.writeFile(path, source);
await import("./smoke-direction-aware-adjacent-spacing-noise.mjs");
console.log("adjacent spacing-noise support now respects the facade perspective direction");
