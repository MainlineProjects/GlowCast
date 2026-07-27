import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const segmentContextSamples = contiguousWorstSideSamples.length >= 2";
const directionalBlockPattern = /const worstSampleSide = Math\.sign\(worstSample\.offset\);\s*const confirmedBreakResidualCountOnWorstSide = contextSamples\.filter\(\s*\(sample\) => Math\.sign\(sample\.offset\) === worstSampleSide\s*&& sample\.residual >= cleanSupportResidualLimit \* 0\.75\s*\)\.length \+ \(severityRatio >= 0\.75 \? 1 : 0\);\s*const crossBreakTrimScale = confirmedBreakResidualCountOnWorstSide >= 2 \? 0\.2 : 1;\s*const trimConfidence = distanceTrimConfidence\s*\* \(1 - 0\.8 \* severityRatio \* contextSeverityWeight\)\s*\* crossBreakTrimScale;/;
const replacement = `const worstSampleSide = Math.sign(worstSample.offset);
                        const sameSideContextSamples = contextSamples.filter(
                          (sample) => Math.sign(sample.offset) === worstSampleSide
                        );
                        const confirmedBreakSamplesOnWorstSide = sameSideContextSamples.filter(
                          (sample) => sample.residual >= cleanSupportResidualLimit * 0.75
                        );
                        const confirmedBreakResidualCountOnWorstSide = confirmedBreakSamplesOnWorstSide.length
                          + (severityRatio >= 0.75 ? 1 : 0);
                        const nearestConfirmedBreakDistance = confirmedBreakSamplesOnWorstSide.reduce(
                          (nearest, sample) => Math.min(nearest, Math.abs(sample.offset)),
                          Number.POSITIVE_INFINITY
                        );
                        const contiguousWorstSideSamples = Number.isFinite(nearestConfirmedBreakDistance)
                          ? sameSideContextSamples.filter(
                              (sample) => Math.abs(sample.offset) >= nearestConfirmedBreakDistance
                            )
                          : sameSideContextSamples;
                        const segmentContextSamples = contiguousWorstSideSamples.length >= 2
                          ? contiguousWorstSideSamples
                          : contextSamples;
                        const segmentContextMeanResidual = segmentContextSamples.reduce(
                          (sum, sample) => sum + sample.residual,
                          0
                        ) / Math.max(segmentContextSamples.length, 1);
                        const segmentContextCoherence = 1 - Math.min(
                          1,
                          segmentContextMeanResidual / cleanSupportResidualLimit
                        );
                        const segmentContextSeverityWeight = 0.25 + 0.75 * segmentContextCoherence;
                        const crossBreakTrimScale = confirmedBreakResidualCountOnWorstSide >= 2 ? 0.2 : 1;
                        const trimConfidence = distanceTrimConfidence
                          * (1 - 0.8 * severityRatio * segmentContextSeverityWeight)
                          * crossBreakTrimScale;`;

if (!source.includes(marker)) {
  if (!directionalBlockPattern.test(source)) {
    throw new Error("Unable to locate directional facade-break confidence block for segment-aware refinement");
  }
  source = source.replace(directionalBlockPattern, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-segment-aware-facade-break-confidence.mjs");
await import("./patch-adapter-independent-facade-segment-confidence-v1.mjs");
console.log("confirmed facade discontinuities now isolate contiguous architectural confidence on each side");
