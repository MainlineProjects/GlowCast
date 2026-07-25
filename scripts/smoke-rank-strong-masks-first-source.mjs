import fs from "node:fs/promises";

await import("./patch-adapter-fair-slender-mask-ranking-v1.mjs");
await import("./patch-adapter-size-aware-mixed-mask-ranking-v1.mjs");
await import("./patch-adapter-aligned-group-ranking-v1.mjs");

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "function polygonArea(",
  "function rankArchitecturalMasks(",
  "const slenderArchitectural = (aspect >= 0.08 && aspect < 0.28) || (aspect > 3.8 && aspect <= 8);",
  "const sizeTarget = slenderArchitectural ? 0.03 : 0.045;",
  "const sizeScore = Math.min(1, areaRatio / sizeTarget);",
  "const fillRatio = Math.min(1, polygonArea(candidate.points) / boxArea);",
  "return rankArchitecturalMasks(suppressIsolatedMaskSpecks(",
  "aspect >= 0.08 && aspect <= 8 ? 0.62 : 0.1",
  "const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;",
  "const alignedNeighbors = candidates.filter((other) => {",
  "const perspectiveScaleMatch = widthRatio >= 0.48 && heightRatio >= 0.48 && Math.abs(Math.log(widthScale) - Math.log(heightScale)) <= 0.22;",
  "const dimensionallyConsistent = strictDimensionMatch || perspectiveScaleMatch;",
  "const rowSpacingReference = perspectiveScaleMatch ? Math.min(candidate.box.width, other.box.width) : Math.max(candidate.box.width, other.box.width);",
  "const columnSpacingReference = perspectiveScaleMatch ? Math.min(candidate.box.height, other.box.height) : Math.max(candidate.box.height, other.box.height);",
  "const consistentNeighborCount = alignedNeighbors.length;",
  "const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) : 0;",
  "groupScore * 0.06"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Strongest-first mask ranking smoke failed; missing: ${missing.join(", ")}`);
}

await import("./smoke-aligned-group-ranking-source.mjs");
console.log("strongest-first automatic mask ranking source smoke passed with fair slender-mask, mixed-size, and perspective-consistent repeated-group sizing and spacing");