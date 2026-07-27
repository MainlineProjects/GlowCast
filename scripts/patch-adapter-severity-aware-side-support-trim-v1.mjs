import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const severityRatio = Math.max(0, Math.min(1, worstSample.residual / cleanSupportResidualLimit))";
const oldBlock = `if (!cleanSamples.length) return 1;
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

const newBlock = `if (!cleanSamples.length) return 1;
                      const sortedSamples = [...cleanSamples]
                        .sort((a, b) => a.residual - b.residual);
                      const worstSample = sortedSamples[sortedSamples.length - 1];
                      const distanceTrimConfidence = cleanSamples.length >= 4
                        ? Math.max(0, Math.min(1, (worstSample.distance - 2) / 3))
                        : 0;
                      const severityRatio = Math.max(0, Math.min(1, worstSample.residual / cleanSupportResidualLimit));
                      const trimConfidence = distanceTrimConfidence * (1 - 0.65 * severityRatio);
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
    throw new Error("Unable to locate graduated side-support trim block for severity-aware refinement");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-severity-aware-side-support-trim.mjs");
console.log("side-support trimming now retains more influence for severe residuals even when they are distant");
