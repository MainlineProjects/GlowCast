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
  if (!pattern.test(helper)) throw new Error("distance-weighted endpoint density samples not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionContinuityAwareDensity = [1, 2, 3]
            .map((offset) => {
              const hits = binHits.get(bin + direction * offset) ?? 0;
              const uninterrupted = Array.from({ length: offset }, (_, index) =>
                binHits.get(bin + direction * (index + 1)) ?? 0
              ).every((intermediateHits) => intermediateHits > 0);
              return {
                hits,
                weight: uninterrupted ? 4 - offset : 0
              };
            })
            .filter((sample) => sample.hits > 0 && sample.weight > 0);
          const endpointOcclusionDistanceWeightedDensity = endpointOcclusionContinuityAwareDensity;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-continuity-aware-density.mjs");
console.log("three-sided fallback endpoint density now ignores support across empty continuity gaps");
