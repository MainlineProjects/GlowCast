import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideClosureQuality";

if (!source.includes(marker)) {
  const typePattern = /type\s+SideCoverage\s*=\s*\{([\s\S]*?)\n\s*\};/;
  const typeMatch = source.match(typePattern);
  if (!typeMatch) throw new Error("fallback side-coverage type not found");
  if (!typeMatch[1].includes("weakestPresentRatio")) {
    source = source.replace(typePattern, (_match, body) =>
      `type SideCoverage = {${body}\n  weakestPresentRatio: number;\n};`
    );
  }

  const returnPattern = /\s+return\s*\{\s*sides:\s*\[topPresent,\s*bottomPresent,\s*leftPresent,\s*rightPresent\]\.filter\(Boolean\)\.length,\s*hasHorizontal:\s*topPresent\s*\|\|\s*bottomPresent,\s*hasVertical:\s*leftPresent\s*\|\|\s*rightPresent\s*\};/;
  const returnReplacement = `\n  const presentHits = [\n    topPresent ? top : null,\n    bottomPresent ? bottom : null,\n    leftPresent ? left : null,\n    rightPresent ? right : null\n  ].filter((hits): hits is number => hits !== null);\n  const weakestPresentRatio = presentHits.length\n    ? Math.min(...presentHits) / Math.max(minHits, 1)\n    : 0;\n\n  return {\n    sides: presentHits.length,\n    hasHorizontal: topPresent || bottomPresent,\n    hasVertical: leftPresent || rightPresent,\n    weakestPresentRatio\n  };`;
  if (!returnPattern.test(source)) throw new Error("fallback side-coverage return block not found");
  source = source.replace(returnPattern, returnReplacement);

  const shapePattern = /(\s+const\s+threeSideShapeGuard\s*=\s*sideCoverage\.sides\s*!==\s*3\s*\|\|\s*\(aspect\s*>=\s*0\.28\s*&&\s*aspect\s*<=\s*3\.8\);\s*\n\s*if\s*\(!threeSideShapeGuard\)\s*continue;)/;
  const shapeMatch = source.match(shapePattern);
  if (!shapeMatch) throw new Error("three-sided fallback shape guard not found");
  source = source.replace(shapePattern, `${shapeMatch[1]}\n    const threeSideClosureQuality = sideCoverage.sides !== 3 || sideCoverage.weakestPresentRatio >= 1.35;\n    if (!threeSideClosureQuality) continue;`);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-closure-quality.mjs");
console.log("three-sided fallback masks now require convincing coverage on every detected edge");
