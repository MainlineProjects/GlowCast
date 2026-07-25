import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `// Repeated openings can scale and tighten their spacing together under perspective.
      // A coherent three-mask progression gets extra evidence beyond pairwise proximity.
      const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06 + progressionScore * 0.03;`;

const newBlock = `// Repeated openings can scale and tighten their spacing together under perspective.
      // A coherent three-mask progression gets extra evidence beyond pairwise proximity.
      const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;
      const neighborSizes = alignedNeighbors.map((member) => Math.sqrt(Math.max(member.box.width * member.box.height, 0.01))).sort((a, b) => a - b);
      const candidateSize = Math.sqrt(Math.max(candidate.box.width * candidate.box.height, 0.01));
      const neighborMedian = neighborSizes.length ? neighborSizes[Math.floor(neighborSizes.length / 2)] : candidateSize;
      const sizeVsNeighbor = candidateSize / Math.max(neighborMedian, 0.01);
      const obviousRepeatedRowOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && (sizeVsNeighbor < 0.42 || sizeVsNeighbor > 2.4);
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (obviousRepeatedRowOutlier ? 0.35 : 1) : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06 + progressionScore * 0.03;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const obviousRepeatedRowOutlier = alignedNeighbors.length >= 2")) {
  throw new Error("Unable to locate perspective progression group-score block for outlier guard");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now suppresses full repeated-row boosts for obvious size outliers");
