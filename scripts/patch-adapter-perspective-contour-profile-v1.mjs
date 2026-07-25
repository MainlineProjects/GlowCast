import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const contourProfileSimilarity = pairLeftContour.reduce((sum, leftRadius, index) => {
          const rightRadius = pairRightContour[index];
          if (leftRadius <= 0 && rightRadius <= 0) return sum + 1;
          if (leftRadius <= 0 || rightRadius <= 0) return sum;
          return sum + Math.min(leftRadius, rightRadius) / Math.max(leftRadius, rightRadius, 0.01);
        }, 0) / pairLeftContour.length;
        const outlineShapeMatched = outlineFillSimilarity >= 0.68 && contourProfileSimilarity >= 0.82 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);`;

const newBlock = `const radialSimilarity = (leftRadius: number, rightRadius: number) => {
          if (leftRadius <= 0 && rightRadius <= 0) return 1;
          if (leftRadius <= 0 || rightRadius <= 0) return 0;
          return Math.min(leftRadius, rightRadius) / Math.max(leftRadius, rightRadius, 0.01);
        };
        const directContourSimilarity = pairLeftContour.reduce((sum, leftRadius, index) => (
          sum + radialSimilarity(leftRadius, pairRightContour[index])
        ), 0) / pairLeftContour.length;
        const perspectiveContourSimilarity = pairLeftContour.reduce((sum, leftRadius, index) => {
          const previous = pairRightContour[(index + pairRightContour.length - 1) % pairRightContour.length];
          const current = pairRightContour[index];
          const next = pairRightContour[(index + 1) % pairRightContour.length];
          return sum + Math.max(
            radialSimilarity(leftRadius, previous),
            radialSimilarity(leftRadius, current),
            radialSimilarity(leftRadius, next),
          );
        }, 0) / pairLeftContour.length;
        const contourProfileSimilarity = directContourSimilarity * 0.75 + perspectiveContourSimilarity * 0.25;
        const outlineShapeMatched = outlineFillSimilarity >= 0.68 && contourProfileSimilarity >= 0.82 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const perspectiveContourSimilarity = pairLeftContour.reduce")) {
  throw new Error("Unable to locate contour-profile comparison for perspective-tolerance patch");
}

await fs.writeFile(path, source);
console.log("paired-mask contour comparison now tolerates limited perspective angular drift");
