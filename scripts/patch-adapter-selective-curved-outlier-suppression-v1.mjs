import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak || localizedSpacingOutlier || localizedNarrowSpacingOutlier;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;`;

const newBlock = `const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak || localizedSpacingOutlier || localizedNarrowSpacingOutlier;
      const isCandidateInteriorGeometricOutlier = (axis: \"row\" | \"column\") => {
        if (alignedNeighbors.length < 3) return false;
        const axisCoordinate = axis === \"row\"
          ? (member: MaskCandidateOutput) => member.box.x + member.box.width / 2
          : (member: MaskCandidateOutput) => member.box.y + member.box.height / 2;
        const crossCoordinate = axis === \"row\"
          ? (member: MaskCandidateOutput) => member.box.y + member.box.height / 2
          : (member: MaskCandidateOutput) => member.box.x + member.box.width / 2;
        const orderedNeighbors = [...alignedNeighbors].sort((left, right) => axisCoordinate(left) - axisCoordinate(right));
        const candidateAxis = axisCoordinate(candidate);
        const firstAxis = axisCoordinate(orderedNeighbors[0]);
        const lastAxis = axisCoordinate(orderedNeighbors[orderedNeighbors.length - 1]);
        if (candidateAxis <= firstAxis || candidateAxis >= lastAxis) return false;

        const predictions: number[] = [];
        for (let leftIndex = 0; leftIndex < orderedNeighbors.length - 1; leftIndex += 1) {
          for (let rightIndex = leftIndex + 1; rightIndex < orderedNeighbors.length; rightIndex += 1) {
            const left = orderedNeighbors[leftIndex];
            const right = orderedNeighbors[rightIndex];
            const span = axisCoordinate(right) - axisCoordinate(left);
            if (span <= 0 || candidateAxis < axisCoordinate(left) || candidateAxis > axisCoordinate(right)) continue;
            const fraction = (candidateAxis - axisCoordinate(left)) / span;
            predictions.push(crossCoordinate(left) + (crossCoordinate(right) - crossCoordinate(left)) * fraction);
          }
        }
        if (predictions.length < 2) return false;
        predictions.sort((left, right) => left - right);
        const middle = Math.floor(predictions.length / 2);
        const predictedCross = predictions.length % 2 === 0
          ? (predictions[middle - 1] + predictions[middle]) / 2
          : predictions[middle];
        const predictionDeviations = predictions
          .map((value) => Math.abs(value - predictedCross))
          .sort((left, right) => left - right);
        const deviationMiddle = Math.floor(predictionDeviations.length / 2);
        const medianPredictionDeviation = predictionDeviations.length % 2 === 0
          ? (predictionDeviations[deviationMiddle - 1] + predictionDeviations[deviationMiddle]) / 2
          : predictionDeviations[deviationMiddle];
        const candidateCrossSize = axis === \"row\" ? candidate.box.height : candidate.box.width;
        const crossBoundsSize = axis === \"row\" ? bounds.height : bounds.width;
        const outlierTolerance = Math.max(crossBoundsSize * 0.025, candidateCrossSize * 0.28);
        const neighborModelCoherent = medianPredictionDeviation <= outlierTolerance * 0.65;
        return neighborModelCoherent && Math.abs(crossCoordinate(candidate) - predictedCross) > outlierTolerance;
      };
      const candidateGeometricOutlier = repeatedRowOutlier
        && (isCandidateInteriorGeometricOutlier(\"row\") || isCandidateInteriorGeometricOutlier(\"column\"));
      const groupOutlierMultiplier = candidateGeometricOutlier ? 0.35 : repeatedRowOutlier ? 0.78 : 1;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * groupOutlierMultiplier : 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const candidateGeometricOutlier = repeatedRowOutlier")) {
  throw new Error("Unable to locate repeated-row outlier group penalty for selective outlier suppression patch");
}

await fs.writeFile(path, source);
await import("./smoke-selective-curved-outlier-suppression.mjs");
console.log("repeated-opening ranking now selectively suppresses an interior geometric outlier while preserving most group confidence for surrounding valid masks");
