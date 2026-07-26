import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBias = `const curvatureVerticalLocationBias = (
          positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, positiveVerticalSamples.length)
          - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, negativeVerticalSamples.length)
        );`;
const newBias = `const curvatureVerticalLocationBias = (
          positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, positiveVerticalSamples.length)
          - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, negativeVerticalSamples.length)
        );
        const upperLeftSamples = contourRatioProfile.filter((_, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          return Math.sin(angle) > 0.55 && Math.cos(angle) < -0.25;
        });
        const upperRightSamples = contourRatioProfile.filter((_, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          return Math.sin(angle) > 0.55 && Math.cos(angle) > 0.25;
        });
        const curvatureUpperLateralImbalance = Math.abs(
          upperLeftSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, upperLeftSamples.length)
          - upperRightSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, upperRightSamples.length)
        );`;

const oldGuard = `&& (smoothCurvatureStrength <= 0.08
              || (Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25
                && curvatureVerticalLocationBias >= 0.06)) ? 0 : 1);`;
const newGuard = `&& (smoothCurvatureStrength <= 0.08
              || (Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25
                && curvatureVerticalLocationBias >= 0.06
                && curvatureUpperLateralImbalance <= 0.12)) ? 0 : 1);`;

if (source.includes(oldBias) && source.includes(oldGuard)) {
  source = source.replace(oldBias, newBias).replace(oldGuard, newGuard);
} else if (!source.includes("const curvatureUpperLateralImbalance = Math.abs(")) {
  throw new Error("Unable to locate upper-arch coherence guard for centered-arch patch");
}

await fs.writeFile(path, source);
await import("./smoke-centered-upper-arch-coherence-ranking.mjs");
console.log("paired-mask curvature now requires upper arches to remain laterally centered");
