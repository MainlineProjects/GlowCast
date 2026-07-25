import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;`;

const newBlock = `const dominantEdgeAngle = (points: Array<{ x: number; y: number }>) => {
        let longestLength = 0;
        let longestAngle = 0;
        for (let index = 0; index < points.length; index += 1) {
          const start = points[index];
          const end = points[(index + 1) % points.length];
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.hypot(dx, dy);
          if (length > longestLength) {
            longestLength = length;
            longestAngle = Math.atan2(dy, dx);
          }
        }
        const normalized = ((longestAngle % Math.PI) + Math.PI) % Math.PI;
        return normalized;
      };
      const candidateAngle = dominantEdgeAngle(candidate.points);
      const neighborAngles = alignedNeighbors.map((member) => dominantEdgeAngle(member.points));
      const orientationVector = neighborAngles.reduce(
        (sum, angle) => ({ x: sum.x + Math.cos(angle * 2), y: sum.y + Math.sin(angle * 2) }),
        { x: 0, y: 0 }
      );
      const neighborOrientationStrength = neighborAngles.length
        ? Math.hypot(orientationVector.x, orientationVector.y) / neighborAngles.length
        : 0;
      const neighborMeanAngle = ((Math.atan2(orientationVector.y, orientationVector.x) / 2) + Math.PI) % Math.PI;
      const rawRotationDelta = Math.abs(candidateAngle - neighborMeanAngle);
      const rotationDelta = Math.min(rawRotationDelta, Math.PI - rawRotationDelta);
      const obviousRepeatedRowRotationOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && neighborOrientationStrength >= 0.92 && rotationDelta > Math.PI / 13;
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const obviousRepeatedRowRotationOutlier = alignedNeighbors.length >= 2")) {
  throw new Error("Unable to locate repeated-row outlier block for rotation guarding");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now suppresses full row boosts for obvious rotation outliers");
