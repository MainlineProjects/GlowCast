import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18);";
const directionAwareBlock = /const perspectiveDirection = Math\.sign\(robustSlope\);\s*const adjacentDirection = Math\.sign\(point\.index - candidateIndex\);\s*const adjacentOnExpandingSide = adjacentToMissingCandidate\s*&& perspectiveDirection !== 0\s*&& adjacentDirection === perspectiveDirection;\s*const compressedNoiseFloor = adjacentOnExpandingSide\s*\? 0\.78\s*: \(adjacentToMissingCandidate \? 0\.70 : 0\.45\);\s*const expandedNoiseCeiling = adjacentOnExpandingSide\s*\? 1\.16\s*: \(adjacentToMissingCandidate \? 1\.22 : 1\.35\);/;

if (!source.includes(marker)) {
  if (!directionAwareBlock.test(source)) {
    throw new Error("Unable to locate direction-aware adjacent spacing-noise bounds for strength scaling");
  }

  source = source.replace(directionAwareBlock, `const perspectiveDirection = Math.sign(robustSlope);
                    const adjacentDirection = Math.sign(point.index - candidateIndex);
                    const adjacentOnExpandingSide = adjacentToMissingCandidate
                      && perspectiveDirection !== 0
                      && adjacentDirection === perspectiveDirection;
                    const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18);
                    const compressedNoiseFloor = adjacentOnExpandingSide
                      ? (0.70 + (0.08 * perspectiveStrength))
                      : (adjacentToMissingCandidate ? 0.70 : 0.45);
                    const expandedNoiseCeiling = adjacentOnExpandingSide
                      ? (1.22 - (0.06 * perspectiveStrength))
                      : (adjacentToMissingCandidate ? 1.22 : 1.35);`);
}

await fs.writeFile(path, source);
await import("./smoke-strength-aware-adjacent-spacing-noise.mjs");
await import("./patch-adapter-coherence-weighted-perspective-strength-v1.mjs");
console.log("adjacent spacing-noise strictness now scales with facade perspective strength");
