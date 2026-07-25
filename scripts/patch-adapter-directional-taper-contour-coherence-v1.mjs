import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const contourProfileSimilarity = directContourSimilarity * 0.75 + perspectiveContourSimilarity * 0.25;
        const outlineShapeMatched = outlineFillSimilarity >= 0.68 && contourProfileSimilarity >= 0.82 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);`;

const newBlock = `const contourProfileSimilarity = directContourSimilarity * 0.75 + perspectiveContourSimilarity * 0.25;
        const contourRatioProfile = pairLeftContour.map((leftRadius, index) => {
          const rightRadius = pairRightContour[index];
          if (leftRadius <= 0 || rightRadius <= 0) return 0;
          return Math.log(Math.max(rightRadius, 0.01) / Math.max(leftRadius, 0.01));
        });
        const contourRatioMean = contourRatioProfile.reduce((sum, value) => sum + value, 0) / contourRatioProfile.length;
        const directionalCos = contourRatioProfile.reduce((sum, value, index) => (
          sum + (value - contourRatioMean) * Math.cos((Math.PI * 2 * index) / contourRatioProfile.length)
        ), 0) * 2 / contourRatioProfile.length;
        const directionalSin = contourRatioProfile.reduce((sum, value, index) => (
          sum + (value - contourRatioMean) * Math.sin((Math.PI * 2 * index) / contourRatioProfile.length)
        ), 0) * 2 / contourRatioProfile.length;
        const directionalTaperResidual = Math.sqrt(contourRatioProfile.reduce((sum, value, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          const expected = contourRatioMean + directionalCos * Math.cos(angle) + directionalSin * Math.sin(angle);
          return sum + (value - expected) ** 2;
        }, 0) / contourRatioProfile.length);
        const directionalTaperCoherent = directionalTaperResidual <= 0.12;
        const outlineShapeMatched = outlineFillSimilarity >= 0.68 && contourProfileSimilarity >= 0.82 && directionalTaperCoherent && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const directionalTaperCoherent = directionalTaperResidual <= 0.12;")) {
  throw new Error("Unable to locate paired contour similarity for directional taper coherence patch");
}

await fs.writeFile(path, source);
console.log("paired-mask contour comparison now preserves smooth architectural taper while rejecting localized contour breaks");
