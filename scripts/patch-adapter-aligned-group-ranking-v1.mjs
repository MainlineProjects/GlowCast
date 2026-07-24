import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const cornerScore = candidate.points.length >= 4 && candidate.points.length <= 10 ? 1 : 0.65;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08;`;

const newBlock = `const cornerScore = candidate.points.length >= 4 && candidate.points.length <= 10 ? 1 : 0.65;
      const centerX = candidate.box.x + candidate.box.width / 2;
      const centerY = candidate.box.y + candidate.box.height / 2;
      const alignedNeighbor = candidates.some((other) => {
        if (other === candidate) return false;
        const otherCenterX = other.box.x + other.box.width / 2;
        const otherCenterY = other.box.y + other.box.height / 2;
        const horizontalGap = Math.max(
          0,
          Math.max(candidate.box.x, other.box.x) - Math.min(candidate.box.x + candidate.box.width, other.box.x + other.box.width)
        );
        const verticalGap = Math.max(
          0,
          Math.max(candidate.box.y, other.box.y) - Math.min(candidate.box.y + candidate.box.height, other.box.y + other.box.height)
        );
        const sameRow = Math.abs(centerY - otherCenterY) <= Math.max(bounds.height * 0.08, Math.min(candidate.box.height, other.box.height) * 0.45);
        const sameColumn = Math.abs(centerX - otherCenterX) <= Math.max(bounds.width * 0.08, Math.min(candidate.box.width, other.box.width) * 0.45);
        return (sameRow && horizontalGap <= bounds.width * 0.12) || (sameColumn && verticalGap <= bounds.height * 0.12);
      });
      // Keep related windows, doors, sidelights, and stacked openings near one another
      // in strongest-first review without giving isolated fragments the same boost.
      const groupScore = alignedNeighbor ? 1 : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const groupScore = alignedNeighbor ? 1 : 0;")) {
  throw new Error("Unable to locate architectural ranking score block for aligned-group support");
}

await fs.writeFile(path, source);
console.log("boosted coherent aligned architectural groups in strongest-first mask ranking");
