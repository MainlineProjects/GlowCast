import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "endpointOcclusionSupported";

if (!source.includes(marker)) {
  const pattern = /const touchesEndpoint = runStart === 0 \|\| runEnd === binCount - 1;\s*\n\s*const allowedRatio = touchesEndpoint \? 0\.375 : 0\.25;/;
  const match = source.match(pattern);
  if (!match) throw new Error("position-aware endpoint gap allowance not found");

  source = source.replace(
    pattern,
    `const touchesEndpoint = runStart === 0 || runEnd === binCount - 1;\n        const endpointOcclusionSupported = !touchesEndpoint || (\n          runStart === 0\n            ? occupied.has(runEnd + 1) && occupied.has(runEnd + 2)\n            : occupied.has(runStart - 1) && occupied.has(runStart - 2)\n        );\n        const allowedRatio = touchesEndpoint && endpointOcclusionSupported ? 0.375 : 0.25;`
  );
}

await fs.writeFile(path, source);
await import("./smoke-three-side-endpoint-occlusion-support.mjs");
await import("./patch-adapter-three-side-endpoint-occlusion-strength-v1.mjs");
console.log("three-sided fallback endpoint tolerance now requires strong support immediately after the occlusion");
