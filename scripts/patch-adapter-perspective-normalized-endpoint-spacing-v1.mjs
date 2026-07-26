import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `        const localPoolAxisSteps = localPool.slice(1).map((member, index) =>
          axisCoordinate(member) - axisCoordinate(localPool[index]),
        ).filter((step) => step > 0);
        if (localPoolAxisSteps.length >= 3) {
          const medianPoolAxisStep = median(localPoolAxisSteps);
          const largestPoolAxisStep = Math.max(...localPoolAxisSteps);
          if (largestPoolAxisStep > medianPoolAxisStep * 1.75) return false;
        }
        const supportCandidates = [localPool];`;

const newBlock = `        const localPoolAxisSteps = localPool.slice(1).map((member, index) =>
          axisCoordinate(member) - axisCoordinate(localPool[index]),
        ).filter((step) => step > 0);
        if (localPoolAxisSteps.length >= 3) {
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
        }
        const supportCandidates = [localPool];`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const normalizedGapRatios = localPoolAxisSteps.map")) {
  throw new Error("Unable to locate spacing-aware endpoint support block for perspective-normalized patch");
}

await fs.writeFile(path, source);
await import("./smoke-perspective-normalized-endpoint-spacing.mjs");
console.log("endpoint support spacing now follows local perspective progression while still rejecting missing-opening-sized gaps");
