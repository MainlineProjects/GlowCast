import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionShortEdgeEvidenceCapacity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionDirectionalPersistence = endpointOcclusionAvailableDirectionalBins < 3\s*\? 1\s*:\s*nextResumedHits <= 0\s*\? 0\s*:\s*Math\.min\(1, thirdResumedHits \/ nextResumedHits\);/;
  if (!pattern.test(helper)) throw new Error("distance-normalized directional persistence block not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionShortEdgeEvidenceCapacity = Math.max(1, Math.ceil(minHits * 0.75));
          const endpointOcclusionDirectionalPersistence = endpointOcclusionAvailableDirectionalBins < 3
            ? Math.min(1, nextResumedHits / endpointOcclusionShortEdgeEvidenceCapacity)
            : nextResumedHits <= 0
              ? 0
              : Math.min(1, thirdResumedHits / nextResumedHits);`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-evidence-capacity.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-evidence-distribution-v1.mjs");
console.log("short-edge endpoint relief now scales with usable evidence capacity");
