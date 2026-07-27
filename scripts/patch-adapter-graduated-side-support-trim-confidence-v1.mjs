import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const trimConfidence = cleanSamples.length >= 4";
const oldBlock = `if (!cleanSamples.length) return 1;
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

const newBlock = `if (!cleanSamples.length) return 1;
                      const sortedSamples = [...cleanSamples]
                        .sort((a, b) => a.residual - b.residual);
                      const worstSample = sortedSamples[sortedSamples.length - 1];
                      const trimConfidence = cleanSamples.length >= 4
                        ? Math.max(0, Math.min(1, (worstSample.distance - 2) / 3))
                        : 0;
                      const robustResidualSum = sortedSamples.reduce((sum, sample) => {
                        const weight = sample === worstSample ? 1 - trimConfidence : 1;
                        return sum + sample.residual * weight;
                      }, 0);
                      const robustResidualWeight = sortedSamples.reduce((sum, sample) =>
                        sum + (sample === worstSample ? 1 - trimConfidence : 1), 0);
                      const robustMeanResidual = robustResidualSum / Math.max(robustResidualWeight, 1e-9);
                      const normalizedResidual = Math.min(1, robustMeanResidual / cleanSupportResidualLimit);
                      return 1 - 0.55 * normalizedResidual;`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) {
    throw new Error("Unable to locate distance-aware side-support trim block for graduated refinement");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-graduated-side-support-trim-confidence.mjs");
await import("./patch-adapter-severity-aware-side-support-trim-v1.mjs");
console.log("side-support quality now discounts isolated residual spikes gradually with distance from the suspected gap");
