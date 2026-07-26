import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldImbalance = `const curvatureUpperLateralImbalance = Math.abs(
          upperLeftSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, upperLeftSamples.length)
          - upperRightSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, upperRightSamples.length)
        );`;
const newImbalance = `const curvatureUpperLateralSigned = (
          upperLeftSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, upperLeftSamples.length)
          - upperRightSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, upperRightSamples.length)
        );
        const curvatureUpperLateralImbalance = Math.abs(curvatureUpperLateralSigned);
        const lowerLeftSamples = contourRatioProfile.filter((_, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          return Math.sin(angle) < -0.55 && Math.cos(angle) < -0.25;
        });
        const lowerRightSamples = contourRatioProfile.filter((_, index) => {
          const angle = (Math.PI * 2 * index) / contourRatioProfile.length;
          return Math.sin(angle) < -0.55 && Math.cos(angle) > 0.25;
        });
        const curvatureLowerLateralSigned = (
          lowerLeftSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, lowerLeftSamples.length)
          - lowerRightSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, lowerRightSamples.length)
        );
        const curvaturePerspectiveLateralCoherence = (
          Math.abs(curvatureLowerLateralSigned) >= 0.04
          && curvatureUpperLateralSigned * curvatureLowerLateralSigned > 0
          && Math.abs(curvatureUpperLateralSigned - curvatureLowerLateralSigned) <= 0.08
        );`;

const oldGuard = `&& curvatureVerticalLocationBias >= 0.06
                && curvatureUpperLateralImbalance <= 0.12)) ? 0 : 1);`;
const newGuard = `&& curvatureVerticalLocationBias >= 0.06
                && (curvatureUpperLateralImbalance <= 0.12
                  || curvaturePerspectiveLateralCoherence))) ? 0 : 1);`;

if (source.includes(oldImbalance) && source.includes(oldGuard)) {
  source = source.replace(oldImbalance, newImbalance).replace(oldGuard, newGuard);
} else if (!source.includes("const curvaturePerspectiveLateralCoherence = (")) {
  throw new Error("Unable to locate centered upper-arch guard for perspective-aware patch");
}

await fs.writeFile(path, source);
await import("./smoke-perspective-aware-centered-upper-arch-ranking.mjs");
await import("./patch-adapter-bound-perspective-skew-v1.mjs");
console.log("centered upper-arch coherence now tolerates bounded whole-opening perspective skew without admitting one-corner bulges or extreme lateral distortion");
