import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const hasLocalizedNarrowSpacingOutlier = (steps: number[]) => steps.some((current, index) => {
        if (index === 0 || index === steps.length - 1) return false;
        const previous = Math.max(steps[index - 1], 0.01);
        const next = Math.max(steps[index + 1], 0.01);
        const expected = Math.sqrt(previous * next);
        const localRatio = current / Math.max(expected, 0.01);
        const visiblyNarrowerThanNeighbors = current <= Math.min(previous, next) * 0.82;
        const likelyPairedAssembly = localRatio < 0.5;
        return visiblyNarrowerThanNeighbors && localRatio >= 0.56 && localRatio <= 0.76 && !likelyPairedAssembly;
      });
      const localizedNarrowSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedNarrowSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));`;

const newBlock = `const hasLocalizedNarrowSpacingOutlier = (steps: number[]) => steps.some((current, index) => {
        if (index === 0 || index === steps.length - 1) return false;
        const previous = Math.max(steps[index - 1], 0.01);
        const next = Math.max(steps[index + 1], 0.01);
        const expected = Math.sqrt(previous * next);
        const localRatio = current / Math.max(expected, 0.01);
        const visiblyNarrowerThanNeighbors = current <= Math.min(previous, next) * 0.82;
        const pairLeft = orderedSequence[index];
        const pairRight = orderedSequence[index + 1];
        const widthRatio = Math.min(pairLeft.box.width, pairRight.box.width) / Math.max(pairLeft.box.width, pairRight.box.width, 0.01);
        const heightRatio = Math.min(pairLeft.box.height, pairRight.box.height) / Math.max(pairLeft.box.height, pairRight.box.height, 0.01);
        const crossAxisOverlap = sequenceRowLike
          ? Math.max(0, Math.min(pairLeft.box.y + pairLeft.box.height, pairRight.box.y + pairRight.box.height) - Math.max(pairLeft.box.y, pairRight.box.y)) / Math.max(Math.min(pairLeft.box.height, pairRight.box.height), 0.01)
          : Math.max(0, Math.min(pairLeft.box.x + pairLeft.box.width, pairRight.box.x + pairRight.box.width) - Math.max(pairLeft.box.x, pairRight.box.x)) / Math.max(Math.min(pairLeft.box.width, pairRight.box.width), 0.01);
        const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82;
        const likelyPairedAssembly = localRatio < 0.5 && geometryMatchedPair;
        const suspiciousTightCluster = localRatio >= 0.3 && localRatio < 0.5 && !likelyPairedAssembly;
        return visiblyNarrowerThanNeighbors && ((localRatio >= 0.56 && localRatio <= 0.76) || suspiciousTightCluster);
      });
      const localizedNarrowSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedNarrowSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const geometryMatchedPair = widthRatio >= 0.72")) {
  throw new Error("Unable to locate localized narrow-spacing guard for geometry-aware paired-mask patch");
}

await fs.writeFile(path, source);
console.log("paired-mask spacing preservation now requires coherent dimensions and cross-axis alignment");
