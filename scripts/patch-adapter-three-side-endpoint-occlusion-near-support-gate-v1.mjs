import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionNearSupportCappedFarHits";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionShortEdgePositionWeight = endpointOcclusionAvailableDirectionalBins < 2\s*\? 1\s*:\s*Math\.min\(\s*1,\s*\(nearestResumedHits \+ nextResumedHits \* endpointOcclusionShortEdgeDistanceWeight\) \/\s*Math\.max\(\s*1,\s*\(nearestResumedHits \+ nextResumedHits\) \*\s*\(\(1 \+ endpointOcclusionShortEdgeDistanceWeight\) \/ 2\)\s*\)\s*\);/;
  if (!pattern.test(helper)) throw new Error("distance-proportional short-edge position block not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionNearSupportCappedFarHits = Math.min(
            nextResumedHits,
            nearestResumedHits * 2
          );
          const endpointOcclusionShortEdgePositionWeight = endpointOcclusionAvailableDirectionalBins < 2
            ? 1
            : Math.min(
                1,
                (nearestResumedHits +
                  endpointOcclusionNearSupportCappedFarHits * endpointOcclusionShortEdgeDistanceWeight) /
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
await import("./smoke-three-side-endpoint-occlusion-near-support-gate.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-strength-aware-near-support-v1.mjs");
console.log("far short-edge support now requires convincing near-obstruction continuation");
