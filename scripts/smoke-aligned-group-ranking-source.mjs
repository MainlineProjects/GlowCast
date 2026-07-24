import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "const alignedNeighbor = candidates.some((other) => {",
  "const sameRow = Math.abs(centerY - otherCenterY)",
  "const sameColumn = Math.abs(centerX - otherCenterX)",
  "horizontalGap <= bounds.width * 0.12",
  "verticalGap <= bounds.height * 0.12",
  "const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;",
  "const groupScore = alignedNeighbor && credibleGroupMember ? 1 : 0;",
  "groupScore * 0.06",
  "Nearby geometry can improve review order only after the candidate clears a",
  "basic self-quality floor"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Aligned architectural group ranking smoke failed; missing: ${missing.join(", ")}`);
}

console.log("quality-gated aligned architectural group ranking source smoke passed");
