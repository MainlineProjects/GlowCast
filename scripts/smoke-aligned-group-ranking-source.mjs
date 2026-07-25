import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "const alignedNeighbors = candidates.filter((other) => {",
  "const otherBoxArea = Math.max(1, other.box.width * other.box.height);",
  "const otherFillRatio = Math.min(1, polygonArea(other.points) / otherBoxArea);",
  "const otherAreaRatio = otherBoxArea / boundsArea;",
  "const otherAspect = other.box.width / Math.max(1, other.box.height);",
  "const credibleNeighbor = otherFillRatio >= 0.35 && otherAreaRatio >= 0.003 && other.points.length <= 14 && otherAspect >= 0.08 && otherAspect <= 8;",
  "if (!credibleNeighbor) return false;",
  "const widthRatio = Math.min(candidate.box.width, other.box.width) / Math.max(candidate.box.width, other.box.width, 0.01);",
  "const heightRatio = Math.min(candidate.box.height, other.box.height) / Math.max(candidate.box.height, other.box.height, 0.01);",
  "const dimensionallyConsistent = widthRatio >= 0.62 && heightRatio >= 0.62;",
  "const rowSpacingLimit = Math.min(bounds.width * 0.12, Math.max(candidate.box.width, other.box.width) * 1.6);",
  "const columnSpacingLimit = Math.min(bounds.height * 0.12, Math.max(candidate.box.height, other.box.height) * 1.6);",
  "return dimensionallyConsistent && ((sameRow && horizontalGap <= rowSpacingLimit) || (sameColumn && verticalGap <= columnSpacingLimit));",
  "const consistentNeighborCount = alignedNeighbors.length;",
  "const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;",
  "const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) : 0;",
  "groupScore * 0.06",
  "similarly sized, aligned, and locally spaced"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Aligned architectural group ranking smoke failed; missing: ${missing.join(", ")}`);
}

console.log("dimension-and-spacing-consistent architectural group ranking source smoke passed");
