import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const confirmedBreakResidualCountOnWorstSide = contextSamples.filter";
const globalBreakPattern = /const confirmedBreakResidualCount = contextResiduals\.filter\(\s*\(residual\) => residual >= cleanSupportResidualLimit \* 0\.75\s*\)\.length \+ \(severityRatio >= 0\.75 \? 1 : 0\);\s*const crossBreakTrimScale = confirmedBreakResidualCount >= 2 \? 0\.2 : 1;/;
const replacement = `const worstSampleSide = Math.sign(worstSample.offset);
                        const confirmedBreakResidualCountOnWorstSide = contextSamples.filter(
                          (sample) => Math.sign(sample.offset) === worstSampleSide
                            && sample.residual >= cleanSupportResidualLimit * 0.75
                        ).length + (severityRatio >= 0.75 ? 1 : 0);
                        const crossBreakTrimScale = confirmedBreakResidualCountOnWorstSide >= 2 ? 0.2 : 1;`;

if (!source.includes(marker)) {
  if (!globalBreakPattern.test(source)) {
    throw new Error("Unable to locate global facade-break trim scaling for directional refinement");
  }
  source = source.replace(globalBreakPattern, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-directional-facade-break-confidence.mjs");
await import("./patch-adapter-segment-aware-facade-break-confidence-v1.mjs");
console.log("facade-break confidence now remains independent across opposite sides of a repeated architectural sequence");
