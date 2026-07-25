import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const consistentNeighborCount = alignedNeighbors.length;
      // Repeated openings can scale and tighten their spacing together under perspective
      // while still requiring credible geometry, aligned placement, and local proximity.
      const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06;`;

const newBlock = `const consistentNeighborCount = alignedNeighbors.length;
      const progressionScore = alignedNeighbors.length >= 2 ? Math.max(0, ...alignedNeighbors.flatMap((first, firstIndex) =>
        alignedNeighbors.slice(firstIndex + 1).map((second) => {
          const members = [candidate, first, second];
          const centersX = members.map((member) => member.box.x + member.box.width / 2);
          const centersY = members.map((member) => member.box.y + member.box.height / 2);
          const rowSpread = Math.max(...centersY) - Math.min(...centersY);
          const columnSpread = Math.max(...centersX) - Math.min(...centersX);
          const rowLike = rowSpread <= Math.max(bounds.height * 0.08, Math.min(...members.map((member) => member.box.height)) * 0.55);
          const columnLike = columnSpread <= Math.max(bounds.width * 0.08, Math.min(...members.map((member) => member.box.width)) * 0.55);
          if (!rowLike && !columnLike) return 0;

          const ordered = [...members].sort((left, right) => rowLike
            ? (left.box.x + left.box.width / 2) - (right.box.x + right.box.width / 2)
            : (left.box.y + left.box.height / 2) - (right.box.y + right.box.height / 2));
          const sizes = ordered.map((member) => Math.sqrt(Math.max(member.box.width * member.box.height, 0.01)));
          const scaleOne = sizes[1] / Math.max(sizes[0], 0.01);
          const scaleTwo = sizes[2] / Math.max(sizes[1], 0.01);
          const shrinkingForward = scaleOne <= 1 && scaleTwo <= 1;
          const shrinkingBackward = scaleOne >= 1 && scaleTwo >= 1;
          if (!shrinkingForward && !shrinkingBackward) return 0;
          const scaleConsistency = Math.abs(Math.log(Math.max(scaleOne, 0.01)) - Math.log(Math.max(scaleTwo, 0.01)));
          if (scaleConsistency > 0.28) return 0;

          const gaps = rowLike
            ? [
                Math.max(0, ordered[1].box.x - (ordered[0].box.x + ordered[0].box.width)),
                Math.max(0, ordered[2].box.x - (ordered[1].box.x + ordered[1].box.width))
              ]
            : [
                Math.max(0, ordered[1].box.y - (ordered[0].box.y + ordered[0].box.height)),
                Math.max(0, ordered[2].box.y - (ordered[1].box.y + ordered[1].box.height))
              ];
          const spacingProgresses = shrinkingForward ? gaps[1] <= gaps[0] * 1.25 + 1 : gaps[0] <= gaps[1] * 1.25 + 1;
          return spacingProgresses ? 1 : 0;
        })
      )) : 0;
      // Repeated openings can scale and tighten their spacing together under perspective.
      // A coherent three-mask progression gets extra evidence beyond pairwise proximity.
      const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;
      const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06 + progressionScore * 0.03;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const progressionScore = alignedNeighbors.length >= 2")) {
  throw new Error("Unable to locate perspective group score block for progression ranking");
}

await fs.writeFile(path, source);
console.log("architectural group ranking now rewards coherent three-mask perspective progressions");
