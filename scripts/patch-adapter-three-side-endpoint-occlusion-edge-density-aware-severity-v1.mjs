import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionEdgeDensityAwareContinuityDensity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionSeverityAdaptiveContinuityDensity: Array<\{ hits: number; weight: number \}> = \[\];[\s\S]*?const endpointOcclusionDistanceWeightedDensity = endpointOcclusionSeverityAdaptiveContinuityDensity;/;
  if (!pattern.test(helper)) throw new Error("severity-adaptive endpoint continuity calculation not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionEdgeDensityAwareContinuityDensity: Array<{ hits: number; weight: number }> = [];
          const nearbyEdgeHits = [1, 2, 3]
            .map((offset) => binHits.get(bin + direction * offset) ?? 0)
            .sort((a, b) => a - b);
          const robustLocalEdgeDensity = nearbyEdgeHits[1] ?? 0;
          const densityAwareMinimum = Math.max(
            resumedBinMinHits,
            Math.ceil(robustLocalEdgeDensity * 0.75)
          );
          let continuityAuthority = 1;
          for (const offset of [1, 2, 3]) {
            const hits = binHits.get(bin + direction * offset) ?? 0;
            const supportRatio = Math.min(1, hits / Math.max(1, densityAwareMinimum));
            const weakness = 1 - supportRatio;
            const nearOcclusionPenalty = offset === 1
              ? 1.15 + 1.85 * weakness
              : offset === 2
                ? 1.05 + 0.75 * weakness
                : 1;
            continuityAuthority *= supportRatio ** nearOcclusionPenalty;
            if (hits > 0 && continuityAuthority >= 0.18) {
              endpointOcclusionEdgeDensityAwareContinuityDensity.push({
                hits,
                weight: (4 - offset) * continuityAuthority
              });
            }
            if (continuityAuthority < 0.18) break;
          }
          const endpointOcclusionDistanceWeightedDensity = endpointOcclusionEdgeDensityAwareContinuityDensity;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-edge-density-aware-severity.mjs");
console.log("three-sided fallback endpoint continuity now judges resumed support against robust local edge density");
