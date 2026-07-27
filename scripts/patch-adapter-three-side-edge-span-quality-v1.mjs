import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideEdgeSpanQuality";

if (!source.includes(marker)) {
  const helperMarker = "function getFallbackWeakestPresentSpan(";
  if (!source.includes(helperMarker)) {
    const insertAt = source.indexOf("function buildFallbackComponents(");
    if (insertAt < 0) throw new Error("fallback component builder not found");
    const helper = `function getFallbackWeakestPresentSpan(points: EdgePoint[], box: SimpleBox): number {\n  const tolerance = Math.max(1.2, Math.min(box.width, box.height) * 0.09);\n  const minHits = Math.max(3, Math.ceil(points.length * 0.055));\n  const top: number[] = [];\n  const bottom: number[] = [];\n  const left: number[] = [];\n  const right: number[] = [];\n\n  for (const point of points) {\n    if (point.x < box.x - tolerance || point.x > box.x + box.width + tolerance) continue;\n    if (point.y < box.y - tolerance || point.y > box.y + box.height + tolerance) continue;\n    if (Math.abs(point.y - box.y) <= tolerance) top.push(point.x);\n    if (Math.abs(point.y - (box.y + box.height)) <= tolerance) bottom.push(point.x);\n    if (Math.abs(point.x - box.x) <= tolerance) left.push(point.y);\n    if (Math.abs(point.x - (box.x + box.width)) <= tolerance) right.push(point.y);\n  }\n\n  const spanRatio = (values: number[], length: number): number => {\n    if (values.length < minHits) return -1;\n    return (Math.max(...values) - Math.min(...values)) / Math.max(length, 0.01);\n  };\n  const presentSpans = [\n    spanRatio(top, box.width),\n    spanRatio(bottom, box.width),\n    spanRatio(left, box.height),\n    spanRatio(right, box.height)\n  ].filter((span) => span >= 0);\n  return presentSpans.length ? Math.min(...presentSpans) : 0;\n}\n\n`;
    source = source.slice(0, insertAt) + helper + source.slice(insertAt);
  }

  const closurePattern = /(\s+const\s+threeSideClosureQuality\s*=\s*sideCoverage\.sides\s*!==\s*3\s*\|\|\s*getFallbackWeakestPresentRatio\(componentPoints,\s*box\)\s*>=\s*1\.35;\s*\n\s*if\s*\(!threeSideClosureQuality\)\s*continue;)/;
  const closureMatch = source.match(closurePattern);
  if (!closureMatch) throw new Error("three-sided fallback closure-quality guard not found");
  source = source.replace(
    closurePattern,
    `${closureMatch[1]}\n    const threeSideEdgeSpanQuality = sideCoverage.sides !== 3 || getFallbackWeakestPresentSpan(componentPoints, box) >= 0.42;\n    if (!threeSideEdgeSpanQuality) continue;`
  );
}

await fs.writeFile(path, source);
await import("./smoke-three-side-edge-span-quality.mjs");
await import("./patch-adapter-three-side-edge-distribution-quality-v1.mjs");
console.log("three-sided fallback masks now require detected-edge support to span meaningful edge length");
