import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionShortEdgePositionWeight";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionShortEdgeEvidenceDistribution = endpointOcclusionAvailableDirectionalBins < 2\s*\? 1\s*:\s*Math\.sqrt\(\s*Math\.min\(nearestResumedHits, nextResumedHits\) \/\s*Math\.max\(1, Math\.max\(nearestResumedHits, nextResumedHits\)\)\s*\);\s*const endpointOcclusionDirectionalPersistence = endpointOcclusionAvailableDirectionalBins < 3\s*\? Math\.min\(1, endpointOcclusionShortEdgeEvidenceTotal \/ endpointOcclusionShortEdgeEvidenceCapacity\) \*\s*endpointOcclusionShortEdgeEvidenceDistribution/;
  if (!pattern.test(helper)) throw new Error("distributed short-edge persistence block not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionShortEdgeEvidenceDistribution = endpointOcclusionAvailableDirectionalBins < 2
            ? 1
            : Math.sqrt(
                Math.min(nearestResumedHits, nextResumedHits) /
                  Math.max(1, Math.max(nearestResumedHits, nextResumedHits))
              );
          const endpointOcclusionShortEdgePositionWeight = endpointOcclusionAvailableDirectionalBins < 2
            ? 1
            : Math.min(1, (nearestResumedHits + 1) / (nextResumedHits + 1));
          const endpointOcclusionDirectionalPersistence = endpointOcclusionAvailableDirectionalBins < 3
            ? Math.min(1, endpointOcclusionShortEdgeEvidenceTotal / endpointOcclusionShortEdgeEvidenceCapacity) *
              endpointOcclusionShortEdgeEvidenceDistribution *
              endpointOcclusionShortEdgePositionWeight`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-position-weight.mjs");
console.log("short-edge endpoint relief now favors evidence nearest the obstruction");
