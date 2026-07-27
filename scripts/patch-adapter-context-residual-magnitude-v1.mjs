import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const contextResidualMagnitudeBlend = Math.max";
const downstreamMarker = "const confirmedBreakResidualCount = contextResiduals.filter";
const oldPattern = /const contextResidualCap = contextResiduals\.length >= 4\s*\? contextResiduals\[contextResiduals\.length - 2\]\s*: Number\.POSITIVE_INFINITY;/;
const newBlock = `const contextSecondWorstResidual = contextResiduals.length >= 2
                          ? contextResiduals[contextResiduals.length - 2]
                          : contextResiduals[contextResiduals.length - 1] ?? 0;
                        const contextWorstResidual = contextResiduals[contextResiduals.length - 1] ?? 0;
                        const contextWorstMagnitude = Math.max(0, Math.min(1, contextWorstResidual / cleanSupportResidualLimit));
                        const contextResidualMagnitudeBlend = Math.max(0, Math.min(1, (contextWorstMagnitude - 0.35) / 0.65));
                        const contextResidualCap = contextResiduals.length >= 4
                          ? contextSecondWorstResidual + (contextWorstResidual - contextSecondWorstResidual) * contextResidualMagnitudeBlend
                          : Number.POSITIVE_INFINITY;`;

if (!source.includes(marker) && !source.includes(downstreamMarker)) {
  if (!oldPattern.test(source)) throw new Error("Unable to locate robust context residual cap");
  source = source.replace(oldPattern, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-severity-bounded-context-side-support.mjs");
await import("./patch-adapter-split-confidence-at-facade-break-v1.mjs");
console.log("context residual capping now scales with outlier magnitude");
