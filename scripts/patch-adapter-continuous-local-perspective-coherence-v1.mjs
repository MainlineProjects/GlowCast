import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const localityWeight = 1 + (0.35 * Math.exp(-0.80 * Math.max(0, sample.distance - 1)));";
const discreteWeightBlock = /const localityWeight = sample\.distance <= 1\s*\? 1\.35\s*: \(sample\.distance === 2 \? 1\.15 : 1\);/;

if (!source.includes(marker)) {
  if (!discreteWeightBlock.test(source)) {
    throw new Error("Unable to locate discrete locality weighting for continuous falloff patch");
  }

  source = source.replace(discreteWeightBlock,
    "const localityWeight = 1 + (0.35 * Math.exp(-0.80 * Math.max(0, sample.distance - 1)));"
  );
}

await fs.writeFile(path, source);
await import("./smoke-continuous-local-perspective-coherence.mjs");
console.log("perspective spacing coherence now falls off continuously with distance from the suspected gap");
