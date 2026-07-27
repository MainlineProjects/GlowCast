import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const contextResidualCap = contextResiduals.length >= 4";
const oldBlock = `const contextSamples = sortedSamples.filter((sample) => sample !== worstSample);
                       const contextMeanResidual = contextSamples.reduce((sum, sample) => sum + sample.residual, 0)
                         / Math.max(contextSamples.length, 1);
                       const contextCoherence = 1 - Math.min(1, contextMeanResidual / cleanSupportResidualLimit);`;

const newBlock = `const contextSamples = sortedSamples.filter((sample) => sample !== worstSample);
                       const contextResiduals = contextSamples
                         .map((sample) => sample.residual)
                         .sort((a, b) => a - b);
                       const contextResidualCap = contextResiduals.length >= 4
                         ? contextResiduals[contextResiduals.length - 2]
                         : Number.POSITIVE_INFINITY;
                       const contextMeanResidual = contextResiduals.reduce((sum, residual) =>
                         sum + Math.min(residual, contextResidualCap), 0)
                         / Math.max(contextResiduals.length, 1);
                       const contextCoherence = 1 - Math.min(1, contextMeanResidual / cleanSupportResidualLimit);`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) {
    throw new Error("Unable to locate context-aware side-support block for robust secondary-outlier refinement");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-robust-context-side-support-severity.mjs");
console.log("side-support structural context now resists one secondary mild residual without hiding sustained noisy evidence");
