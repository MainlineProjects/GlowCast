import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionAvailableDirectionalBins";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionDirectionalPersistence = nextResumedHits <= 0\s*\? 0\s*:\s*Math\.min\(1, thirdResumedHits \/ nextResumedHits\);/;
  if (!pattern.test(helper)) throw new Error("directional persistence block not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionAvailableDirectionalBins = direction > 0 ? 7 - bin : bin;
          const endpointOcclusionDirectionalPersistence = endpointOcclusionAvailableDirectionalBins < 3
            ? 1
            : nextResumedHits <= 0
              ? 0
              : Math.min(1, thirdResumedHits / nextResumedHits);`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-distance-normalized-shape.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-evidence-capacity-v1.mjs");
console.log("endpoint directional shape persistence now respects remaining edge span");
