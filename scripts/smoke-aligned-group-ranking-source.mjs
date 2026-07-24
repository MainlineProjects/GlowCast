import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "const alignedNeighbor = candidates.some((other) => {",
  "const sameRow = Math.abs(centerY - otherCenterY)",
  "const sameColumn = Math.abs(centerX - otherCenterX)",
  "horizontalGap <= bounds.width * 0.12",
  "verticalGap <= bounds.height * 0.12",
  "const groupScore = alignedNeighbor ? 1 : 0;",
  "groupScore * 0.06",
  "Keep related windows, doors, sidelights, and stacked openings near one another"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Aligned architectural group ranking smoke failed; missing: ${missing.join(", ")}`);
}

console.log("aligned architectural group ranking source smoke passed");
