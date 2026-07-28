import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "endpointOcclusionRobustDensitySupported";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const surroundingMean = surroundingHits\.length > 0\s*\n\s*\? surroundingHits\.reduce\(\(sum, hits\) => sum \+ hits, 0\) \/ surroundingHits\.length\s*\n\s*: resumedBinMinHits;\s*\n\s*const relativeMinHits = Math\.max\(resumedBinMinHits, Math\.ceil\(surroundingMean \* 0\.55\)\);/;
  if (!pattern.test(helper)) throw new Error("density-relative endpoint support calculation not found");

  helper = helper.replace(
    pattern,
    `const sortedSurroundingHits = [...surroundingHits].sort((a, b) => a - b);
          const endpointOcclusionRobustDensitySupported = sortedSurroundingHits.length > 0
            ? sortedSurroundingHits[Math.floor((sortedSurroundingHits.length - 1) / 2)]
            : resumedBinMinHits;
          const relativeMinHits = Math.max(
            resumedBinMinHits,
            Math.ceil(endpointOcclusionRobustDensitySupported * 0.55)
          );`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-robust-density.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-distance-weighted-density-v1.mjs");
console.log("three-sided fallback endpoint density normalization now resists one isolated dense bin");
