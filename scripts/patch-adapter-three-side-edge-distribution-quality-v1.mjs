import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideEdgeDistributionQuality";

if (!source.includes(marker)) {
  const helperMarker = "function getFallbackWeakestPresentDistribution(";
  if (!source.includes(helperMarker)) {
    const insertAt = source.indexOf("function buildFallbackComponents(");
    if (insertAt < 0) throw new Error("fallback component builder not found");
    const helper = `function getFallbackWeakestPresentDistribution(points: EdgePoint[], box: SimpleBox): number {\n  const tolerance = Math.max(1.2, Math.min(box.width, box.height) * 0.09);\n  const minHits = Math.max(3, Math.ceil(points.length * 0.055));\n  const top: number[] = [];\n  const bottom: number[] = [];\n  const left: number[] = [];\n  const right: number[] = [];\n\n  for (const point of points) {\n    if (point.x < box.x - tolerance || point.x > box.x + box.width + tolerance) continue;\n    if (point.y < box.y - tolerance || point.y > box.y + box.height + tolerance) continue;\n    if (Math.abs(point.y - box.y) <= tolerance) top.push(point.x);\n    if (Math.abs(point.y - (box.y + box.height)) <= tolerance) bottom.push(point.x);\n    if (Math.abs(point.x - box.x) <= tolerance) left.push(point.y);\n    if (Math.abs(point.x - (box.x + box.width)) <= tolerance) right.push(point.y);\n  }\n\n  const distributionRatio = (values: number[], start: number, length: number): number => {\n    if (values.length < minHits) return -1;\n    const binCount = 6;\n    const occupied = new Set<number>();\n    for (const value of values) {\n      const normalized = Math.max(0, Math.min(0.999999, (value - start) / Math.max(length, 0.01)));\n      occupied.add(Math.floor(normalized * binCount));\n    }\n    return occupied.size / binCount;\n  };\n\n  const presentDistributions = [\n    distributionRatio(top, box.x, box.width),\n    distributionRatio(bottom, box.x, box.width),\n    distributionRatio(left, box.y, box.height),\n    distributionRatio(right, box.y, box.height)\n  ].filter((ratio) => ratio >= 0);\n  return presentDistributions.length ? Math.min(...presentDistributions) : 0;\n}\n\n`;
    source = source.slice(0, insertAt) + helper + source.slice(insertAt);
  }

  const spanPattern = /(\s+const\s+threeSideEdgeSpanQuality\s*=\s*sideCoverage\.sides\s*!==\s*3\s*\|\|\s*getFallbackWeakestPresentSpan\(componentPoints,\s*box\)\s*>=\s*0\.42;\s*\n\s*if\s*\(!threeSideEdgeSpanQuality\)\s*continue;)/;
  const spanMatch = source.match(spanPattern);
  if (!spanMatch) throw new Error("three-sided fallback edge-span guard not found");
  source = source.replace(
    spanPattern,
    `${spanMatch[1]}\n    const threeSideEdgeDistributionQuality = sideCoverage.sides !== 3 || getFallbackWeakestPresentDistribution(componentPoints, box) >= 0.5;\n    if (!threeSideEdgeDistributionQuality) continue;`
  );
}

await fs.writeFile(path, source);
await import("./smoke-three-side-edge-distribution-quality.mjs");
await import("./patch-adapter-three-side-edge-gap-continuity-v1.mjs");
console.log("three-sided fallback masks now require edge support to be distributed along each detected edge");
