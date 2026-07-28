import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const marker = "threeSideEdgeGapContinuity";

if (!source.includes(marker)) {
  const helperMarker = "function getFallbackWorstPresentGap(";
  if (!source.includes(helperMarker)) {
    const insertAt = source.indexOf("function buildFallbackComponents(");
    if (insertAt < 0) throw new Error("fallback component builder not found");
    const helper = `function getFallbackWorstPresentGap(points: EdgePoint[], box: SimpleBox): number {\n  const tolerance = Math.max(1.2, Math.min(box.width, box.height) * 0.09);\n  const minHits = Math.max(3, Math.ceil(points.length * 0.055));\n  const top: number[] = [];\n  const bottom: number[] = [];\n  const left: number[] = [];\n  const right: number[] = [];\n\n  for (const point of points) {\n    if (point.x < box.x - tolerance || point.x > box.x + box.width + tolerance) continue;\n    if (point.y < box.y - tolerance || point.y > box.y + box.height + tolerance) continue;\n    if (Math.abs(point.y - box.y) <= tolerance) top.push(point.x);\n    if (Math.abs(point.y - (box.y + box.height)) <= tolerance) bottom.push(point.x);\n    if (Math.abs(point.x - box.x) <= tolerance) left.push(point.y);\n    if (Math.abs(point.x - (box.x + box.width)) <= tolerance) right.push(point.y);\n  }\n\n  const unsupportedGapRatio = (values: number[], start: number, length: number): number => {\n    if (values.length < minHits) return -1;\n    const binCount = 8;\n    const occupied = new Set<number>();\n    for (const value of values) {\n      const normalized = Math.max(0, Math.min(0.999999, (value - start) / Math.max(length, 0.01)));\n      occupied.add(Math.floor(normalized * binCount));\n    }\n\n    let longestRun = 0;\n    let currentRun = 0;\n    for (let bin = 0; bin < binCount; bin += 1) {\n      if (occupied.has(bin)) {\n        currentRun = 0;\n      } else {\n        currentRun += 1;\n        longestRun = Math.max(longestRun, currentRun);\n      }\n    }\n    return longestRun / binCount;\n  };\n\n  const presentGaps = [\n    unsupportedGapRatio(top, box.x, box.width),\n    unsupportedGapRatio(bottom, box.x, box.width),\n    unsupportedGapRatio(left, box.y, box.height),\n    unsupportedGapRatio(right, box.y, box.height)\n  ].filter((ratio) => ratio >= 0);\n  return presentGaps.length ? Math.max(...presentGaps) : 1;\n}\n\n`;
    source = source.slice(0, insertAt) + helper + source.slice(insertAt);
  }

  const distributionPattern = /(\s+const\s+threeSideEdgeDistributionQuality\s*=\s*sideCoverage\.sides\s*!==\s*3\s*\|\|\s*getFallbackWeakestPresentDistribution\(componentPoints,\s*box\)\s*>=\s*0\.5;\s*\n\s*if\s*\(!threeSideEdgeDistributionQuality\)\s*continue;)/;
  const distributionMatch = source.match(distributionPattern);
  if (!distributionMatch) throw new Error("three-sided fallback edge-distribution guard not found");
  source = source.replace(
    distributionPattern,
    `${distributionMatch[1]}\n    const threeSideEdgeGapContinuity = sideCoverage.sides !== 3 || getFallbackWorstPresentGap(componentPoints, box) <= 0.25;\n    if (!threeSideEdgeGapContinuity) continue;`
  );
}

await fs.writeFile(path, source);
await import("./smoke-three-side-edge-gap-continuity.mjs");
console.log("three-sided fallback masks now reject large unsupported runs along detected edges");
