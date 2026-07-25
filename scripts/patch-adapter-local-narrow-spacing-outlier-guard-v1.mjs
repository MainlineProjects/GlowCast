import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const localizedSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak || localizedSpacingOutlier;`;

const newBlock = `const localizedSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const hasLocalizedNarrowSpacingOutlier = (steps: number[]) => steps.some((current, index) => {
        if (index === 0 || index === steps.length - 1) return false;
        const previous = Math.max(steps[index - 1], 0.01);
        const next = Math.max(steps[index + 1], 0.01);
        const expected = Math.sqrt(previous * next);
        const localRatio = current / Math.max(expected, 0.01);
        const visiblyNarrowerThanNeighbors = current <= Math.min(previous, next) * 0.82;
        const likelyPairedAssembly = localRatio < 0.5;
        return visiblyNarrowerThanNeighbors && localRatio >= 0.56 && localRatio <= 0.76 && !likelyPairedAssembly;
      });
      const localizedNarrowSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedNarrowSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak || localizedSpacingOutlier || localizedNarrowSpacingOutlier;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const localizedNarrowSpacingOutlier = alignedNeighbors.length >= 3")) {
  throw new Error("Unable to locate localized spacing guard for narrow-spacing outlier patch");
}

await fs.writeFile(path, source);
console.log("repeated-row ranking now suppresses isolated locally narrow spacing intervals while preserving very tight paired assemblies");
