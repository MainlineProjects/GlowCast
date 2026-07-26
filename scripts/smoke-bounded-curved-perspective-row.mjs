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
  const rowStraightResidual = rowOrdered.reduce((maxResidual, center) => {
    const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
    const expectedY = rowFirst.y + (rowLast.y - rowFirst.y) * fraction;
    return Math.max(maxResidual, Math.abs(center.y - expectedY));
  }, 0);
  const rowCurveAnchor = rowOrdered.reduce((best, center) => {
    const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
    const distance = Math.abs(fraction - 0.5);
    return distance < best.distance ? { center, fraction, distance } : best;
  }, { center: rowOrdered[0], fraction: 0, distance: Number.POSITIVE_INFINITY });
  const rowCurveWeight = 4 * rowCurveAnchor.fraction * (1 - rowCurveAnchor.fraction);
  const rowCurveLinearY = rowFirst.y + (rowLast.y - rowFirst.y) * rowCurveAnchor.fraction;
  const rowCurveCoefficient = rowCurveWeight > 0.18
    ? (rowCurveAnchor.center.y - rowCurveLinearY) / rowCurveWeight
    : 0;
  const rowCurveLimit = Math.max(bounds.height * 0.06, minHeight * 0.6);
  const rowCurvedResidual = Math.abs(rowCurveCoefficient) <= rowCurveLimit
    ? rowOrdered.reduce((maxResidual, center) => {
        const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
        const expectedY = rowFirst.y
          + (rowLast.y - rowFirst.y) * fraction
          + rowCurveCoefficient * 4 * fraction * (1 - fraction);
        return Math.max(maxResidual, Math.abs(center.y - expectedY));
      }, 0)
    : Number.POSITIVE_INFINITY;
  const rowResidual = Math.min(rowStraightResidual, rowCurvedResidual);
  const perspectiveSlopedRow = rowSpan >= minWidth * 1.2
    && rowSlope <= 0.45
    && rowResidual <= Math.max(bounds.height * 0.025, minHeight * 0.22);

  const columnOrdered = [...centers].sort((left, right) => left.y - right.y);
  const columnFirst = columnOrdered[0];
  const columnLast = columnOrdered[columnOrdered.length - 1];
  const columnSpan = columnLast.y - columnFirst.y;
  const columnSlope = Math.abs(columnLast.x - columnFirst.x) / Math.max(columnSpan, 1);
  const columnStraightResidual = columnOrdered.reduce((maxResidual, center) => {
    const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
    const expectedX = columnFirst.x + (columnLast.x - columnFirst.x) * fraction;
    return Math.max(maxResidual, Math.abs(center.x - expectedX));
  }, 0);
  const columnCurveAnchor = columnOrdered.reduce((best, center) => {
    const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
    const distance = Math.abs(fraction - 0.5);
    return distance < best.distance ? { center, fraction, distance } : best;
  }, { center: columnOrdered[0], fraction: 0, distance: Number.POSITIVE_INFINITY });
  const columnCurveWeight = 4 * columnCurveAnchor.fraction * (1 - columnCurveAnchor.fraction);
  const columnCurveLinearX = columnFirst.x + (columnLast.x - columnFirst.x) * columnCurveAnchor.fraction;
  const columnCurveCoefficient = columnCurveWeight > 0.18
    ? (columnCurveAnchor.center.x - columnCurveLinearX) / columnCurveWeight
    : 0;
  const columnCurveLimit = Math.max(bounds.width * 0.06, minWidth * 0.6);
  const columnCurvedResidual = Math.abs(columnCurveCoefficient) <= columnCurveLimit
    ? columnOrdered.reduce((maxResidual, center) => {
        const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
        const expectedX = columnFirst.x
          + (columnLast.x - columnFirst.x) * fraction
          + columnCurveCoefficient * 4 * fraction * (1 - fraction);
        return Math.max(maxResidual, Math.abs(center.x - expectedX));
      }, 0)
    : Number.POSITIVE_INFINITY;
  const columnResidual = Math.min(columnStraightResidual, columnCurvedResidual);
  const perspectiveSlopedColumn = columnSpan >= minHeight * 1.2
    && columnSlope <= 0.45
    && columnResidual <= Math.max(bounds.width * 0.025, minWidth * 0.22);

  return {
    rowLike: rowSpread <= Math.max(bounds.height * 0.08, minHeight * 0.55) || perspectiveSlopedRow,
    columnLike: columnSpread <= Math.max(bounds.width * 0.08, minWidth * 0.55) || perspectiveSlopedColumn,
    rowStraightResidual,
    rowCurvedResidual,
    columnStraightResidual,
    columnCurvedResidual,
  };
}

const bounds = { width: 120, height: 120 };

const curvedRow = classifyProgression([
  { x: 10, y: 10 },
  { x: 30, y: 14 },
  { x: 50, y: 20 },
  { x: 70, y: 28 },
  { x: 90, y: 38 },
], bounds);
assert.ok(curvedRow.rowStraightResidual > 3, "fixture should exceed the old straight-line tolerance");
assert.equal(curvedRow.rowLike, true, "a bounded gradual perspective curve should remain a coherent repeated-opening row");

assert.equal(
  classifyProgression([
    { x: 10, y: 10 },
    { x: 30, y: 14 },
    { x: 50, y: 20 },
    { x: 70, y: 37 },
    { x: 90, y: 38 },
  ], bounds).rowLike,
  false,
  "one locally displaced opening should still break a gradually curved row",
);

assert.equal(
  classifyProgression([
    { x: 10, y: 10 },
    { x: 30, y: 9.25 },
    { x: 50, y: 15 },
    { x: 70, y: 26.25 },
    { x: 90, y: 38 },
  ], bounds).rowLike,
  false,
  "an excessively bent sequence should not gain perspective-row credibility",
);

const curvedColumn = classifyProgression([
  { x: 10, y: 10 },
  { x: 14, y: 30 },
  { x: 20, y: 50 },
  { x: 28, y: 70 },
  { x: 38, y: 90 },
], bounds);
assert.ok(curvedColumn.columnStraightResidual > 3, "column fixture should exceed the old straight-line tolerance");
assert.equal(curvedColumn.columnLike, true, "bounded gradual curvature should work symmetrically for repeated-opening columns");

assert.equal(
  classifyProgression([
    { x: 10, y: 10 },
    { x: 14, y: 30 },
    { x: 20, y: 50 },
    { x: 37, y: 70 },
    { x: 38, y: 90 },
  ], bounds).columnLike,
  false,
  "one locally displaced opening should still break a gradually curved column",
);

console.log("bounded curved perspective row smoke passed");
