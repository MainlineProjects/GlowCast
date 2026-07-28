import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionShortEdgeDistanceWeight";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionShortEdgePositionWeight = endpointOcclusionAvailableDirectionalBins < 2\s*\? 1\s*:\s*Math\.min\(1, \(nearestResumedHits \+ 1\) \/ \(nextResumedHits \+ 1\)\);/;
  if (!pattern.test(helper)) throw new Error("position-weighted short-edge block not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionShortEdgeDistanceWeight = endpointOcclusionAvailableDirectionalBins < 2
            ? 1
            : 1 / 3;
          const endpointOcclusionShortEdgePositionWeight = endpointOcclusionAvailableDirectionalBins < 2
            ? 1
            : Math.min(
                1,
                (nearestResumedHits + nextResumedHits * endpointOcclusionShortEdgeDistanceWeight) /
                  Math.max(
                    1,
                    (nearestResumedHits + nextResumedHits) *
                      ((1 + endpointOcclusionShortEdgeDistanceWeight) / 2)
                  )
              );`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-distance-proportional.mjs");
console.log("short-edge endpoint support now scales with physical distance from the obstruction");
