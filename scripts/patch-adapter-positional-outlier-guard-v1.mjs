import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const obviousRepeatedRowOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && (sizeVsNeighbor < 0.42 || sizeVsNeighbor > 2.4);
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (obviousRepeatedRowOutlier ? 0.35 : 1) : 0;`;

const newBlock = `const obviousRepeatedRowOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && (sizeVsNeighbor < 0.42 || sizeVsNeighbor > 2.4);
      const neighborCenterXs = alignedNeighbors.map((member) => member.box.x + member.box.width / 2).sort((a, b) => a - b);
      const neighborCenterYs = alignedNeighbors.map((member) => member.box.y + member.box.height / 2).sort((a, b) => a - b);
      const neighborMedianX = neighborCenterXs.length ? neighborCenterXs[Math.floor(neighborCenterXs.length / 2)] : centerX;
      const neighborMedianY = neighborCenterYs.length ? neighborCenterYs[Math.floor(neighborCenterYs.length / 2)] : centerY;
      const neighborWidthMedian = alignedNeighbors.length
        ? [...alignedNeighbors].sort((a, b) => a.box.width - b.box.width)[Math.floor(alignedNeighbors.length / 2)].box.width
        : candidate.box.width;
      const neighborHeightMedian = alignedNeighbors.length
        ? [...alignedNeighbors].sort((a, b) => a.box.height - b.box.height)[Math.floor(alignedNeighbors.length / 2)].box.height
        : candidate.box.height;
      const neighborRowSpread = neighborCenterYs.length > 1 ? neighborCenterYs[neighborCenterYs.length - 1] - neighborCenterYs[0] : Infinity;
      const neighborColumnSpread = neighborCenterXs.length > 1 ? neighborCenterXs[neighborCenterXs.length - 1] - neighborCenterXs[0] : Infinity;
      const tightNeighborRow = neighborRowSpread <= Math.max(bounds.height * 0.025, neighborHeightMedian * 0.18);
      const tightNeighborColumn = neighborColumnSpread <= Math.max(bounds.width * 0.025, neighborWidthMedian * 0.18);
      const obviousRepeatedRowPositionOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && (
        (tightNeighborRow && Math.abs(centerY - neighborMedianY) > Math.max(bounds.height * 0.035, Math.min(candidate.box.height, neighborHeightMedian) * 0.3)) ||
        (tightNeighborColumn && Math.abs(centerX - neighborMedianX) > Math.max(bounds.width * 0.035, Math.min(candidate.box.width, neighborWidthMedian) * 0.3))
      );
      const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const obviousRepeatedRowPositionOutlier = alignedNeighbors.length >= 2")) {
  throw new Error("Unable to locate repeated-row outlier block for positional guarding");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now suppresses full row boosts for obvious positional outliers");
