import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const canTrimWorstResidual = cleanSamples.length >= 4";
const oldBlock = `if (!cleanSamples.length) return 1;
                      const sortedResiduals = cleanSamples
                        .map((sample) => sample.residual)
                        .sort((a, b) => a - b);
                      const robustResiduals = cleanSamples.length >= 4
                        ? sortedResiduals.slice(0, -1)
                        : sortedResiduals;
                      const robustMeanResidual = robustResiduals.reduce((sum, residual) => sum + residual, 0) / robustResiduals.length;
                      const normalizedResidual = Math.min(1, robustMeanResidual / cleanSupportResidualLimit);
                      return 1 - 0.55 * normalizedResidual;`;

const newBlock = `if (!cleanSamples.length) return 1;
                      const sortedSamples = [...cleanSamples]
                        .sort((a, b) => a.residual - b.residual);
                      const worstSample = sortedSamples[sortedSamples.length - 1];
                      const canTrimWorstResidual = cleanSamples.length >= 4
                        && worstSample.distance >= 3;
                      const robustResiduals = (canTrimWorstResidual
                        ? sortedSamples.slice(0, -1)
                        : sortedSamples)
                        .map((sample) => sample.residual);
                      const robustMeanResidual = robustResiduals.reduce((sum, residual) => sum + residual, 0) / robustResiduals.length;
                      const normalizedResidual = Math.min(1, robustMeanResidual / cleanSupportResidualLimit);
                      return 1 - 0.55 * normalizedResidual;`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) {
    throw new Error("Unable to locate robust side-support trimming for distance-aware refinement");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-distance-aware-side-support-trim.mjs");
console.log("side-support quality now keeps near-gap residual spikes while trimming isolated distant spikes");
