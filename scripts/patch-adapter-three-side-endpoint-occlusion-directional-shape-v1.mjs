import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionDirectionalShapeCoherence";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const nearestResumedHits = binHits\.get\(bin \+ direction\) \?\? 0;\s*const nextResumedHits = binHits\.get\(bin \+ direction \* 2\) \?\? 0;\s*const endpointOcclusionCornerCoherence = Math\.min\(\s*1,\s*Math\.min\(nearestResumedHits, nextResumedHits\) \/\s*Math\.max\(1, Math\.max\(nearestResumedHits, nextResumedHits\)\)\s*\);/;
  if (!pattern.test(helper)) throw new Error("corner-coherence endpoint density block not found");

  helper = helper.replace(
    pattern,
    `const nearestResumedHits = binHits.get(bin + direction) ?? 0;
          const nextResumedHits = binHits.get(bin + direction * 2) ?? 0;
          const thirdResumedHits = binHits.get(bin + direction * 3) ?? 0;
          const endpointOcclusionCornerBalance = Math.min(
            1,
            Math.min(nearestResumedHits, nextResumedHits) /
              Math.max(1, Math.max(nearestResumedHits, nextResumedHits))
          );
          const endpointOcclusionDirectionalPersistence = nextResumedHits <= 0
            ? 0
            : Math.min(1, thirdResumedHits / nextResumedHits);
          const endpointOcclusionDirectionalShapeCoherence = Math.sqrt(
            endpointOcclusionCornerBalance * endpointOcclusionDirectionalPersistence
          );
          const endpointOcclusionCornerCoherence = endpointOcclusionDirectionalShapeCoherence;`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-directional-shape.mjs");
console.log("endpoint density relief now requires a sustained directional edge shape");
