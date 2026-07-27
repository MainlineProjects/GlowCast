import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideShapeGuard";
const target = "    if (aspect < 0.18 || aspect > 5.4) continue;";
const replacement = `    if (aspect < 0.18 || aspect > 5.4) continue;
    const threeSideShapeGuard = sideCoverage.sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);
    if (!threeSideShapeGuard) continue;`;

if (!source.includes(marker)) {
  if (!source.includes(target)) throw new Error("fallback aspect guard not found");
  source = source.replace(target, replacement);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-fallback-shape-guard.mjs");
console.log("three-sided fallback masks now reject extreme trim-like aspect ratios");
