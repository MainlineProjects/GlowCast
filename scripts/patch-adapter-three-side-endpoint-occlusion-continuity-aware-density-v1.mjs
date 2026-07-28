import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "endpointOcclusionContinuityAwareDensity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionDistanceWeightedDensity = \[1, 2, 3\][\s\S]*?\.filter\(\(sample\) => sample\.hits > 0\);/;
  if (!pattern.test(helper)) throw new Error("distance-weighted endpoint density calculation not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionContinuityAwareDensity: Array<{ hits: number; weight: number }> = [];
          for (const offset of [1, 2, 3]) {
            const hits = binHits.get(bin + direction * offset) ?? 0;
            if (hits <= 0) break;
            endpointOcclusionContinuityAwareDensity.push({ hits, weight: 4 - offset });
          }
          const endpointOcclusionDistanceWeightedDensity = endpointOcclusionContinuityAwareDensity;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-continuity-aware-density.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-soft-continuity-v1.mjs");
console.log("three-sided fallback endpoint density now ignores support beyond continuity breaks");
