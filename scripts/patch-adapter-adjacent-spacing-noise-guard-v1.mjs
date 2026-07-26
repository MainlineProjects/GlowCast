import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `                  let spacingNoiseCount = 0;
                  const remainingSupportIsCompatible = remainingSupport.every((point) => {
                    const predictedStep = Math.exp(robustIntercept + (robustSlope * point.index));
                    const ratio = Math.exp(point.value) / Math.max(predictedStep, 1e-6);
                    if (ratio >= (1 / 1.10) && ratio <= 1.10) return true;
                    if (ratio >= 0.45 && ratio < (1 / 1.10)) {
                      spacingNoiseCount += 1;
                      return spacingNoiseCount <= 1;
                    }
                    if (ratio > 1.10 && ratio <= 1.35) {
                      spacingNoiseCount += 1;
                      return spacingNoiseCount <= 1;
                    }
                    return false;
                  });`;

const newBlock = `                  let spacingNoiseCount = 0;
                  const remainingSupportIsCompatible = remainingSupport.every((point) => {
                    const predictedStep = Math.exp(robustIntercept + (robustSlope * point.index));
                    const ratio = Math.exp(point.value) / Math.max(predictedStep, 1e-6);
                    if (ratio >= (1 / 1.10) && ratio <= 1.10) return true;
                    const adjacentToMissingCandidate = Math.abs(point.index - candidateIndex) === 1;
                    const compressedNoiseFloor = adjacentToMissingCandidate ? 0.70 : 0.45;
                    const expandedNoiseCeiling = adjacentToMissingCandidate ? 1.22 : 1.35;
                    if (ratio >= compressedNoiseFloor && ratio < (1 / 1.10)) {
                      spacingNoiseCount += 1;
                      return spacingNoiseCount <= 1;
                    }
                    if (ratio > 1.10 && ratio <= expandedNoiseCeiling) {
                      spacingNoiseCount += 1;
                      return spacingNoiseCount <= 1;
                    }
                    return false;
                  });`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const adjacentToMissingCandidate = Math.abs(point.index - candidateIndex) === 1;")) {
  throw new Error("Unable to locate shared spacing-noise budget block for adjacency guard");
}

await fs.writeFile(path, source);
await import("./smoke-adjacent-spacing-noise-guard.mjs");
await import("./patch-adapter-direction-aware-adjacent-spacing-noise-v1.mjs");
console.log("spacing-noise support is now stricter immediately beside a suspected missing opening");
