import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const orderedOrientationTriplet = [candidate, ...alignedNeighbors]
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
        : 0;`;

const newBlock = `const orderedOrientationSequence = [candidate, ...alignedNeighbors]
        .sort((left, right) => {
          const horizontalSpan = Math.max(...[candidate, ...alignedNeighbors].map((member) => member.box.x + member.box.width)) - Math.min(...[candidate, ...alignedNeighbors].map((member) => member.box.x));
          const verticalSpan = Math.max(...[candidate, ...alignedNeighbors].map((member) => member.box.y + member.box.height)) - Math.min(...[candidate, ...alignedNeighbors].map((member) => member.box.y));
          return horizontalSpan >= verticalSpan ? left.box.x - right.box.x : left.box.y - right.box.y;
        });
      const orientationProgressionScore = orderedOrientationSequence.length >= 3
        ? (() => {
            const angles = orderedOrientationSequence.map((member) => dominantEdgeAngle(member.points));
            const signedAngleDelta = (left: number, right: number) => {
              let delta = right - left;
              while (delta > Math.PI / 2) delta -= Math.PI;
              while (delta < -Math.PI / 2) delta += Math.PI;
              return delta;
            };
            const turnSteps = angles.slice(1).map((angle, index) => signedAngleDelta(angles[index], angle));
            const modestTurns = turnSteps.every((step) => Math.abs(step) <= Math.PI / 18);
            const nonTrivialTurns = turnSteps.filter((step) => Math.abs(step) >= Math.PI / 180);
            const consistentDirection = nonTrivialTurns.length < 2 || nonTrivialTurns.every((step) => Math.sign(step) === Math.sign(nonTrivialTurns[0]));
            const turnMagnitudes = turnSteps.map((step) => Math.abs(step));
            const turnSpread = Math.max(...turnMagnitudes) - Math.min(...turnMagnitudes);
            const smoothTurnRate = turnSpread <= Math.PI / 45;
            return modestTurns && consistentDirection && smoothTurnRate ? 1 : 0;
          })()
        : 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const orderedOrientationSequence = [candidate, ...alignedNeighbors]")) {
  throw new Error("Unable to locate three-mask orientation progression guard for long-row upgrade");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now validates smooth orientation progression across the full repeated row");
