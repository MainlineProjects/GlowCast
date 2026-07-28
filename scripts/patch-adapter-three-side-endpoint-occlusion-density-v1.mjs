import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "endpointOcclusionDensitySupported";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function getFallbackWorstPresentGapRisk(");
  const helperEnd = source.indexOf("\nfunction buildFallbackComponents(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("fallback edge-gap helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const pattern = /const resumedBinMinHits = Math\.max\(2, Math\.ceil\(minHits \* 0\.45\)\);\s*\n\s*const endpointOcclusionStrengthSupported = \(bin: number\): boolean => \(binHits\.get\(bin\) \?\? 0\) >= resumedBinMinHits;/;
  if (!pattern.test(helper)) throw new Error("strength-aware endpoint support guard not found");

  helper = helper.replace(
    pattern,
    `const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));
        const endpointOcclusionDensitySupported = (bin: number, direction: -1 | 1): boolean => {
          const surroundingHits = [1, 2, 3]
            .map((offset) => binHits.get(bin + direction * offset) ?? 0)
            .filter((hits) => hits > 0);
          const surroundingMean = surroundingHits.length > 0
            ? surroundingHits.reduce((sum, hits) => sum + hits, 0) / surroundingHits.length
            : resumedBinMinHits;
          const relativeMinHits = Math.max(resumedBinMinHits, Math.ceil(surroundingMean * 0.55));
          return (binHits.get(bin) ?? 0) >= relativeMinHits;
        };
        const endpointOcclusionStrengthSupported = (bin: number, direction: -1 | 1): boolean =>
          endpointOcclusionDensitySupported(bin, direction);`
  );

  helper = helper.replace(
    /endpointOcclusionStrengthSupported\(runEnd \+ 1\) && endpointOcclusionStrengthSupported\(runEnd \+ 2\)/,
    "endpointOcclusionStrengthSupported(runEnd + 1, 1) && endpointOcclusionStrengthSupported(runEnd + 2, 1)"
  );
  helper = helper.replace(
    /endpointOcclusionStrengthSupported\(runStart - 1\) && endpointOcclusionStrengthSupported\(runStart - 2\)/,
    "endpointOcclusionStrengthSupported(runStart - 1, -1) && endpointOcclusionStrengthSupported(runStart - 2, -1)"
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-density.mjs");
console.log("three-sided fallback endpoint occlusion support now scales with surrounding edge density");
