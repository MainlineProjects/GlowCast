import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;`;

const newBlock = `const sequenceMembers = [candidate, ...alignedNeighbors];
      const sequenceCentersX = sequenceMembers.map((member) => member.box.x + member.box.width / 2);
      const sequenceCentersY = sequenceMembers.map((member) => member.box.y + member.box.height / 2);
      const sequenceSpanX = Math.max(...sequenceCentersX) - Math.min(...sequenceCentersX);
      const sequenceSpanY = Math.max(...sequenceCentersY) - Math.min(...sequenceCentersY);
      const sequenceRowLike = sequenceSpanX >= sequenceSpanY;
      const orderedSequence = [...sequenceMembers].sort((left, right) => sequenceRowLike
        ? (left.box.x + left.box.width / 2) - (right.box.x + right.box.width / 2)
        : (left.box.y + left.box.height / 2) - (right.box.y + right.box.height / 2));
      const sequenceCenterSteps = orderedSequence.slice(1).map((member, index) => {
        const previous = orderedSequence[index];
        return sequenceRowLike
          ? (member.box.x + member.box.width / 2) - (previous.box.x + previous.box.width / 2)
          : (member.box.y + member.box.height / 2) - (previous.box.y + previous.box.height / 2);
      }).filter((step) => step > 0.01);
      const smallestSequenceStep = sequenceCenterSteps.length ? Math.min(...sequenceCenterSteps) : 0;
      const sequenceOpeningSpan = Math.max(...orderedSequence.map((member) => sequenceRowLike ? member.box.width : member.box.height));
      const sequenceAxisSpan = sequenceRowLike ? bounds.width : bounds.height;
      const missingLikeStepCount = smallestSequenceStep > 0
        ? sequenceCenterSteps.filter((step) => {
            const ratio = step / smallestSequenceStep;
            return ratio >= 1.65 && ratio <= 2.75 && step <= Math.min(sequenceAxisSpan * 0.38, sequenceOpeningSpan * 5.2);
          }).length
        : 0;
      const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;")) {
  throw new Error("Unable to locate repeated-row outlier block for multiple-missing-opening guard");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now preserves one missing-opening bridge while suppressing rows that imply multiple missing slots");
