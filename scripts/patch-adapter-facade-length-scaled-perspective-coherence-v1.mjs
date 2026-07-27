import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const localityDecay = 0.80 * Math.sqrt(2 / maxSupportDistance);";
const continuousBlock = `const weightedConsistencyResiduals = supportResiduals
                      .filter((_, index) => index !== trimmedSupportIndex)
                      .map((sample) => {
                        const localityWeight = 1 + (0.35 * Math.exp(-0.80 * Math.max(0, sample.distance - 1)));
                        return sample.residual * localityWeight;
                      });`;

const scaledBlock = `const maxSupportDistance = Math.max(2, ...supportResiduals.map((sample) => sample.distance));
                    const localityDecay = 0.80 * Math.sqrt(2 / maxSupportDistance);
                    const weightedConsistencyResiduals = supportResiduals
                      .filter((_, index) => index !== trimmedSupportIndex)
                      .map((sample) => {
                        const localityWeight = 1 + (0.35 * Math.exp(-localityDecay * Math.max(0, sample.distance - 1)));
                        return sample.residual * localityWeight;
                      });`;

if (!source.includes(marker)) {
  if (!source.includes(continuousBlock)) {
    throw new Error("Unable to locate continuous locality weighting for facade-length scaling");
  }
  source = source.replace(continuousBlock, scaledBlock);
}

await fs.writeFile(path, source);
await import("./smoke-facade-length-scaled-perspective-coherence.mjs");
await import("./patch-adapter-clean-support-length-perspective-coherence-v1.mjs");
console.log("perspective spacing coherence now scales locality falloff with facade support length");
