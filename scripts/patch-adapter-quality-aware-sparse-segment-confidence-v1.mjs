import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "sparseSegmentQualityScale";
const targetPattern = /const segmentEvidenceScale = Math\.min\(1,\s*segmentContextSamples\.length \/ 2\)\s*\* sparseSegmentProximityScale;/;
const replacement = `const sparseSegmentQualityScale = segmentContextSamples.length === 1
                           ? Math.max(
                               0.35,
                               1 - Math.min(
                                 1,
                                 segmentContextMeanResidual / cleanSupportResidualLimit
                               ) * 0.45
                             )
                           : 1;
                         const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2)
                           * sparseSegmentProximityScale
                           * sparseSegmentQualityScale;`;

if (!source.includes(marker)) {
  if (!targetPattern.test(source)) throw new Error("proximity-aware segment evidence scale not found");
  source = source.replace(targetPattern, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-quality-aware-sparse-segment-confidence.mjs");
console.log("sparse segment confidence now requires stronger quality from lone support");
