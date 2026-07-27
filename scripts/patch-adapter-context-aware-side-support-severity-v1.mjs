import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const contextSeverityWeight = 0.25 + 0.75 * contextCoherence";
const oldBlock = `if (!cleanSamples.length) return 1;
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

const newBlock = `if (!cleanSamples.length) return 1;
                       const sortedSamples = [...cleanSamples]
                         .sort((a, b) => a.residual - b.residual);
                       const worstSample = sortedSamples[sortedSamples.length - 1];
                       const distanceTrimConfidence = cleanSamples.length >= 4
                         ? Math.max(0, Math.min(1, (worstSample.distance - 2) / 3))
                         : 0;
                       const contextSamples = sortedSamples.filter((sample) => sample !== worstSample);
                       const contextMeanResidual = contextSamples.reduce((sum, sample) => sum + sample.residual, 0)
                         / Math.max(contextSamples.length, 1);
                       const contextCoherence = 1 - Math.min(1, contextMeanResidual / cleanSupportResidualLimit);
                       const severityRatio = Math.max(0, Math.min(1, worstSample.residual / cleanSupportResidualLimit));
                       const contextSeverityWeight = 0.25 + 0.75 * contextCoherence;
                       const trimConfidence = distanceTrimConfidence
                         * (1 - 0.8 * severityRatio * contextSeverityWeight);
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
    throw new Error("Unable to locate severity-aware side-support block for context-aware refinement");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-context-aware-side-support-severity.mjs");
await import("./patch-adapter-robust-context-side-support-severity-v1.mjs");
console.log("side-support severity now carries more authority when a large residual is isolated inside otherwise coherent facade evidence");
