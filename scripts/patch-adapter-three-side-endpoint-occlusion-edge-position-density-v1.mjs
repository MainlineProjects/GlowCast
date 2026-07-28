import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionEdgePositionAwareDensity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const densityAwareMinimum = Math\.max\(\s*resumedBinMinHits,\s*Math\.ceil\(robustLocalEdgeDensity \* 0\.75\)\s*\);/;
  if (!pattern.test(helper)) throw new Error("edge-density-aware endpoint minimum not found");

  helper = helper.replace(
    pattern,
    `const resumedSupportBin = bin + direction;
          const resumedDistanceFromEdge = Math.min(
            resumedSupportBin,
            Math.max(0, binCount - 1 - resumedSupportBin)
          );
          const endpointOcclusionEdgePositionAwareDensity = resumedDistanceFromEdge <= 0
            ? 0.72
            : resumedDistanceFromEdge === 1
              ? 0.86
              : 1;
          const densityAwareMinimum = Math.max(
            resumedBinMinHits,
            Math.ceil(robustLocalEdgeDensity * 0.75 * endpointOcclusionEdgePositionAwareDensity)
          );`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-edge-position-density.mjs");
console.log("endpoint occlusion density now avoids over-penalizing support at natural edge corners");
