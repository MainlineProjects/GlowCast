import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const confirmedBreakResidualCount = contextResiduals.filter";
const trimPattern = /const trimConfidence = distanceTrimConfidence\s*\* \(1 - 0\.8 \* severityRatio \* contextSeverityWeight\);/;
const replacement = `const confirmedBreakResidualCount = contextResiduals.filter(
                          (residual) => residual >= cleanSupportResidualLimit * 0.75
                        ).length + (severityRatio >= 0.75 ? 1 : 0);
                        const crossBreakTrimScale = confirmedBreakResidualCount >= 2 ? 0.2 : 1;
                        const trimConfidence = distanceTrimConfidence
                          * (1 - 0.8 * severityRatio * contextSeverityWeight)
                          * crossBreakTrimScale;`;

if (!source.includes(marker)) {
  if (!trimPattern.test(source)) {
    throw new Error("Unable to locate context-aware trim confidence for facade-break split");
  }
  source = source.replace(trimPattern, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-split-confidence-at-facade-break.mjs");
console.log("repeated facade support now stops trimming across confirmed structural discontinuities");
