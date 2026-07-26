import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `+ (smoothCurvatureStrength <= 0.22 ? 0 : 1);`;
const newBlock = `+ (smoothCurvatureStrength <= 0.22
            && (smoothCurvatureStrength <= 0.08 || Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25) ? 0 : 1);`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("Math.abs(curvatureCos) >= Math.abs(curvatureSin) * 1.25")) {
  throw new Error("Unable to locate smooth-curvature bound for axis-aware architectural curvature patch");
}

await fs.writeFile(path, source);
await import("./smoke-axis-aware-architectural-curvature-ranking.mjs");
console.log("paired-mask curvature now favors principal-axis architectural arches over diagonal smooth blobs");
