import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "endpointOcclusionDistanceWeightedDensity";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const sortedSurroundingHits = \[\.\.\.surroundingHits\]\.sort\(\(a, b\) => a - b\);\s*const endpointOcclusionRobustDensitySupported = sortedSurroundingHits\.length > 0\s*\? sortedSurroundingHits\[Math\.floor\(\(sortedSurroundingHits\.length - 1\) \/ 2\)\]\s*: resumedBinMinHits;/;
  if (!pattern.test(helper)) throw new Error("robust endpoint density calculation not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionDistanceWeightedDensity = [1, 2, 3]
            .map((offset) => ({
              hits: binHits.get(bin + direction * offset) ?? 0,
              weight: 4 - offset
            }))
            .filter((sample) => sample.hits > 0);
          const sortedSurroundingHits = endpointOcclusionDistanceWeightedDensity
            .map((sample) => sample.hits)
            .sort((a, b) => a - b);
          const robustCap = sortedSurroundingHits.length > 1
            ? sortedSurroundingHits[sortedSurroundingHits.length - 2]
            : sortedSurroundingHits[0] ?? resumedBinMinHits;
          const weightedDensityTotal = endpointOcclusionDistanceWeightedDensity.reduce(
            (sum, sample) => sum + Math.min(sample.hits, robustCap) * sample.weight,
            0
          );
          const weightedDensityWeight = endpointOcclusionDistanceWeightedDensity.reduce(
            (sum, sample) => sum + sample.weight,
            0
          );
          const endpointOcclusionRobustDensitySupported = weightedDensityWeight > 0
            ? weightedDensityTotal / weightedDensityWeight
            : resumedBinMinHits;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-distance-weighted-density.mjs");
console.log("three-sided fallback endpoint density now favors nearby robust support");
