import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const contextResidualMagnitudeBlend = Math.max";
const oldBlock = `const contextResidualCap = contextResiduals.length >= 4
                         ? contextResiduals[contextResiduals.length - 2]
                         : Number.POSITIVE_INFINITY;`;
const newBlock = `const contextSecondWorstResidual = contextResiduals.length >= 2
                         ? contextResiduals[contextResiduals.length - 2]
                         : contextResiduals[contextResiduals.length - 1] ?? 0;
                       const contextWorstResidual = contextResiduals[contextResiduals.length - 1] ?? 0;
                       const contextWorstMagnitude = Math.max(0, Math.min(1, contextWorstResidual / cleanSupportResidualLimit));
                       const contextResidualMagnitudeBlend = Math.max(0, Math.min(1, (contextWorstMagnitude - 0.35) / 0.65));
                       const contextResidualCap = contextResiduals.length >= 4
                         ? contextSecondWorstResidual + (contextWorstResidual - contextSecondWorstResidual) * contextResidualMagnitudeBlend
                         : Number.POSITIVE_INFINITY;`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) throw new Error("Unable to locate robust context residual cap");
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-severity-bounded-context-side-support.mjs");
console.log("context residual capping now scales with outlier magnitude");
