import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "sparseSegmentProximityScale";
const target = "const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2);";
const replacement = `const nearestSegmentDistance = segmentContextSamples.length > 0
                           ? Math.min(...segmentContextSamples.map(
                               (sample) => Math.abs(sample.offset - worstSample.offset)
                             ))
                           : Number.POSITIVE_INFINITY;
                         const sparseSegmentProximityScale = segmentContextSamples.length === 1
                           ? Math.max(0.45, 1 - Math.max(0, nearestSegmentDistance - 1) * 0.2)
                           : 1;
                         const segmentEvidenceScale = Math.min(1, segmentContextSamples.length / 2)
                           * sparseSegmentProximityScale;`;

if (!source.includes(marker)) {
  if (!source.includes(target)) throw new Error("segment evidence scale not found");
  source = source.replace(target, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-proximity-aware-sparse-segment-confidence.mjs");
await import("./patch-adapter-quality-aware-sparse-segment-confidence-v1.mjs");
console.log("sparse segment confidence now respects support proximity");
