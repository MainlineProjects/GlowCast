import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const candidateGeometricOutlier = repeatedRowOutlier
        && (isCandidateInteriorGeometricOutlier(\"row\") || isCandidateInteriorGeometricOutlier(\"column\"));`;

const newBlock = `const isCandidateEndpointGeometricOutlier = (axis: \"row\" | \"column\") => {
        if (alignedNeighbors.length < 4) return false;
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
        const beforeRow = candidateAxis < firstAxis;
        const afterRow = candidateAxis > lastAxis;
        if (!beforeRow && !afterRow) return false;

        const localNeighbors = beforeRow ? orderedNeighbors.slice(0, 4) : orderedNeighbors.slice(-4);
        const slopes: number[] = [];
        const axisSteps: number[] = [];
        for (let index = 1; index < localNeighbors.length; index += 1) {
          const previous = localNeighbors[index - 1];
          const current = localNeighbors[index];
          const axisStep = axisCoordinate(current) - axisCoordinate(previous);
          if (axisStep <= 0) continue;
          axisSteps.push(axisStep);
          slopes.push((crossCoordinate(current) - crossCoordinate(previous)) / axisStep);
        }
        if (slopes.length < 3 || axisSteps.length < 3) return false;
        const median = (values: number[]) => {
          const sorted = [...values].sort((left, right) => left - right);
          const middle = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
        };
        const medianSlope = median(slopes);
        const medianSlopeDeviation = median(slopes.map((slope) => Math.abs(slope - medianSlope)));
        const medianAxisStep = median(axisSteps);
        const nearestNeighbor = beforeRow ? localNeighbors[0] : localNeighbors[localNeighbors.length - 1];
        const endpointGap = Math.abs(candidateAxis - axisCoordinate(nearestNeighbor));
        if (endpointGap > medianAxisStep * 1.75) return false;

        const slopeCoherent = medianSlopeDeviation <= Math.max(0.08, Math.abs(medianSlope) * 0.4);
        if (!slopeCoherent) return false;
        const predictedCross = crossCoordinate(nearestNeighbor)
          + medianSlope * (candidateAxis - axisCoordinate(nearestNeighbor));
        const candidateCrossSize = axis === \"row\" ? candidate.box.height : candidate.box.width;
        const crossBoundsSize = axis === \"row\" ? bounds.height : bounds.width;
        const endpointTolerance = Math.max(crossBoundsSize * 0.03, candidateCrossSize * 0.34);
        return Math.abs(crossCoordinate(candidate) - predictedCross) > endpointTolerance;
      };
      const candidateGeometricOutlier = repeatedRowOutlier
        && (isCandidateInteriorGeometricOutlier(\"row\") || isCandidateInteriorGeometricOutlier(\"column\")
          || isCandidateEndpointGeometricOutlier(\"row\") || isCandidateEndpointGeometricOutlier(\"column\"));`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const isCandidateEndpointGeometricOutlier = (axis:")) {
  throw new Error("Unable to locate selective geometric outlier block for endpoint extrapolation patch");
}

await fs.writeFile(path, source);
await import("./smoke-selective-endpoint-outlier-suppression.mjs");
await import("./patch-adapter-curvature-aware-endpoint-outlier-suppression-v1.mjs");
console.log("repeated-opening ranking now selectively suppresses displaced endpoints using bounded straight or curved local extrapolation");
