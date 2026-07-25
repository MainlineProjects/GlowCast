import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges;`;

const newBlock = `const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;
      const hasAbruptSpacingDirectionBreak = (steps: number[]) => {
        const inspect = (orderedSteps: number[]) => {
          const deltas = orderedSteps.slice(1).map((step, index) => Math.log(Math.max(step, 0.01) / Math.max(orderedSteps[index], 0.01)));
          return deltas.some((current, index) => {
            if (index < 2) return false;
            const previousOne = deltas[index - 1];
            const previousTwo = deltas[index - 2];
            const previousDirection = Math.sign(previousOne);
            const sustainedDirection = previousDirection !== 0 && Math.sign(previousTwo) === previousDirection && Math.abs(previousOne) >= 0.035 && Math.abs(previousTwo) >= 0.035;
            const abruptReversal = Math.sign(current) === -previousDirection && Math.abs(current) >= 0.2;
            const priorTurn = Math.max(Math.abs(previousOne), Math.abs(previousTwo));
            return sustainedDirection && abruptReversal && Math.abs(current) >= priorTurn * 1.8;
          });
        };
        return inspect(steps) || inspect([...steps].reverse());
      };
      const abruptSpacingDirectionBreak = alignedNeighbors.length >= 3 && hasAbruptSpacingDirectionBreak(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const abruptSpacingDirectionBreak = alignedNeighbors.length >= 3")) {
  throw new Error("Unable to locate local spacing-trend outlier block for direction-break guarding");
}

await fs.writeFile(path, source);
console.log("repeated-row ranking now suppresses abrupt spacing-direction breaks while preserving smooth perspective curvature");
