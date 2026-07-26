import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `        if (localPoolAxisSteps.length >= 3) {
          const lastStepIndex = localPoolAxisSteps.length - 1;
          const normalizedGapRatios = localPoolAxisSteps.map((step, index) => {
            let expectedStep;
            if (index === 0) {
              expectedStep = (localPoolAxisSteps[1] ** 2) / Math.max(localPoolAxisSteps[2], 1e-6);
            } else if (index === lastStepIndex) {
              expectedStep = (localPoolAxisSteps[lastStepIndex - 1] ** 2) /
                Math.max(localPoolAxisSteps[lastStepIndex - 2], 1e-6);
            } else {
              expectedStep = Math.sqrt(localPoolAxisSteps[index - 1] * localPoolAxisSteps[index + 1]);
            }
            return step / Math.max(expectedStep, 1e-6);
          });
          if (Math.max(...normalizedGapRatios) > 1.58) return false;
        }`;

const newBlock = `        if (localPoolAxisSteps.length >= 3) {
          const logPoolAxisSteps = localPoolAxisSteps.map((step) => Math.log(Math.max(step, 1e-6)));
          const hasCoherentMissingOpeningGap = localPoolAxisSteps.some((step, candidateIndex) => {
            const support = logPoolAxisSteps
              .map((value, index) => ({ index, value }))
              .filter(({ index }) => index !== candidateIndex);
            const meanIndex = support.reduce((sum, point) => sum + point.index, 0) / support.length;
            const meanLogStep = support.reduce((sum, point) => sum + point.value, 0) / support.length;
            const denominator = support.reduce((sum, point) => sum + ((point.index - meanIndex) ** 2), 0);
            const slope = denominator > 0
              ? support.reduce((sum, point) => sum + ((point.index - meanIndex) * (point.value - meanLogStep)), 0) / denominator
              : 0;
            const intercept = meanLogStep - (slope * meanIndex);
            const expectedStep = Math.exp(intercept + (slope * candidateIndex));
            const candidateRatio = step / Math.max(expectedStep, 1e-6);
            const supportResidualRatio = Math.max(...support.map((point) =>
              Math.exp(Math.abs(point.value - (intercept + (slope * point.index)))),
            ));
            return candidateRatio > 1.58 && supportResidualRatio <= 1.10;
          });
          if (hasCoherentMissingOpeningGap) return false;
        }`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const hasCoherentMissingOpeningGap = localPoolAxisSteps.some")) {
  throw new Error("Unable to locate perspective-normalized endpoint spacing block for robust consensus patch");
}

await fs.writeFile(path, source);
await import("./smoke-robust-perspective-spacing-consensus.mjs");
console.log("endpoint spacing now requires coherent leave-one-out perspective evidence before declaring a missing-opening gap");
