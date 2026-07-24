import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const cornerScore = candidate.points.length >= 4 && candidate.points.length <= 10 ? 1 : 0.65;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08;`;

const previousBlock = `const cornerScore = candidate.points.length >= 4 && candidate.points.length <= 10 ? 1 : 0.65;
      const centerX = candidate.box.x + candidate.box.width / 2;
      const centerY = candidate.box.y + candidate.box.height / 2;
      const alignedNeighbor = candidates.some((other) => {
        if (other === candidate) return false;
        const otherBoxArea = Math.max(1, other.box.width * other.box.height);
        const otherFillRatio = Math.min(1, polygonArea(other.points) / otherBoxArea);
        const otherAreaRatio = otherBoxArea / boundsArea;
        const otherAspect = other.box.width / Math.max(1, other.box.height);
        const credibleNeighbor = otherFillRatio >= 0.35 && otherAreaRatio >= 0.003 && other.points.length <= 14 && otherAspect >= 0.08 && otherAspect <= 8;
        if (!credibleNeighbor) return false;
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
      // Nearby geometry can improve review order only when both masks clear the
      // same basic self-quality floor. Weak fragments cannot promote strong masks.
      const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;
      const groupScore = alignedNeighbor && credibleGroupMember ? 1 : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06;`;

const legacyBlock = `const cornerScore = candidate.points.length >= 4 && candidate.points.length <= 10 ? 1 : 0.65;
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

const newBlock = `const cornerScore = candidate.points.length >= 4 && candidate.points.length <= 10 ? 1 : 0.65;
      const centerX = candidate.box.x + candidate.box.width / 2;
      const centerY = candidate.box.y + candidate.box.height / 2;
      const alignedNeighborCount = candidates.filter((other) => {
        if (other === candidate) return false;
        const otherBoxArea = Math.max(1, other.box.width * other.box.height);
        const otherFillRatio = Math.min(1, polygonArea(other.points) / otherBoxArea);
        const otherAreaRatio = otherBoxArea / boundsArea;
        const otherAspect = other.box.width / Math.max(1, other.box.height);
        const credibleNeighbor = otherFillRatio >= 0.35 && otherAreaRatio >= 0.003 && other.points.length <= 14 && otherAspect >= 0.08 && otherAspect <= 8;
        if (!credibleNeighbor) return false;
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
      }).length;
      // A pair can receive a modest coherence lift, but repeated rows/columns need
      // multiple independently credible neighbors before receiving the full boost.
      const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;
      const groupScore = credibleGroupMember ? Math.min(1, alignedNeighborCount / 2) : 0;
      return fillRatio * 0.42 + sizeScore * 0.33 + aspectScore * 0.17 + cornerScore * 0.08 + groupScore * 0.06;`;

if (source.includes(previousBlock)) {
  source = source.replace(previousBlock, newBlock);
} else if (source.includes(legacyBlock)) {
  source = source.replace(legacyBlock, newBlock);
} else if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const alignedNeighborCount = candidates.filter((other) => {")) {
  throw new Error("Unable to locate architectural ranking score block for repeated-group evidence support");
}

await fs.writeFile(path, source);
console.log("repeated architectural groups require multiple credible neighbors for the full ranking boost");
