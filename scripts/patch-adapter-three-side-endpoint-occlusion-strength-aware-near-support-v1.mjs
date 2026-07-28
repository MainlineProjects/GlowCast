import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "endpointOcclusionNearSupportStrengthAuthority";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const endpointOcclusionNearSupportCappedFarHits = Math\.min\(\s*nextResumedHits,\s*nearestResumedHits \* 2\s*\);/;
  if (!pattern.test(helper)) throw new Error("near-support-gated far-hit cap not found");

  helper = helper.replace(
    pattern,
    `const endpointOcclusionNearSupportStrengthAuthority = Math.min(
            1,
            nearestResumedHits / Math.max(1, endpointOcclusionShortEdgeEvidenceCapacity)
          );
          const endpointOcclusionNearSupportCappedFarHits = Math.min(
            nextResumedHits,
            nearestResumedHits * (1 + endpointOcclusionNearSupportStrengthAuthority)
          );`
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-strength-aware-near-support.mjs");
await import("./patch-adapter-stable-mask-candidate-ids-v1.mjs");
console.log("distant short-edge support now scales with the strength of near-obstruction evidence");
