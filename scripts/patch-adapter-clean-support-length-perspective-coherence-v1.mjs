import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const effectiveCleanSupportDistance = Number.isFinite(firstCoherenceBreakDistance)";
const scaledBlock = `const maxSupportDistance = Math.max(2, ...supportResiduals.map((sample) => sample.distance));
                    const localityDecay = 0.80 * Math.sqrt(2 / maxSupportDistance);
                    const weightedConsistencyResiduals = supportResiduals
                      .filter((_, index) => index !== trimmedSupportIndex)
                      .map((sample) => {
                        const localityWeight = 1 + (0.35 * Math.exp(-localityDecay * Math.max(0, sample.distance - 1)));
                        return sample.residual * localityWeight;
                      });`;

const cleanSupportBlock = `const retainedSupportResiduals = supportResiduals
                      .filter((_, index) => index !== trimmedSupportIndex);
                    const maxSupportDistance = Math.max(2, ...retainedSupportResiduals.map((sample) => sample.distance));
                    const cleanSupportResidualLimit = Math.log(1.10);
                    const firstCoherenceBreakDistance = Math.min(
                      ...retainedSupportResiduals
                        .filter((sample) => sample.residual > cleanSupportResidualLimit)
                        .map((sample) => sample.distance),
                      Number.POSITIVE_INFINITY,
                    );
                    const effectiveCleanSupportDistance = Number.isFinite(firstCoherenceBreakDistance)
                      ? Math.max(2, Math.min(maxSupportDistance, firstCoherenceBreakDistance - 1))
                      : maxSupportDistance;
                    const localityDecay = 0.80 * Math.sqrt(2 / effectiveCleanSupportDistance);
                    const weightedConsistencyResiduals = retainedSupportResiduals
                      .map((sample) => {
                        const localityWeight = 1 + (0.35 * Math.exp(-localityDecay * Math.max(0, sample.distance - 1)));
                        return sample.residual * localityWeight;
                      });`;

if (!source.includes(marker)) {
  if (!source.includes(scaledBlock)) {
    throw new Error("Unable to locate facade-length-scaled locality weighting for clean support length");
  }
  source = source.replace(scaledBlock, cleanSupportBlock);
}

await fs.writeFile(path, source);
await import("./smoke-clean-support-length-perspective-coherence.mjs");
await import("./patch-adapter-side-aware-clean-support-perspective-v1.mjs");
console.log("perspective spacing coherence now scales locality by continuous clean facade support");
