import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const abruptSpacingDirectionBreak = alignedNeighbors.length >= 3 && hasAbruptSpacingDirectionBreak(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak;`;

const newBlock = `const abruptSpacingDirectionBreak = alignedNeighbors.length >= 3 && hasAbruptSpacingDirectionBreak(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const hasLocalizedSpacingOutlier = (steps: number[]) => steps.some((current, index) => {
        if (index === 0 || index === steps.length - 1) return false;
        const previous = Math.max(steps[index - 1], 0.01);
        const next = Math.max(steps[index + 1], 0.01);
        const expected = Math.sqrt(previous * next);
        const localRatio = current / Math.max(expected, 0.01);
        const visiblyWiderThanNeighbors = current >= Math.max(previous, next) * 1.08;
        return visiblyWiderThanNeighbors && localRatio >= 1.24 && localRatio < 1.65;
      });
      const localizedSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak || localizedSpacingOutlier;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const localizedSpacingOutlier = alignedNeighbors.length >= 3")) {
  throw new Error("Unable to locate spacing direction-break guard for localized spacing outlier patch");
}

await fs.writeFile(path, source);
console.log("repeated-row ranking now suppresses isolated locally oversized spacing intervals without disturbing smooth perspective trends");
