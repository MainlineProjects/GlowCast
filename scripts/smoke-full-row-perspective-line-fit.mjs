import assert from "node:assert/strict";

function classifyProgression(centers, bounds, minWidth = 10, minHeight = 10) {
  const centersX = centers.map((center) => center.x);
  const centersY = centers.map((center) => center.y);
  const rowSpread = Math.max(...centersY) - Math.min(...centersY);
  const columnSpread = Math.max(...centersX) - Math.min(...centersX);

  const rowOrdered = [...centers].sort((left, right) => left.x - right.x);
  const rowFirst = rowOrdered[0];
  const rowLast = rowOrdered[rowOrdered.length - 1];
  const rowSpan = rowLast.x - rowFirst.x;
  const rowSlope = Math.abs(rowLast.y - rowFirst.y) / Math.max(rowSpan, 1);
  const rowResidual = rowOrdered.reduce((maxResidual, center) => {
    const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
    const expectedY = rowFirst.y + (rowLast.y - rowFirst.y) * fraction;
    return Math.max(maxResidual, Math.abs(center.y - expectedY));
  }, 0);
  const perspectiveSlopedRow = rowSpan >= minWidth * 1.2
    && rowSlope <= 0.45
    && rowResidual <= Math.max(bounds.height * 0.025, minHeight * 0.22);

  const columnOrdered = [...centers].sort((left, right) => left.y - right.y);
  const columnFirst = columnOrdered[0];
  const columnLast = columnOrdered[columnOrdered.length - 1];
  const columnSpan = columnLast.y - columnFirst.y;
  const columnSlope = Math.abs(columnLast.x - columnFirst.x) / Math.max(columnSpan, 1);
  const columnResidual = columnOrdered.reduce((maxResidual, center) => {
    const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
    const expectedX = columnFirst.x + (columnLast.x - columnFirst.x) * fraction;
    return Math.max(maxResidual, Math.abs(center.x - expectedX));
  }, 0);
  const perspectiveSlopedColumn = columnSpan >= minHeight * 1.2
    && columnSlope <= 0.45
    && columnResidual <= Math.max(bounds.width * 0.025, minWidth * 0.22);

  return {
    rowLike: rowSpread <= Math.max(bounds.height * 0.08, minHeight * 0.55) || perspectiveSlopedRow,
    columnLike: columnSpread <= Math.max(bounds.width * 0.08, minWidth * 0.55) || perspectiveSlopedColumn,
    rowResidual,
    columnResidual,
  };
}

const bounds = { width: 120, height: 120 };

assert.equal(
  classifyProgression([
    { x: 10, y: 10 },
    { x: 30, y: 16 },
    { x: 50, y: 22 },
    { x: 70, y: 28 },
    { x: 90, y: 34 },
  ], bounds).rowLike,
  true,
  "a five-opening perspective row should remain coherent when every opening follows the same line",
);

assert.equal(
  classifyProgression([
    { x: 10, y: 10 },
    { x: 30, y: 16 },
    { x: 50, y: 22 },
    { x: 70, y: 38 },
    { x: 90, y: 34 },
  ], bounds).rowLike,
  false,
  "a later displaced fragment should break a long repeated-opening row even when the first three masks look valid",
);

assert.equal(
  classifyProgression([
    { x: 18, y: 10 },
    { x: 24, y: 30 },
    { x: 30, y: 50 },
    { x: 36, y: 70 },
    { x: 42, y: 90 },
  ], bounds).columnLike,
  true,
  "a five-opening perspective column should receive the same full-sequence protection",
);

assert.equal(
  classifyProgression([
    { x: 18, y: 10 },
    { x: 24, y: 30 },
    { x: 30, y: 50 },
    { x: 48, y: 70 },
    { x: 42, y: 90 },
  ], bounds).columnLike,
  false,
  "a later displaced fragment should break a long repeated-opening column",
);

console.log("full-row perspective line-fit smoke passed");
