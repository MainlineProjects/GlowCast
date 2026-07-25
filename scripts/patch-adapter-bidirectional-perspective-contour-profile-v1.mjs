import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const perspectiveContourSimilarity = pairLeftContour.reduce((sum, leftRadius, index) => {
          const previous = pairRightContour[(index + pairRightContour.length - 1) % pairRightContour.length];
          const current = pairRightContour[index];
          const next = pairRightContour[(index + 1) % pairRightContour.length];
          return sum + Math.max(
            radialSimilarity(leftRadius, previous),
            radialSimilarity(leftRadius, current),
            radialSimilarity(leftRadius, next),
          );
        }, 0) / pairLeftContour.length;
        const contourProfileSimilarity = directContourSimilarity * 0.75 + perspectiveContourSimilarity * 0.25;`;

const newBlock = `const adjacentContourSimilarity = (sourceContour: number[], targetContour: number[]) => sourceContour.reduce((sum, sourceRadius, index) => {
          const previous = targetContour[(index + targetContour.length - 1) % targetContour.length];
          const current = targetContour[index];
          const next = targetContour[(index + 1) % targetContour.length];
          return sum + Math.max(
            radialSimilarity(sourceRadius, previous),
            radialSimilarity(sourceRadius, current),
            radialSimilarity(sourceRadius, next),
          );
        }, 0) / sourceContour.length;
        const leftToRightPerspectiveSimilarity = adjacentContourSimilarity(pairLeftContour, pairRightContour);
        const rightToLeftPerspectiveSimilarity = adjacentContourSimilarity(pairRightContour, pairLeftContour);
        const perspectiveContourSimilarity = Math.min(leftToRightPerspectiveSimilarity, rightToLeftPerspectiveSimilarity);
        const contourProfileSimilarity = directContourSimilarity * 0.75 + perspectiveContourSimilarity * 0.25;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const rightToLeftPerspectiveSimilarity = adjacentContourSimilarity")) {
  throw new Error("Unable to locate perspective contour comparison for bidirectional patch");
}

await fs.writeFile(path, source);
console.log("paired-mask contour comparison now requires bidirectional perspective agreement");
