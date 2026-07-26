import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const medianSlope = median(slopes);
        const medianSlopeDeviation = median(slopes.map((slope) => Math.abs(slope - medianSlope)));
        const medianAxisStep = median(axisSteps);
        const nearestNeighbor = beforeRow ? localNeighbors[0] : localNeighbors[localNeighbors.length - 1];
        const endpointGap = Math.abs(candidateAxis - axisCoordinate(nearestNeighbor));
        if (endpointGap > medianAxisStep * 1.75) return false;

        const slopeCoherent = medianSlopeDeviation <= Math.max(0.08, Math.abs(medianSlope) * 0.4);
        if (!slopeCoherent) return false;
        const predictedCross = crossCoordinate(nearestNeighbor)
          + medianSlope * (candidateAxis - axisCoordinate(nearestNeighbor));`;

const newBlock = `const medianSlope = median(slopes);
        const medianSlopeDeviation = median(slopes.map((slope) => Math.abs(slope - medianSlope)));
        const slopeDeltas = slopes.slice(1).map((slope, index) => slope - slopes[index]);
        const medianSlopeDelta = median(slopeDeltas);
        const medianSlopeDeltaDeviation = median(slopeDeltas.map((delta) => Math.abs(delta - medianSlopeDelta)));
        const medianAxisStep = median(axisSteps);
        const nearestNeighbor = beforeRow ? localNeighbors[0] : localNeighbors[localNeighbors.length - 1];
        const endpointGap = Math.abs(candidateAxis - axisCoordinate(nearestNeighbor));
        if (endpointGap > medianAxisStep * 1.75) return false;

        const slopeCoherent = medianSlopeDeviation <= Math.max(0.08, Math.abs(medianSlope) * 0.4);
        const curvatureCoherent = slopeDeltas.length >= 2
          && medianSlopeDeltaDeviation <= Math.max(0.04, Math.abs(medianSlopeDelta) * 0.55)
          && Math.abs(medianSlopeDelta) <= 0.18;
        if (!slopeCoherent && !curvatureCoherent) return false;
        const endpointStepRatio = medianAxisStep > 0 ? endpointGap / medianAxisStep : 1;
        const nearestSlope = beforeRow ? slopes[0] : slopes[slopes.length - 1];
        const extrapolatedSlope = curvatureCoherent
          ? nearestSlope + (beforeRow ? -1 : 1) * medianSlopeDelta * endpointStepRatio
          : medianSlope;
        const predictedCross = crossCoordinate(nearestNeighbor)
          + extrapolatedSlope * (candidateAxis - axisCoordinate(nearestNeighbor));`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const curvatureCoherent = slopeDeltas.length >= 2")) {
  throw new Error("Unable to locate endpoint slope extrapolation block for curvature-aware patch");
}

await fs.writeFile(path, source);
await import("./smoke-curvature-aware-endpoint-outlier-suppression.mjs");
console.log("endpoint outlier suppression now follows bounded coherent curvature while still isolating displaced final openings");
