import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldRowResidual = `const rowLineResidual = rowOrderedCenters.reduce((maxResidual, center) => {
             const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
             const expectedY = rowFirst.y + (rowLast.y - rowFirst.y) * fraction;
             return Math.max(maxResidual, Math.abs(center.y - expectedY));
           }, 0);`;
const newRowResidual = `const rowStraightResidual = rowOrderedCenters.reduce((maxResidual, center) => {
             const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
             const expectedY = rowFirst.y + (rowLast.y - rowFirst.y) * fraction;
             return Math.max(maxResidual, Math.abs(center.y - expectedY));
           }, 0);
           const rowCurveAnchor = rowOrderedCenters.reduce((best, center) => {
             const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
             const distance = Math.abs(fraction - 0.5);
             return distance < best.distance ? { center, fraction, distance } : best;
           }, { center: rowOrderedCenters[0], fraction: 0, distance: Number.POSITIVE_INFINITY });
           const rowCurveWeight = 4 * rowCurveAnchor.fraction * (1 - rowCurveAnchor.fraction);
           const rowCurveLinearY = rowFirst.y + (rowLast.y - rowFirst.y) * rowCurveAnchor.fraction;
           const rowCurveCoefficient = rowCurveWeight > 0.18
             ? (rowCurveAnchor.center.y - rowCurveLinearY) / rowCurveWeight
             : 0;
           const rowCurveLimit = Math.max(bounds.height * 0.06, minMemberHeight * 0.6);
           const rowCurvedResidual = Math.abs(rowCurveCoefficient) <= rowCurveLimit
             ? rowOrderedCenters.reduce((maxResidual, center) => {
                 const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
                 const expectedY = rowFirst.y
                   + (rowLast.y - rowFirst.y) * fraction
                   + rowCurveCoefficient * 4 * fraction * (1 - fraction);
                 return Math.max(maxResidual, Math.abs(center.y - expectedY));
               }, 0)
             : Number.POSITIVE_INFINITY;
           const rowLineResidual = Math.min(rowStraightResidual, rowCurvedResidual);`;

const oldColumnResidual = `const columnLineResidual = columnOrderedCenters.reduce((maxResidual, center) => {
             const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
             const expectedX = columnFirst.x + (columnLast.x - columnFirst.x) * fraction;
             return Math.max(maxResidual, Math.abs(center.x - expectedX));
           }, 0);`;
const newColumnResidual = `const columnStraightResidual = columnOrderedCenters.reduce((maxResidual, center) => {
             const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
             const expectedX = columnFirst.x + (columnLast.x - columnFirst.x) * fraction;
             return Math.max(maxResidual, Math.abs(center.x - expectedX));
           }, 0);
           const columnCurveAnchor = columnOrderedCenters.reduce((best, center) => {
             const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
             const distance = Math.abs(fraction - 0.5);
             return distance < best.distance ? { center, fraction, distance } : best;
           }, { center: columnOrderedCenters[0], fraction: 0, distance: Number.POSITIVE_INFINITY });
           const columnCurveWeight = 4 * columnCurveAnchor.fraction * (1 - columnCurveAnchor.fraction);
           const columnCurveLinearX = columnFirst.x + (columnLast.x - columnFirst.x) * columnCurveAnchor.fraction;
           const columnCurveCoefficient = columnCurveWeight > 0.18
             ? (columnCurveAnchor.center.x - columnCurveLinearX) / columnCurveWeight
             : 0;
           const columnCurveLimit = Math.max(bounds.width * 0.06, minMemberWidth * 0.6);
           const columnCurvedResidual = Math.abs(columnCurveCoefficient) <= columnCurveLimit
             ? columnOrderedCenters.reduce((maxResidual, center) => {
                 const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
                 const expectedX = columnFirst.x
                   + (columnLast.x - columnFirst.x) * fraction
                   + columnCurveCoefficient * 4 * fraction * (1 - fraction);
                 return Math.max(maxResidual, Math.abs(center.x - expectedX));
               }, 0)
             : Number.POSITIVE_INFINITY;
           const columnLineResidual = Math.min(columnStraightResidual, columnCurvedResidual);`;

if (source.includes(oldRowResidual) && source.includes(oldColumnResidual)) {
  source = source.replace(oldRowResidual, newRowResidual).replace(oldColumnResidual, newColumnResidual);
} else if (!source.includes("const rowCurvedResidual = Math.abs(rowCurveCoefficient) <= rowCurveLimit")) {
  throw new Error("Unable to locate full-row perspective residuals for bounded-curvature patch");
}

await fs.writeFile(path, source);
await import("./smoke-bounded-curved-perspective-row.mjs");
console.log("repeated-opening progression now preserves bounded gradual curvature while rejecting local displacement and excessive bend");
