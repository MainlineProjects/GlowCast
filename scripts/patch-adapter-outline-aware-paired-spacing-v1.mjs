import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82;
        const likelyPairedAssembly = localRatio < 0.5 && geometryMatchedPair;`;

const newBlock = `const pairLeftArea = Math.max(pairLeft.box.width * pairLeft.box.height, 0.01);
        const pairRightArea = Math.max(pairRight.box.width * pairRight.box.height, 0.01);
        const pairLeftFill = Math.min(1, polygonArea(pairLeft.points) / pairLeftArea);
        const pairRightFill = Math.min(1, polygonArea(pairRight.points) / pairRightArea);
        const outlineFillSimilarity = Math.min(pairLeftFill, pairRightFill) / Math.max(pairLeftFill, pairRightFill, 0.01);
        const outlineVertexSimilarity = Math.min(pairLeft.points.length, pairRight.points.length) / Math.max(pairLeft.points.length, pairRight.points.length, 1);
        const bothNearRectangular = pairLeftFill >= 0.86 && pairRightFill >= 0.86;
        const outlineShapeMatched = outlineFillSimilarity >= 0.68 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);
        const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82 && outlineShapeMatched;
        const likelyPairedAssembly = localRatio < 0.5 && geometryMatchedPair;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const outlineShapeMatched = outlineFillSimilarity >= 0.68")) {
  throw new Error("Unable to locate geometry-aware paired-mask guard for outline-similarity patch");
}

await fs.writeFile(path, source);
console.log("paired-mask spacing preservation now requires coherent outline shape as well as box geometry");
