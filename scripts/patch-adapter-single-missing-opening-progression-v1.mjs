import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `          const spacingProgresses = shrinkingForward ? gaps[1] <= gaps[0] * 1.25 + 1 : gaps[0] <= gaps[1] * 1.25 + 1;
          return spacingProgresses ? 1 : 0;`;

const newBlock = `          const spacingProgresses = shrinkingForward ? gaps[1] <= gaps[0] * 1.25 + 1 : gaps[0] <= gaps[1] * 1.25 + 1;
          const centerSteps = rowLike
            ? [
                (ordered[1].box.x + ordered[1].box.width / 2) - (ordered[0].box.x + ordered[0].box.width / 2),
                (ordered[2].box.x + ordered[2].box.width / 2) - (ordered[1].box.x + ordered[1].box.width / 2)
              ]
            : [
                (ordered[1].box.y + ordered[1].box.height / 2) - (ordered[0].box.y + ordered[0].box.height / 2),
                (ordered[2].box.y + ordered[2].box.height / 2) - (ordered[1].box.y + ordered[1].box.height / 2)
              ];
          const smallerCenterStep = Math.max(0.01, Math.min(...centerSteps));
          const largerCenterStep = Math.max(...centerSteps);
          const missingOpeningStepRatio = largerCenterStep / smallerCenterStep;
          const openingSpanReference = Math.max(...ordered.map((member) => rowLike ? member.box.width : member.box.height));
          const axisSpan = rowLike ? bounds.width : bounds.height;
          const missingOpeningBridge = !spacingProgresses &&
            missingOpeningStepRatio >= 1.45 &&
            missingOpeningStepRatio <= 2.75 &&
            largerCenterStep <= Math.min(axisSpan * 0.38, openingSpanReference * 5.2);
          return spacingProgresses || missingOpeningBridge ? 1 : 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const missingOpeningBridge = !spacingProgresses")) {
  throw new Error("Unable to locate perspective spacing progression block for missing-opening bridge support");
}

await fs.writeFile(path, source);
console.log("perspective group ranking now preserves coherent repeated rows across one bounded missing opening");
