import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBias = `const curvatureVerticalLocationBias = Math.abs(
          positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, positiveVerticalSamples.length)
          - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, negativeVerticalSamples.length)
        );`;
const newBias = `const curvatureVerticalLocationBias = (
          positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, positiveVerticalSamples.length)
          - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, negativeVerticalSamples.length)
        );`;

if (source.includes(oldBias)) {
  source = source.replace(oldBias, newBias);
} else if (!source.includes("const curvatureVerticalLocationBias = (")) {
  throw new Error("Unable to locate location-aware curvature bias for top-arch coherence patch");
}

await fs.writeFile(path, source);
await import("./smoke-top-arch-location-coherence-ranking.mjs");
console.log("paired-mask curvature now distinguishes upper architectural arches from lower smooth bulges");
