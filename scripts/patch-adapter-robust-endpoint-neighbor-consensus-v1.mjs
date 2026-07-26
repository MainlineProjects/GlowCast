import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const localNeighbors = beforeRow ? orderedNeighbors.slice(0, 4) : orderedNeighbors.slice(-4);
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
        const slopeDeltas = slopes.slice(1).map((slope, index) => slope - slopes[index]);
        const medianSlopeDelta = median(slopeDeltas);
        const medianSlopeDeltaDeviation = median(slopeDeltas.map((delta) => Math.abs(delta - medianSlopeDelta)));
        const medianAxisStep = median(axisSteps);`;

const newBlock = `const localPool = beforeRow ? orderedNeighbors.slice(0, 5) : orderedNeighbors.slice(-5);
        const median = (values: number[]) => {
          const sorted = [...values].sort((left, right) => left - right);
          const middle = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
        };
        const evaluateEndpointSupport = (members: MaskCandidateOutput[]) => {
          const slopes: number[] = [];
          const axisSteps: number[] = [];
          for (let index = 1; index < members.length; index += 1) {
            const previous = members[index - 1];
            const current = members[index];
            const axisStep = axisCoordinate(current) - axisCoordinate(previous);
            if (axisStep <= 0) continue;
            axisSteps.push(axisStep);
            slopes.push((crossCoordinate(current) - crossCoordinate(previous)) / axisStep);
          }
          if (slopes.length < 3 || axisSteps.length < 3) return null;
          const medianSlope = median(slopes);
          const medianSlopeDeviation = median(slopes.map((slope) => Math.abs(slope - medianSlope)));
          const slopeDeltas = slopes.slice(1).map((slope, index) => slope - slopes[index]);
          const medianSlopeDelta = median(slopeDeltas);
          const medianSlopeDeltaDeviation = median(slopeDeltas.map((delta) => Math.abs(delta - medianSlopeDelta)));
          const slopeLimit = Math.max(0.08, Math.abs(medianSlope) * 0.4);
          const curvatureLimit = Math.max(0.04, Math.abs(medianSlopeDelta) * 0.55);
          const slopeRange = Math.max(...slopes) - Math.min(...slopes);
          const slopeRangeCoherent = slopeRange <= Math.max(0.18, Math.abs(medianSlope) * 0.9);
          const slopeCoherent = medianSlopeDeviation <= slopeLimit && slopeRangeCoherent;
          const curvatureCoherent = slopeDeltas.length >= 2
            && medianSlopeDeltaDeviation <= curvatureLimit
            && Math.abs(medianSlopeDelta) <= 0.18;
          if (!slopeCoherent && !curvatureCoherent) return null;
          const coherenceScore = Math.min(medianSlopeDeviation / slopeLimit, medianSlopeDeltaDeviation / curvatureLimit);
          return {
            members,
            slopes,
            axisSteps,
            medianSlope,
            medianSlopeDelta,
            slopeCoherent,
            curvatureCoherent,
            coherenceScore
          };
        };
        const supportCandidates = [localPool];
        if (localPool.length >= 5) {
          for (let omitted = 0; omitted < localPool.length; omitted += 1) {
            supportCandidates.push(localPool.filter((_, index) => index !== omitted));
          }
        }
        const endpointSupport = supportCandidates
          .map(evaluateEndpointSupport)
          .filter((support): support is NonNullable<ReturnType<typeof evaluateEndpointSupport>> => support !== null)
          .sort((left, right) => left.coherenceScore - right.coherenceScore)[0];
        if (!endpointSupport) return false;
        const { members: localNeighbors, slopes, axisSteps, medianSlope, medianSlopeDelta, slopeCoherent, curvatureCoherent } = endpointSupport;
        const medianAxisStep = median(axisSteps);`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const evaluateEndpointSupport = (members: MaskCandidateOutput[])")) {
  throw new Error("Unable to locate curvature-aware endpoint support block for robust neighbor consensus patch");
}

await fs.writeFile(path, source);
await import("./smoke-robust-endpoint-neighbor-consensus.mjs");
console.log("endpoint outlier suppression now chooses the most coherent four-of-five local support set so one noisy neighbor cannot steer the prediction");
