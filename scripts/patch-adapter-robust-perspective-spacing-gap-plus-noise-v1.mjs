import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `        if (localPoolAxisSteps.length >= 3) {
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
            if (candidateRatio > 1.58 && supportResidualRatio <= 1.10) return true;

            if (localPoolAxisSteps.length >= 4) {
              for (let left = 0; left < support.length - 1; left += 1) {
                for (let right = left + 1; right < support.length; right += 1) {
                  const first = support[left];
                  const second = support[right];
                  const robustSlope = (second.value - first.value) / Math.max(second.index - first.index, 1);
                  if (Math.abs(robustSlope) > 0.55) continue;
                  const robustIntercept = first.value - (robustSlope * first.index);
                  const robustExpectedStep = Math.exp(robustIntercept + (robustSlope * candidateIndex));
                  const robustCandidateRatio = step / Math.max(robustExpectedStep, 1e-6);
                  if (robustCandidateRatio <= 1.58) continue;
                  const remainingSupport = support.filter((_, index) => index !== left && index !== right);
                  const remainingSupportHasNoLargeGap = remainingSupport.every((point) => {
                    const predictedStep = Math.exp(robustIntercept + (robustSlope * point.index));
                    return Math.exp(point.value) / Math.max(predictedStep, 1e-6) <= 1.25;
                  });
                  if (remainingSupportHasNoLargeGap) return true;
                }
              }
            }
            return false;
          });
          if (hasCoherentMissingOpeningGap) return false;
        }`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const remainingSupportHasNoLargeGap = remainingSupport.every")) {
  throw new Error("Unable to locate robust perspective spacing consensus block for gap-plus-noise patch");
}

await fs.writeFile(path, source);
await import("./smoke-robust-perspective-spacing-gap-plus-noise.mjs");
console.log("endpoint spacing now keeps detecting coherent missing-opening gaps despite one separate compressed noisy interval");
