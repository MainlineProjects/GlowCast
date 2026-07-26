import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const curvaturePerspectiveLateralCoherence = (
          Math.abs(curvatureLowerLateralSigned) >= 0.04
          && curvatureUpperLateralSigned * curvatureLowerLateralSigned > 0
          && Math.abs(curvatureUpperLateralSigned - curvatureLowerLateralSigned) <= 0.08
        );`;
const newBlock = `const curvaturePerspectiveLateralMagnitude = Math.max(
          Math.abs(curvatureUpperLateralSigned),
          Math.abs(curvatureLowerLateralSigned)
        );
        const curvaturePerspectiveLateralCoherence = (
          Math.abs(curvatureLowerLateralSigned) >= 0.04
          && curvatureUpperLateralSigned * curvatureLowerLateralSigned > 0
          && Math.abs(curvatureUpperLateralSigned - curvatureLowerLateralSigned) <= 0.08
          && curvaturePerspectiveLateralMagnitude <= 0.34
        );`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const curvaturePerspectiveLateralMagnitude = Math.max(")) {
  throw new Error("Unable to locate perspective lateral coherence block for bounded-skew patch");
}

await fs.writeFile(path, source);
await import("./smoke-bound-perspective-skew-ranking.mjs");
await import("./patch-adapter-perspective-sloped-row-grouping-v1.mjs");
console.log("paired-mask perspective tolerance now rejects extreme whole-opening lateral skew while repeated-opening ranking preserves bounded perspective-sloped rows and columns");
