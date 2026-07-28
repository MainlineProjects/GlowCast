import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionSoftContinuityDensity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionContinuityAwareDensity: Array<\{ hits: number; weight: number \}> = \[\];[\s\S]*?const endpointOcclusionDistanceWeightedDensity = endpointOcclusionContinuityAwareDensity;/;
  if (!pattern.test(helper)) throw new Error("continuity-aware endpoint density calculation not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionSoftContinuityDensity: Array<{ hits: number; weight: number }> = [];
          let continuityAuthority = 1;
          for (const offset of [1, 2, 3]) {
            const hits = binHits.get(bin + direction * offset) ?? 0;
            const supportRatio = Math.min(1, hits / Math.max(1, resumedBinMinHits));
            continuityAuthority *= supportRatio;
            if (hits > 0 && continuityAuthority >= 0.18) {
              endpointOcclusionSoftContinuityDensity.push({
                hits,
                weight: (4 - offset) * continuityAuthority
              });
            }
            if (continuityAuthority < 0.18) break;
          }
          const endpointOcclusionDistanceWeightedDensity = endpointOcclusionSoftContinuityDensity;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-soft-continuity.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-asymmetric-continuity-v1.mjs");
console.log("three-sided fallback endpoint density now decays softly across weak continuity bins");