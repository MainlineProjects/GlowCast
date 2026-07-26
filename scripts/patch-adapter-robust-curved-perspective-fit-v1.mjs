import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldRowFit = `const rowCurveAnchor = rowOrderedCenters.reduce((best, center) => {
             const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
             const distance = Math.abs(fraction - 0.5);
             return distance < best.distance ? { center, fraction, distance } : best;
           }, { center: rowOrderedCenters[0], fraction: 0, distance: Number.POSITIVE_INFINITY });
           const rowCurveWeight = 4 * rowCurveAnchor.fraction * (1 - rowCurveAnchor.fraction);
           const rowCurveLinearY = rowFirst.y + (rowLast.y - rowFirst.y) * rowCurveAnchor.fraction;
           const rowCurveCoefficient = rowCurveWeight > 0.18
             ? (rowCurveAnchor.center.y - rowCurveLinearY) / rowCurveWeight
             : 0;`;
const newRowFit = `const rowCurveCandidates = rowOrderedCenters.slice(1, -1)
             .map((center) => {
               const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
               const weight = 4 * fraction * (1 - fraction);
               if (weight <= 0.18) return null;
               const linearY = rowFirst.y + (rowLast.y - rowFirst.y) * fraction;
               return (center.y - linearY) / weight;
             })
             .filter((value): value is number => value !== null)
             .sort((left, right) => left - right);
           const rowCurveMiddle = Math.floor(rowCurveCandidates.length / 2);
           const rowCurveCoefficient = rowCurveCandidates.length === 0
             ? 0
             : rowCurveCandidates.length % 2 === 0
               ? (rowCurveCandidates[rowCurveMiddle - 1] + rowCurveCandidates[rowCurveMiddle]) / 2
               : rowCurveCandidates[rowCurveMiddle];`;

const oldColumnFit = `const columnCurveAnchor = columnOrderedCenters.reduce((best, center) => {
             const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
             const distance = Math.abs(fraction - 0.5);
             return distance < best.distance ? { center, fraction, distance } : best;
           }, { center: columnOrderedCenters[0], fraction: 0, distance: Number.POSITIVE_INFINITY });
           const columnCurveWeight = 4 * columnCurveAnchor.fraction * (1 - columnCurveAnchor.fraction);
           const columnCurveLinearX = columnFirst.x + (columnLast.x - columnFirst.x) * columnCurveAnchor.fraction;
           const columnCurveCoefficient = columnCurveWeight > 0.18
             ? (columnCurveAnchor.center.x - columnCurveLinearX) / columnCurveWeight
             : 0;`;
const newColumnFit = `const columnCurveCandidates = columnOrderedCenters.slice(1, -1)
             .map((center) => {
               const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
               const weight = 4 * fraction * (1 - fraction);
               if (weight <= 0.18) return null;
               const linearX = columnFirst.x + (columnLast.x - columnFirst.x) * fraction;
               return (center.x - linearX) / weight;
             })
             .filter((value): value is number => value !== null)
             .sort((left, right) => left - right);
           const columnCurveMiddle = Math.floor(columnCurveCandidates.length / 2);
           const columnCurveCoefficient = columnCurveCandidates.length === 0
             ? 0
             : columnCurveCandidates.length % 2 === 0
               ? (columnCurveCandidates[columnCurveMiddle - 1] + columnCurveCandidates[columnCurveMiddle]) / 2
               : columnCurveCandidates[columnCurveMiddle];`;

if (source.includes(oldRowFit) && source.includes(oldColumnFit)) {
  source = source.replace(oldRowFit, newRowFit).replace(oldColumnFit, newColumnFit);
} else if (!source.includes("const rowCurveCandidates = rowOrderedCenters.slice(1, -1)")) {
  throw new Error("Unable to locate midpoint-anchored curved perspective fit for robust-fit patch");
}

await fs.writeFile(path, source);
await import("./smoke-robust-curved-perspective-fit.mjs");
await import("./patch-adapter-selective-curved-outlier-suppression-v1.mjs");
console.log("curved repeated-opening fitting now uses robust interior consensus and selectively suppresses one displaced interior mask without flattening the surrounding valid group");
