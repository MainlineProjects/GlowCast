import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "endpointOcclusionStrengthSupported";

if (!source.includes(marker)) {
  const occupiedPattern = /const occupied = new Set<number>\(\);\s*\n\s*for \(const value of values\) \{\s*\n\s*const normalized = Math\.max\(0, Math\.min\(0\.999999, \(value - start\) \/ Math\.max\(length, 0\.01\)\)\);\s*\n\s*occupied\.add\(Math\.floor\(normalized \* binCount\)\);\s*\n\s*\}/;
  const occupiedMatch = source.match(occupiedPattern);
  if (!occupiedMatch) throw new Error("fallback edge occupancy accumulation not found");

  source = source.replace(
    occupiedPattern,
    `const occupied = new Set<number>();\n    const binHits = new Map<number, number>();\n    for (const value of values) {\n      const normalized = Math.max(0, Math.min(0.999999, (value - start) / Math.max(length, 0.01)));\n      const bin = Math.floor(normalized * binCount);\n      occupied.add(bin);\n      binHits.set(bin, (binHits.get(bin) ?? 0) + 1);\n    }`
  );

  const supportPattern = /const touchesEndpoint = runStart === 0 \|\| runEnd === binCount - 1;\s*\n\s*const endpointOcclusionSupported = !touchesEndpoint \|\| \(\s*\n\s*runStart === 0\s*\n\s*\? occupied\.has\(runEnd \+ 1\) && occupied\.has\(runEnd \+ 2\)\s*\n\s*: occupied\.has\(runStart - 1\) && occupied\.has\(runStart - 2\)\s*\n\s*\);/;
  const supportMatch = source.match(supportPattern);
  if (!supportMatch) throw new Error("endpoint occlusion support guard not found");

  source = source.replace(
    supportPattern,
    `const touchesEndpoint = runStart === 0 || runEnd === binCount - 1;\n        const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));\n        const endpointOcclusionStrengthSupported = (bin: number): boolean => (binHits.get(bin) ?? 0) >= resumedBinMinHits;\n        const endpointOcclusionSupported = !touchesEndpoint || (\n          runStart === 0\n            ? endpointOcclusionStrengthSupported(runEnd + 1) && endpointOcclusionStrengthSupported(runEnd + 2)\n            : endpointOcclusionStrengthSupported(runStart - 1) && endpointOcclusionStrengthSupported(runStart - 2)\n        );`
  );
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-strength.mjs");
console.log("three-sided fallback endpoint occlusion tolerance now requires substantial resumed edge support");
