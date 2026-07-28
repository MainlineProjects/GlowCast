import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionCornerCoherence";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionEdgePositionAwareDensity = resumedDistanceFromEdge <= 0\s*\? 0\.72\s*: resumedDistanceFromEdge === 1\s*\? 0\.86\s*: 1;/;
  if (!pattern.test(helper)) throw new Error("edge-position-aware endpoint density factor not found");

  helper = helper.replace(
    pattern,
    `const nearestResumedHits = binHits.get(bin + direction) ?? 0;
          const nextResumedHits = binHits.get(bin + direction * 2) ?? 0;
          const endpointOcclusionCornerCoherence = Math.min(
            1,
            Math.min(nearestResumedHits, nextResumedHits) /
              Math.max(1, Math.max(nearestResumedHits, nextResumedHits))
          );
          const endpointPositionRelief = resumedDistanceFromEdge <= 0
            ? 0.72
            : resumedDistanceFromEdge === 1
              ? 0.86
              : 1;
          const endpointOcclusionEdgePositionAwareDensity = endpointPositionRelief +
            (1 - endpointPositionRelief) * (1 - endpointOcclusionCornerCoherence);`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-corner-coherence.mjs");
console.log("endpoint density relief now requires coherent support beyond natural corners");
