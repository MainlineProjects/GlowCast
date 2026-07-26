import assert from "node:assert/strict";

function classifyProgression(centers, bounds, minWidth = 10, minHeight = 10) {
  const centersX = centers.map((center) => center.x);
  const centersY = centers.map((center) => center.y);
  const rowSpread = Math.max(...centersY) - Math.min(...centersY);
  const columnSpread = Math.max(...centersX) - Math.min(...centersX);

  const rowOrdered = [...centers].sort((left, right) => left.x - right.x);
  const rowSpan = rowOrdered[2].x - rowOrdered[0].x;
  const rowMidFraction = rowSpan > 0 ? (rowOrdered[1].x - rowOrdered[0].x) / rowSpan : 0.5;
  const rowExpectedMidY = rowOrdered[0].y + (rowOrdered[2].y - rowOrdered[0].y) * rowMidFraction;
  const rowSlope = Math.abs(rowOrdered[2].y - rowOrdered[0].y) / Math.max(rowSpan, 1);
  const rowResidual = Math.abs(rowOrdered[1].y - rowExpectedMidY);
  const perspectiveSlopedRow = rowSpan >= minWidth * 1.2
    && rowSlope <= 0.45
    && rowResidual <= Math.max(bounds.height * 0.025, minHeight * 0.22);

  const columnOrdered = [...centers].sort((left, right) => left.y - right.y);
  const columnSpan = columnOrdered[2].y - columnOrdered[0].y;
  const columnMidFraction = columnSpan > 0 ? (columnOrdered[1].y - columnOrdered[0].y) / columnSpan : 0.5;
  const columnExpectedMidX = columnOrdered[0].x + (columnOrdered[2].x - columnOrdered[0].x) * columnMidFraction;
  const columnSlope = Math.abs(columnOrdered[2].x - columnOrdered[0].x) / Math.max(columnSpan, 1);
  const columnResidual = Math.abs(columnOrdered[1].x - columnExpectedMidX);
  const perspectiveSlopedColumn = columnSpan >= minHeight * 1.2
    && columnSlope <= 0.45
    && columnResidual <= Math.max(bounds.width * 0.025, minWidth * 0.22);

  const rowLike = rowSpread <= Math.max(bounds.height * 0.08, minHeight * 0.55) || perspectiveSlopedRow;
  const columnLike = columnSpread <= Math.max(bounds.width * 0.08, minWidth * 0.55) || perspectiveSlopedColumn;
  return { rowLike, columnLike, perspectiveSlopedRow, perspectiveSlopedColumn };
}

const bounds = { width: 100, height: 100 };

assert.equal(
  classifyProgression([{ x: 10, y: 20 }, { x: 30, y: 20 }, { x: 50, y: 20 }], bounds).rowLike,
  true,
  "ordinary horizontal repeated openings should remain row-like",
);
assert.equal(
  classifyProgression([{ x: 10, y: 10 }, { x: 30, y: 16 }, { x: 50, y: 22 }], bounds).perspectiveSlopedRow,
  true,
  "a gradual perspective-sloped row should remain a coherent repeated-opening progression",
);
assert.equal(
  classifyProgression([{ x: 10, y: 10 }, { x: 30, y: 28 }, { x: 50, y: 22 }], bounds).rowLike,
  false,
  "one off-line fragment should not inherit the row progression boost",
);
assert.equal(
  classifyProgression([{ x: 10, y: 10 }, { x: 30, y: 25 }, { x: 50, y: 40 }], bounds).rowLike,
  false,
  "an excessively diagonal sequence should not masquerade as a repeated architectural row",
);
assert.equal(
  classifyProgression([{ x: 20, y: 10 }, { x: 26, y: 30 }, { x: 32, y: 50 }], bounds).perspectiveSlopedColumn,
  true,
  "a gradual perspective-sloped column should receive the same protection",
);

console.log("perspective-sloped repeated-opening grouping smoke passed");
