import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const leftCleanSupportDistance = cleanSupportDistanceForSide(-1);";
const distanceOnlyLine = "distance: Math.abs(supportPoint.index - candidateIndex),";
const signedDistanceLines = `distance: Math.abs(supportPoint.index - candidateIndex),
                          offset: supportPoint.index - candidateIndex,`;

if (!source.includes("offset: supportPoint.index - candidateIndex,")) {
  if (!source.includes(distanceOnlyLine)) {
    throw new Error("Unable to locate support residual distance for side-aware clean support");
  }
  source = source.replace(distanceOnlyLine, signedDistanceLines);
}

const globalCleanSupportBlock = `const retainedSupportResiduals = supportResiduals
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
                    const localityDecay = 0.80 * Math.sqrt(2 / effectiveCleanSupportDistance);`;

const sideAwareCleanSupportBlock = `const retainedSupportResiduals = supportResiduals
                      .filter((_, index) => index !== trimmedSupportIndex);
                    const cleanSupportResidualLimit = Math.log(1.10);
                    const cleanSupportDistanceForSide = (side: -1 | 1) => {
                      const sideSamples = retainedSupportResiduals
                        .filter((sample) => Math.sign(sample.offset) === side);
                      if (!sideSamples.length) return 2;
                      const sideMaxSupportDistance = Math.max(2, ...sideSamples.map((sample) => sample.distance));
                      const firstSideCoherenceBreakDistance = Math.min(
                        ...sideSamples
                          .filter((sample) => sample.residual > cleanSupportResidualLimit)
                          .map((sample) => sample.distance),
                        Number.POSITIVE_INFINITY,
                      );
                      return Number.isFinite(firstSideCoherenceBreakDistance)
                        ? Math.max(2, Math.min(sideMaxSupportDistance, firstSideCoherenceBreakDistance - 1))
                        : sideMaxSupportDistance;
                    };
                    const leftCleanSupportDistance = cleanSupportDistanceForSide(-1);
                    const rightCleanSupportDistance = cleanSupportDistanceForSide(1);
                    const effectiveCleanSupportDistance = Math.max(
                      2,
                      leftCleanSupportDistance,
                      rightCleanSupportDistance,
                    );
                    const localityDecay = 0.80 * Math.sqrt(2 / effectiveCleanSupportDistance);`;

if (!source.includes(marker)) {
  if (!source.includes(globalCleanSupportBlock)) {
    throw new Error("Unable to locate global clean-support block for side-aware perspective support");
  }
  source = source.replace(globalCleanSupportBlock, sideAwareCleanSupportBlock);
}

await fs.writeFile(path, source);
await import("./smoke-side-aware-clean-support-perspective.mjs");
console.log("perspective coherence now keeps clean facade support independently on each side of a suspected gap");
