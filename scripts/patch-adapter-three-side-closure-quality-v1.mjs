import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideClosureQuality";

if (!source.includes(marker)) {
  const helperMarker = "function getFallbackWeakestPresentRatio(";
  if (!source.includes(helperMarker)) {
    const insertAt = source.indexOf("function buildFallbackComponents(");
    if (insertAt < 0) throw new Error("fallback component builder not found");
    const helper = `function getFallbackWeakestPresentRatio(points: EdgePoint[], box: SimpleBox): number {\n  const tolerance = Math.max(1.2, Math.min(box.width, box.height) * 0.09);\n  const minHits = Math.max(3, Math.ceil(points.length * 0.055));\n  let top = 0;\n  let bottom = 0;\n  let left = 0;\n  let right = 0;\n\n  for (const point of points) {\n    if (point.x < box.x - tolerance || point.x > box.x + box.width + tolerance) continue;\n    if (point.y < box.y - tolerance || point.y > box.y + box.height + tolerance) continue;\n    if (Math.abs(point.y - box.y) <= tolerance) top += 1;\n    if (Math.abs(point.y - (box.y + box.height)) <= tolerance) bottom += 1;\n    if (Math.abs(point.x - box.x) <= tolerance) left += 1;\n    if (Math.abs(point.x - (box.x + box.width)) <= tolerance) right += 1;\n  }\n\n  const presentHits = [top, bottom, left, right].filter((hits) => hits >= minHits);\n  return presentHits.length ? Math.min(...presentHits) / Math.max(minHits, 1) : 0;\n}\n\n`;
    source = source.slice(0, insertAt) + helper + source.slice(insertAt);
  }

  const shapePattern = /(\s+const\s+threeSideShapeGuard\s*=\s*sideCoverage\.sides\s*!==\s*3\s*\|\|\s*\(aspect\s*>=\s*0\.28\s*&&\s*aspect\s*<=\s*3\.8\);\s*\n\s*if\s*\(!threeSideShapeGuard\)\s*continue;)/;
  const shapeMatch = source.match(shapePattern);
  if (!shapeMatch) throw new Error("three-sided fallback shape guard not found");
  source = source.replace(shapePattern, `${shapeMatch[1]}\n    const threeSideClosureQuality = sideCoverage.sides !== 3 || getFallbackWeakestPresentRatio(componentPoints, box) >= 1.35;\n    if (!threeSideClosureQuality) continue;`);
}

await fs.writeFile(path, source);
await import("./smoke-three-side-closure-quality.mjs");
console.log("three-sided fallback masks now require convincing coverage on every detected edge");
