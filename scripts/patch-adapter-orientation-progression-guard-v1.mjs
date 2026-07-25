import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const candidateAngle = dominantEdgeAngle(candidate.points);
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
      const obviousRepeatedRowRotationOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && neighborOrientationStrength >= 0.92 && rotationDelta > Math.PI / 13;`;

const newBlock = `const candidateAngle = dominantEdgeAngle(candidate.points);
      const neighborAngles = alignedNeighbors.map((member) => dominantEdgeAngle(member.points));
      const orientationVector = neighborAngles.reduce(
        (sum, angle) => ({ x: sum.x + Math.cos(angle * 2), y: sum.y + Math.sin(angle * 2) }),
        { x: 0, y: 0 }
      );
      const neighborOrientationStrength = neighborAngles.length
        ? Math.hypot(orientationVector.x, orientationVector.y) / neighborAngles.length
        : 0;
      const neighborMeanAngle = ((Math.atan2(orientationVector.y, orientationVector.x) / 2) + Math.PI) % Math.PI;
      const angleDistance = (left: number, right: number) => {
        const raw = Math.abs(left - right);
        return Math.min(raw, Math.PI - raw);
      };
      const rotationDelta = angleDistance(candidateAngle, neighborMeanAngle);
      const orderedOrientationTriplet = [candidate, ...alignedNeighbors]
        .sort((left, right) => {
          const horizontalSpan = Math.max(...[candidate, ...alignedNeighbors].map((member) => member.box.x + member.box.width)) - Math.min(...[candidate, ...alignedNeighbors].map((member) => member.box.x));
          const verticalSpan = Math.max(...[candidate, ...alignedNeighbors].map((member) => member.box.y + member.box.height)) - Math.min(...[candidate, ...alignedNeighbors].map((member) => member.box.y));
          return horizontalSpan >= verticalSpan ? left.box.x - right.box.x : left.box.y - right.box.y;
        })
        .slice(0, 3);
      const orientationProgressionScore = orderedOrientationTriplet.length >= 3
        ? (() => {
            const angles = orderedOrientationTriplet.map((member) => dominantEdgeAngle(member.points));
            const firstDelta = angleDistance(angles[0], angles[1]);
            const secondDelta = angleDistance(angles[1], angles[2]);
            const consistentTurn = firstDelta <= Math.PI / 18 && secondDelta <= Math.PI / 18;
            const smoothTurnRate = Math.abs(firstDelta - secondDelta) <= Math.PI / 45;
            return consistentTurn && smoothTurnRate ? 1 : 0;
          })()
        : 0;
      const obviousRepeatedRowRotationOutlier = alignedNeighbors.length >= 2 && orientationProgressionScore === 0 && neighborOrientationStrength >= 0.92 && rotationDelta > Math.PI / 13;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const orientationProgressionScore = orderedOrientationTriplet.length >= 3")) {
  throw new Error("Unable to locate repeated-row rotation guard for perspective-aware orientation progression");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now preserves smooth perspective rotation while suppressing abrupt orientation outliers");
