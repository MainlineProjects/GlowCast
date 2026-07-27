import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const robustResiduals = cleanSamples.length >= 4";
const oldBlock = `if (!cleanSamples.length) return 1;
                      const meanResidual = cleanSamples.reduce((sum, sample) => sum + sample.residual, 0) / cleanSamples.length;
                      const normalizedResidual = Math.min(1, meanResidual / cleanSupportResidualLimit);
                      return 1 - 0.55 * normalizedResidual;`;

const newBlock = `if (!cleanSamples.length) return 1;
                      const sortedResiduals = cleanSamples
                        .map((sample) => sample.residual)
                        .sort((a, b) => a - b);
                      const robustResiduals = cleanSamples.length >= 4
                        ? sortedResiduals.slice(0, -1)
                        : sortedResiduals;
                      const robustMeanResidual = robustResiduals.reduce((sum, residual) => sum + residual, 0) / robustResiduals.length;
                      const normalizedResidual = Math.min(1, robustMeanResidual / cleanSupportResidualLimit);
                      return 1 - 0.55 * normalizedResidual;`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) {
    throw new Error("Unable to locate side-support quality mean for robust trimming");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-robust-side-support-quality.mjs");
console.log("side-support quality now ignores one isolated residual spike when enough support remains");
