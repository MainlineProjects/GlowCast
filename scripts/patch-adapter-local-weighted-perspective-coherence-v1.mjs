import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const localityWeight = sample.distance <= 1";
const oldBlock = `const supportLogResiduals = remainingSupport
                      .map((supportPoint) => {
                        const supportPredictedStep = Math.exp(robustIntercept + (robustSlope * supportPoint.index));
                        const supportRatio = Math.exp(supportPoint.value) / Math.max(supportPredictedStep, 1e-6);
                        return Math.abs(Math.log(Math.max(supportRatio, 1e-6)));
                      })
                      .sort((a, b) => a - b);
                    const consistencyResiduals = supportLogResiduals.length >= 3
                      ? supportLogResiduals.slice(0, -1)
                      : supportLogResiduals;
                    const supportConsistencyResidual = Math.max(0, ...consistencyResiduals);
                    const spacingConsistency = Math.max(0, Math.min(1,
                      1 - (supportConsistencyResidual / Math.log(1.10))
                    ));
                    const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18) * spacingConsistency;`;

const newBlock = `const supportResiduals = remainingSupport
                      .map((supportPoint) => {
                        const supportPredictedStep = Math.exp(robustIntercept + (robustSlope * supportPoint.index));
                        const supportRatio = Math.exp(supportPoint.value) / Math.max(supportPredictedStep, 1e-6);
                        return {
                          residual: Math.abs(Math.log(Math.max(supportRatio, 1e-6))),
                          distance: Math.abs(supportPoint.index - candidateIndex),
                        };
                      });
                    let trimmedSupportIndex = -1;
                    if (supportResiduals.length >= 3) {
                      let largestDistantResidual = -1;
                      supportResiduals.forEach((sample, index) => {
                        if (sample.distance <= 1) return;
                        if (sample.residual > largestDistantResidual) {
                          largestDistantResidual = sample.residual;
                          trimmedSupportIndex = index;
                        }
                      });
                    }
                    const weightedConsistencyResiduals = supportResiduals
                      .filter((_, index) => index !== trimmedSupportIndex)
                      .map((sample) => {
                        const localityWeight = sample.distance <= 1
                          ? 1.35
                          : (sample.distance === 2 ? 1.15 : 1);
                        return sample.residual * localityWeight;
                      });
                    const supportConsistencyResidual = Math.max(0, ...weightedConsistencyResiduals);
                    const spacingConsistency = Math.max(0, Math.min(1,
                      1 - (supportConsistencyResidual / Math.log(1.10))
                    ));
                    const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18) * spacingConsistency;`;

if (!source.includes(marker)) {
  if (!source.includes(oldBlock)) {
    throw new Error("Unable to locate coherence-weighted perspective block for local weighting");
  }
  source = source.replace(oldBlock, newBlock);
}

await fs.writeFile(path, source);
await import("./smoke-local-weighted-perspective-coherence.mjs");
console.log("perspective spacing coherence now weights evidence nearest the suspected gap most strongly");
