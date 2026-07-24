import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "const alignedNeighborCount = candidates.filter((other) => {",
  "const otherBoxArea = Math.max(1, other.box.width * other.box.height);",
  "const otherFillRatio = Math.min(1, polygonArea(other.points) / otherBoxArea);",
  "const otherAreaRatio = otherBoxArea / boundsArea;",
  "const otherAspect = other.box.width / Math.max(1, other.box.height);",
  "const credibleNeighbor = otherFillRatio >= 0.35 && otherAreaRatio >= 0.003 && other.points.length <= 14 && otherAspect >= 0.08 && otherAspect <= 8;",
  "if (!credibleNeighbor) return false;",
  "const sameRow = Math.abs(centerY - otherCenterY)",
  "const sameColumn = Math.abs(centerX - otherCenterX)",
  "horizontalGap <= bounds.width * 0.12",
  "verticalGap <= bounds.height * 0.12",
  "}).length;",
  "const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;",
  "const groupScore = credibleGroupMember ? Math.min(1, alignedNeighborCount / 2) : 0;",
  "groupScore * 0.06",
  "A pair can receive a modest coherence lift, but repeated rows/columns need",
  "multiple independently credible neighbors before receiving the full boost."
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Aligned architectural group ranking smoke failed; missing: ${missing.join(", ")}`);
}

console.log("multi-neighbor architectural group ranking source smoke passed");
