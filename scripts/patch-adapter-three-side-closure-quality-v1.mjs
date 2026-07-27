import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideClosureQuality";

if (!source.includes(marker)) {
  const typeTarget = `type SideCoverage = {\n  sides: number;\n  hasHorizontal: boolean;\n  hasVertical: boolean;\n};`;
  const typeReplacement = `type SideCoverage = {\n  sides: number;\n  hasHorizontal: boolean;\n  hasVertical: boolean;\n  weakestPresentRatio: number;\n};`;
  if (!source.includes(typeTarget)) throw new Error("fallback side-coverage type not found");
  source = source.replace(typeTarget, typeReplacement);

  const returnTarget = `  return {\n    sides: [topPresent, bottomPresent, leftPresent, rightPresent].filter(Boolean).length,\n    hasHorizontal: topPresent || bottomPresent,\n    hasVertical: leftPresent || rightPresent\n  };`;
  const returnReplacement = `  const presentHits = [\n    topPresent ? top : null,\n    bottomPresent ? bottom : null,\n    leftPresent ? left : null,\n    rightPresent ? right : null\n  ].filter((hits): hits is number => hits !== null);\n  const weakestPresentRatio = presentHits.length\n    ? Math.min(...presentHits) / Math.max(minHits, 1)\n    : 0;\n\n  return {\n    sides: presentHits.length,\n    hasHorizontal: topPresent || bottomPresent,\n    hasVertical: leftPresent || rightPresent,\n    weakestPresentRatio\n  };`;
  if (!source.includes(returnTarget)) throw new Error("fallback side-coverage return block not found");
  source = source.replace(returnTarget, returnReplacement);

  const shapeTarget = `    const threeSideShapeGuard = sideCoverage.sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);\n    if (!threeSideShapeGuard) continue;`;
  const shapeReplacement = `    const threeSideShapeGuard = sideCoverage.sides !== 3 || (aspect >= 0.28 && aspect <= 3.8);\n    if (!threeSideShapeGuard) continue;\n    const threeSideClosureQuality = sideCoverage.sides !== 3 || sideCoverage.weakestPresentRatio >= 1.35;\n    if (!threeSideClosureQuality) continue;`;
  if (!source.includes(shapeTarget)) throw new Error("three-sided fallback shape guard not found");
  source = source.replace(shapeTarget, shapeReplacement);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-closure-quality.mjs");
console.log("three-sided fallback masks now require convincing coverage on every detected edge");
