import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const contextSeverityWeight = 0.25 + 0.75 * contextCoherence";
const robustMarker = "const contextResidualCap = contextResiduals.length >= 4";
const severityTrimPattern = /const severityRatio = Math\.max\(0, Math\.min\(1, worstSample\.residual \/ cleanSupportResidualLimit\)\);\s*const trimConfidence = distanceTrimConfidence \* \(1 - 0\.65 \* severityRatio\);/;

const replacement = `const contextSamples = sortedSamples.filter((sample) => sample !== worstSample);
                       const contextMeanResidual = contextSamples.reduce((sum, sample) => sum + sample.residual, 0)
                         / Math.max(contextSamples.length, 1);
                       const contextCoherence = 1 - Math.min(1, contextMeanResidual / cleanSupportResidualLimit);
                       const severityRatio = Math.max(0, Math.min(1, worstSample.residual / cleanSupportResidualLimit));
                       const contextSeverityWeight = 0.25 + 0.75 * contextCoherence;
                       const trimConfidence = distanceTrimConfidence
                         * (1 - 0.8 * severityRatio * contextSeverityWeight);`;

if (!source.includes(marker) && !source.includes(robustMarker)) {
  if (!severityTrimPattern.test(source)) {
    throw new Error("Unable to locate stable severity-aware trim statements for context-aware refinement");
  }
  source = source.replace(severityTrimPattern, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-context-aware-side-support-severity.mjs");
await import("./patch-adapter-robust-context-side-support-severity-v1.mjs");
console.log("side-support severity now carries more authority when a large residual is isolated inside otherwise coherent facade evidence");
