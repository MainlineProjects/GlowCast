import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2)";
const segmentContextPattern = /const segmentContextSamples = contiguousWorstSideSamples\.length >= 2\s*\? contiguousWorstSideSamples\s*:\s*contextSamples;\s*const segmentContextMeanResidual = segmentContextSamples\.reduce\(\s*\(sum, sample\) => sum \+ sample\.residual,\s*0\s*\) \/ Math\.max\(segmentContextSamples\.length, 1\);\s*const segmentContextCoherence = 1 - Math\.min\(\s*1,\s*segmentContextMeanResidual \/ cleanSupportResidualLimit\s*\);\s*const segmentContextSeverityWeight = 0\.25 \+ 0\.75 \* segmentContextCoherence;/;
const replacement = `const segmentContextSamples = contiguousWorstSideSamples.length > 0
                          ? contiguousWorstSideSamples
                          : sameSideContextSamples;
                        const segmentContextMeanResidual = segmentContextSamples.length > 0
                          ? segmentContextSamples.reduce(
                              (sum, sample) => sum + sample.residual,
                              0
                            ) / segmentContextSamples.length
                          : cleanSupportResidualLimit;
                        const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2);
                        const segmentContextCoherence = (
                          1 - Math.min(1, segmentContextMeanResidual / cleanSupportResidualLimit)
                        ) * segmentEvidenceScale;
                        const segmentContextSeverityWeight = 0.25 + 0.75 * segmentContextCoherence;`;

if (!source.includes(marker)) {
  if (!segmentContextPattern.test(source)) {
    throw new Error("Unable to locate segment context fallback for independent side refinement");
  }
  source = source.replace(segmentContextPattern, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-independent-facade-segment-confidence.mjs");
console.log("facade segments now keep confidence local when one side has sparse support");
