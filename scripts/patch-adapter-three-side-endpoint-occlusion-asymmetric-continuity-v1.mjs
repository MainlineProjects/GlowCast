import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionAsymmetricContinuityDensity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionSoftContinuityDensity: Array<\{ hits: number; weight: number \}> = \[\];[\s\S]*?const endpointOcclusionDistanceWeightedDensity = endpointOcclusionSoftContinuityDensity;/;
  if (!pattern.test(helper)) throw new Error("soft endpoint continuity calculation not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionAsymmetricContinuityDensity: Array<{ hits: number; weight: number }> = [];
          let continuityAuthority = 1;
          for (const offset of [1, 2, 3]) {
            const hits = binHits.get(bin + direction * offset) ?? 0;
            const supportRatio = Math.min(1, hits / Math.max(1, resumedBinMinHits));
            const nearOcclusionPenalty = offset === 1 ? 1.6 : offset === 2 ? 1.2 : 1;
            continuityAuthority *= supportRatio ** nearOcclusionPenalty;
            if (hits > 0 && continuityAuthority >= 0.18) {
              endpointOcclusionAsymmetricContinuityDensity.push({
                hits,
                weight: (4 - offset) * continuityAuthority
              });
            }
            if (continuityAuthority < 0.18) break;
          }
          const endpointOcclusionDistanceWeightedDensity = endpointOcclusionAsymmetricContinuityDensity;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-asymmetric-continuity.mjs");
console.log("three-sided fallback endpoint continuity now penalizes weak support nearest the occlusion");