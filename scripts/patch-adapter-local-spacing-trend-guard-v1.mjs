import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const smallestNormalizedSequenceStep = sequenceStepEvidence.length
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

const newBlock = `const expectedNormalizedStepAt = (index: number) => {
        const previous = sequenceStepEvidence[index - 1]?.normalizedStep;
        const next = sequenceStepEvidence[index + 1]?.normalizedStep;
        if (previous != null && next != null) {
          return Math.sqrt(Math.max(previous, 0.01) * Math.max(next, 0.01));
        }
        return previous ?? next ?? sequenceStepEvidence[index]?.normalizedStep ?? 0;
      };
      const sequenceAxisSpan = sequenceRowLike ? bounds.width : bounds.height;
      const missingLikeStepCount = sequenceStepEvidence.filter(({ step, localOpeningSpan, normalizedStep }, index) => {
        const expectedNormalizedStep = expectedNormalizedStepAt(index);
        const localTrendRatio = normalizedStep / Math.max(expectedNormalizedStep, 0.01);
        return localTrendRatio >= 1.65 && localTrendRatio <= 2.75 && step <= Math.min(sequenceAxisSpan * 0.38, localOpeningSpan * 5.2);
      }).length;
      const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const expectedNormalizedStepAt = (index: number) =>")) {
  throw new Error("Unable to locate perspective-normalized multi-gap guard for local trend modeling");
}

await fs.writeFile(path, source);
console.log("multi-gap ranking guard now compares each spacing interval with its local perspective trend");
