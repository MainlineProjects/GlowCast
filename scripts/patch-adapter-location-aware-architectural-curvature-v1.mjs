import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldStrength = `const smoothCurvatureStrength = Math.hypot(curvatureCos, curvatureSin);`;
const newStrength = `const smoothCurvatureStrength = Math.hypot(curvatureCos, curvatureSin);
        const positiveVerticalSamples = contourRatioProfile.filter((_, index) => (
          Math.sin((Math.PI * 2 * index) / contourRatioProfile.length) > 0.55
        ));
        const negativeVerticalSamples = contourRatioProfile.filter((_, index) => (
          Math.sin((Math.PI * 2 * index) / contourRatioProfile.length) < -0.55
        ));
        const curvatureVerticalLocationBias = Math.abs(
          positiveVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, positiveVerticalSamples.length)
          - negativeVerticalSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, negativeVerticalSamples.length)
        );`;

const oldGuard = `&& (smoothCurvatureStrength <= 0.08 || Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25) ? 0 : 1);`;
const newGuard = `&& (smoothCurvatureStrength <= 0.08
              || (Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25
                && curvatureVerticalLocationBias >= 0.06)) ? 0 : 1);`;

if (source.includes(oldStrength) && source.includes(oldGuard)) {
  source = source.replace(oldStrength, newStrength).replace(oldGuard, newGuard);
} else if (!source.includes("const curvatureVerticalLocationBias = Math.abs(")) {
  throw new Error("Unable to locate axis-aware curvature guard for location-aware architectural curvature patch");
}

await fs.writeFile(path, source);
await import("./smoke-location-aware-architectural-curvature-ranking.mjs");
await import("./patch-adapter-top-arch-location-coherence-v1.mjs");
console.log("paired-mask curvature now requires plausible vertical location and upper-arch coherence");
