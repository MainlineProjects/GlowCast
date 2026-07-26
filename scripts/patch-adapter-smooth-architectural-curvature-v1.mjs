import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const directionalSin = contourRatioProfile.reduce((sum, value, index) => (
          sum + (value - contourRatioMean) * Math.sin((Math.PI * 2 * index) / contourRatioProfile.length)
        ), 0) * 2 / contourRatioProfile.length;
        const directionalTaperResidual = Math.sqrt(contourRatioProfile.reduce((sum, value, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          const expected = contourRatioMean + directionalCos * Math.cos(angle) + directionalSin * Math.sin(angle);
          return sum + (value - expected) ** 2;
        }, 0) / contourRatioProfile.length);
        const directionalTaperCoherent = directionalTaperResidual <= 0.12;`;

const newBlock = `const directionalSin = contourRatioProfile.reduce((sum, value, index) => (
          sum + (value - contourRatioMean) * Math.sin((Math.PI * 2 * index) / contourRatioProfile.length)
        ), 0) * 2 / contourRatioProfile.length;
        const curvatureCos = contourRatioProfile.reduce((sum, value, index) => (
          sum + (value - contourRatioMean) * Math.cos((Math.PI * 4 * index) / contourRatioProfile.length)
        ), 0) * 2 / contourRatioProfile.length;
        const curvatureSin = contourRatioProfile.reduce((sum, value, index) => (
          sum + (value - contourRatioMean) * Math.sin((Math.PI * 4 * index) / contourRatioProfile.length)
        ), 0) * 2 / contourRatioProfile.length;
        const smoothCurvatureStrength = Math.hypot(curvatureCos, curvatureSin);
        const curvatureAdjustedResidual = Math.sqrt(contourRatioProfile.reduce((sum, value, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          const expected = contourRatioMean
            + directionalCos * Math.cos(angle)
            + directionalSin * Math.sin(angle)
            + curvatureCos * Math.cos(angle * 2)
            + curvatureSin * Math.sin(angle * 2);
          return sum + (value - expected) ** 2;
        }, 0) / contourRatioProfile.length);
        const directionalTaperResidual = smoothCurvatureStrength <= 0.22
          ? curvatureAdjustedResidual
          : Number.POSITIVE_INFINITY;
        const directionalTaperCoherent = directionalTaperResidual <= 0.12;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const smoothCurvatureStrength = Math.hypot(curvatureCos, curvatureSin);")) {
  throw new Error("Unable to locate directional taper residual for smooth architectural curvature patch");
}

await fs.writeFile(path, source);
console.log("paired-mask contour comparison now preserves bounded smooth architectural curvature while rejecting localized contour damage");
