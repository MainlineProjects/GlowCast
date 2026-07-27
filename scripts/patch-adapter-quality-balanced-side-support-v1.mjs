import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const cleanSupportQualityForSide = (side: -1 | 1, distance: number) => {";
const oldBlock = `const leftCleanSupportDistance = cleanSupportDistanceForSide(-1);
                    const rightCleanSupportDistance = cleanSupportDistanceForSide(1);
                    const effectiveCleanSupportDistance = Math.max(
                      2,
                      leftCleanSupportDistance,
                      rightCleanSupportDistance,
                    );
                    const localityDecay = 0.80 * Math.sqrt(2 / effectiveCleanSupportDistance);`;

const newBlock = `const leftCleanSupportDistance = cleanSupportDistanceForSide(-1);
                    const rightCleanSupportDistance = cleanSupportDistanceForSide(1);
                    const cleanSupportQualityForSide = (side: -1 | 1, distance: number) => {
                      const cleanSamples = retainedSupportResiduals.filter((sample) =>
                        Math.sign(sample.offset) === side && sample.distance <= distance,
                      );
                      if (!cleanSamples.length) return 1;
                      const meanResidual = cleanSamples.reduce((sum, sample) => sum + sample.residual, 0) / cleanSamples.length;
                      const normalizedResidual = Math.min(1, meanResidual / cleanSupportResidualLimit);
                      return 1 - 0.55 * normalizedResidual;
                    };
                    const leftCleanSupportQuality = cleanSupportQualityForSide(-1, leftCleanSupportDistance);
                    const rightCleanSupportQuality = cleanSupportQualityForSide(1, rightCleanSupportDistance);
                    const qualityAdjustedSupportDistance = (distance: number, quality: number) =>
                      2 + Math.max(0, distance - 2) * quality;
                    const effectiveCleanSupportDistance = Math.max(
                      2,
                      qualityAdjustedSupportDistance(leftCleanSupportDistance, leftCleanSupportQuality),
                      qualityAdjustedSupportDistance(rightCleanSupportDistance, rightCleanSupportQuality),
                    );
                    const localityDecay = 0.80 * Math.sqrt(2 / effectiveCleanSupportDistance);`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) {
    throw new Error("Unable to locate side-aware clean-support selection for quality balancing");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-quality-balanced-side-support.mjs");
await import("./patch-adapter-robust-side-support-quality-v1.mjs");
console.log("perspective coherence now balances clean support length against side-specific evidence quality");
