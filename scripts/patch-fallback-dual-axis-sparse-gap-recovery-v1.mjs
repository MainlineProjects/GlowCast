import fs from "node:fs/promises";

const adapterPath = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(adapterPath, "utf8");

const startMarker = "function findSparseBridgeSplit(";
const endMarker = "\nfunction recoverSparseBridgeComponents(";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Unable to locate sparse-bridge split finder");

const replacement = `function findSparseBridgeSplitForAxis(
  points: EdgePoint[],
  box: SimpleBox,
  bounds: SimpleBox,
  horizontal: boolean
): { horizontal: boolean; position: number; score: number } | null {
  const boxArea = box.width * box.height;
  const boundsArea = Math.max(bounds.width * bounds.height, 1);
  const axisSpan = horizontal ? box.width : box.height;
  const boundsSpan = horizontal ? bounds.width : bounds.height;
  if (boxArea < boundsArea * 0.06 || axisSpan < boundsSpan * 0.32) return null;

  const binCount = 15;
  const bins = Array.from({ length: binCount }, () => new Set<string>());
  for (const point of points) {
    const position = horizontal
      ? (point.x - box.x) / Math.max(box.width, 0.01)
      : (point.y - box.y) / Math.max(box.height, 0.01);
    if (position < 0 || position > 1) continue;
    const bucket = Math.min(binCount - 1, Math.floor(position * binCount));
    bins[bucket].add(String(Math.round(point.x)) + "," + String(Math.round(point.y)));
  }

  const counts = bins.map((bin) => bin.size);
  const robustBandSupport = (values: number[]): number => {
    const ranked = [...values].sort((a, b) => b - a);
    return ranked.length >= 2 ? ranked[1] : ranked[0] ?? 0;
  };

  const sparseCandidates: Array<{ index: number; score: number }> = [];
  for (let index = 2; index <= binCount - 3; index += 1) {
    const leftWindow = counts.slice(Math.max(0, index - 4), index);
    const rightWindow = counts.slice(index + 1, Math.min(binCount, index + 5));
    const leftSupport = leftWindow.reduce((sum, count) => sum + count, 0);
    const rightSupport = rightWindow.reduce((sum, count) => sum + count, 0);
    const leftStructural = robustBandSupport(leftWindow);
    const rightStructural = robustBandSupport(rightWindow);
    const structuralFloor = Math.min(leftStructural, rightStructural);
    if (leftSupport < 18 || rightSupport < 18 || structuralFloor < 7) continue;

    const sparseLimit = Math.max(4, structuralFloor * 0.72);
    if (counts[index] > sparseLimit) continue;

    const localBalance = Math.abs(leftSupport - rightSupport) / Math.max(leftSupport + rightSupport, 1);
    const sparsity = counts[index] / Math.max(structuralFloor, 1);
    sparseCandidates.push({ index, score: sparsity + localBalance * 0.12 });
  }

  if (!sparseCandidates.length) return null;
  const best = sparseCandidates.reduce((current, candidate) => candidate.score < current.score ? candidate : current);
  const candidateIndexes = new Set(sparseCandidates.map((candidate) => candidate.index));
  let runStart = best.index;
  let runEnd = best.index;
  while (candidateIndexes.has(runStart - 1)) runStart -= 1;
  while (candidateIndexes.has(runEnd + 1)) runEnd += 1;
  return { horizontal, position: (runStart + runEnd + 1) / (2 * binCount), score: best.score };
}

function findSparseBridgeSplit(points: EdgePoint[], box: SimpleBox, bounds: SimpleBox): { horizontal: boolean; position: number } | null {
  // Mixed-size groups can become taller than wide after an earlier split even when
  // their remaining openings are still separated left-to-right. Evaluate both axes
  // and choose the better-supported sparse run instead of trusting box aspect alone.
  const horizontal = findSparseBridgeSplitForAxis(points, box, bounds, true);
  const vertical = findSparseBridgeSplitForAxis(points, box, bounds, false);
  const best = !horizontal ? vertical : !vertical ? horizontal : horizontal.score <= vertical.score ? horizontal : vertical;
  return best ? { horizontal: best.horizontal, position: best.position } : null;
}
`;

source = source.slice(0, start) + replacement + source.slice(end);
if (!source.includes("function findSparseBridgeSplitForAxis(") || !source.includes("const horizontal = findSparseBridgeSplitForAxis") || !source.includes("const vertical = findSparseBridgeSplitForAxis")) {
  throw new Error("Dual-axis sparse-gap recovery was not fully applied");
}

await fs.writeFile(adapterPath, source);
console.log("Evaluated both axes when recovering sparse-gap architectural openings.");
