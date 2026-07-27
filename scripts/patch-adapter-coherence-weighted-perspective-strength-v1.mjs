import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "const spacingConsistency = Math.max(0, Math.min(1, 1 - (supportConsistencyResidual / Math.log(1.10))));";
const strengthLine = "const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18);";

if (!source.includes(marker)) {
  if (!source.includes(strengthLine)) {
    throw new Error("Unable to locate strength-aware perspective weighting for spacing-coherence patch");
  }

  source = source.replace(strengthLine, `const supportLogResiduals = remainingSupport
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
                    const perspectiveStrength = Math.min(1, Math.abs(robustSlope) / 0.18) * spacingConsistency;`);
}

await fs.writeFile(path, source);
await import("./smoke-coherence-weighted-perspective-strength.mjs");
console.log("perspective strictness now requires both slope strength and coherent supporting spacing");
