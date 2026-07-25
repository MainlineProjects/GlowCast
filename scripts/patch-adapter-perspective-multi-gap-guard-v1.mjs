import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const sequenceCenterSteps = orderedSequence.slice(1).map((member, index) => {
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
      const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;`;

const newBlock = `const sequenceStepEvidence = orderedSequence.slice(1).map((member, index) => {
        const previous = orderedSequence[index];
        const step = sequenceRowLike
          ? (member.box.x + member.box.width / 2) - (previous.box.x + previous.box.width / 2)
          : (member.box.y + member.box.height / 2) - (previous.box.y + previous.box.height / 2);
        const previousOpeningSpan = sequenceRowLike ? previous.box.width : previous.box.height;
        const memberOpeningSpan = sequenceRowLike ? member.box.width : member.box.height;
        const localOpeningSpan = Math.max(1, (previousOpeningSpan + memberOpeningSpan) / 2);
        return { step, localOpeningSpan, normalizedStep: step / localOpeningSpan };
      }).filter(({ step }) => step > 0.01);
      const smallestNormalizedSequenceStep = sequenceStepEvidence.length
        ? Math.min(...sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep))
        : 0;
      const sequenceAxisSpan = sequenceRowLike ? bounds.width : bounds.height;
      const missingLikeStepCount = smallestNormalizedSequenceStep > 0
        ? sequenceStepEvidence.filter(({ step, localOpeningSpan, normalizedStep }) => {
            const normalizedRatio = normalizedStep / smallestNormalizedSequenceStep;
            return normalizedRatio >= 1.65 && normalizedRatio <= 2.75 && step <= Math.min(sequenceAxisSpan * 0.38, localOpeningSpan * 5.2);
          }).length
        : 0;
      const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const smallestNormalizedSequenceStep = sequenceStepEvidence.length")) {
  throw new Error("Unable to locate multi-gap guard for perspective normalization");
}

await fs.writeFile(path, source);
console.log("multi-gap ranking guard now normalizes center spacing by local opening size under perspective");
