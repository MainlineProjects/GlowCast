import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `                  let compressedNoiseCount = 0;
                  const remainingSupportIsCompatible = remainingSupport.every((point) => {
                    const predictedStep = Math.exp(robustIntercept + (robustSlope * point.index));
                    const ratio = Math.exp(point.value) / Math.max(predictedStep, 1e-6);
                    if (ratio >= (1 / 1.10) && ratio <= 1.10) return true;
                    if (ratio >= 0.45 && ratio < (1 / 1.10)) {
                      compressedNoiseCount += 1;
                      return compressedNoiseCount <= 1;
                    }
                    return false;
                  });`;

const newBlock = `                  let compressedNoiseCount = 0;
                  let expandedNoiseCount = 0;
                  const remainingSupportIsCompatible = remainingSupport.every((point) => {
                    const predictedStep = Math.exp(robustIntercept + (robustSlope * point.index));
                    const ratio = Math.exp(point.value) / Math.max(predictedStep, 1e-6);
                    if (ratio >= (1 / 1.10) && ratio <= 1.10) return true;
                    if (ratio >= 0.45 && ratio < (1 / 1.10)) {
                      compressedNoiseCount += 1;
                      return compressedNoiseCount <= 1;
                    }
                    if (ratio > 1.10 && ratio <= 1.35) {
                      expandedNoiseCount += 1;
                      return expandedNoiseCount <= 1;
                    }
                    return false;
                  });`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("let expandedNoiseCount = 0;")) {
  throw new Error("Unable to locate robust spacing remainder block for expanded-noise patch");
}

await fs.writeFile(path, source);
await import("./smoke-robust-perspective-spacing-gap-plus-expanded-noise.mjs");
await import("./patch-adapter-single-spacing-noise-budget-v1.mjs");
console.log("endpoint spacing now tolerates one bounded expanded noisy interval without excusing missing-opening-sized gaps");
