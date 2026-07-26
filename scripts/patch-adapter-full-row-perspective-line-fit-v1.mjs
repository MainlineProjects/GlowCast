import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldRowSpan = `const rowSpan = rowOrderedCenters[2].x - rowOrderedCenters[0].x;
           const rowMidFraction = rowSpan > 0
             ? (rowOrderedCenters[1].x - rowOrderedCenters[0].x) / rowSpan
             : 0.5;
           const rowExpectedMidY = rowOrderedCenters[0].y
             + (rowOrderedCenters[2].y - rowOrderedCenters[0].y) * rowMidFraction;
           const rowSlope = Math.abs(rowOrderedCenters[2].y - rowOrderedCenters[0].y) / Math.max(rowSpan, 1);
           const rowLineResidual = Math.abs(rowOrderedCenters[1].y - rowExpectedMidY);`;
const newRowSpan = `const rowFirst = rowOrderedCenters[0];
           const rowLast = rowOrderedCenters[rowOrderedCenters.length - 1];
           const rowSpan = rowLast.x - rowFirst.x;
           const rowSlope = Math.abs(rowLast.y - rowFirst.y) / Math.max(rowSpan, 1);
           const rowLineResidual = rowOrderedCenters.reduce((maxResidual, center) => {
             const fraction = rowSpan > 0 ? (center.x - rowFirst.x) / rowSpan : 0;
             const expectedY = rowFirst.y + (rowLast.y - rowFirst.y) * fraction;
             return Math.max(maxResidual, Math.abs(center.y - expectedY));
           }, 0);`;

const oldColumnSpan = `const columnSpan = columnOrderedCenters[2].y - columnOrderedCenters[0].y;
           const columnMidFraction = columnSpan > 0
             ? (columnOrderedCenters[1].y - columnOrderedCenters[0].y) / columnSpan
             : 0.5;
           const columnExpectedMidX = columnOrderedCenters[0].x
             + (columnOrderedCenters[2].x - columnOrderedCenters[0].x) * columnMidFraction;
           const columnSlope = Math.abs(columnOrderedCenters[2].x - columnOrderedCenters[0].x) / Math.max(columnSpan, 1);
           const columnLineResidual = Math.abs(columnOrderedCenters[1].x - columnExpectedMidX);`;
const newColumnSpan = `const columnFirst = columnOrderedCenters[0];
           const columnLast = columnOrderedCenters[columnOrderedCenters.length - 1];
           const columnSpan = columnLast.y - columnFirst.y;
           const columnSlope = Math.abs(columnLast.x - columnFirst.x) / Math.max(columnSpan, 1);
           const columnLineResidual = columnOrderedCenters.reduce((maxResidual, center) => {
             const fraction = columnSpan > 0 ? (center.y - columnFirst.y) / columnSpan : 0;
             const expectedX = columnFirst.x + (columnLast.x - columnFirst.x) * fraction;
             return Math.max(maxResidual, Math.abs(center.x - expectedX));
           }, 0);`;

if (source.includes(oldRowSpan) && source.includes(oldColumnSpan)) {
  source = source.replace(oldRowSpan, newRowSpan).replace(oldColumnSpan, newColumnSpan);
} else if (!source.includes("const rowLast = rowOrderedCenters[rowOrderedCenters.length - 1]")) {
  throw new Error("Unable to locate perspective-sloped row/column line fit for full-row validation patch");
}

await fs.writeFile(path, source);
await import("./smoke-full-row-perspective-line-fit.mjs");
await import("./patch-adapter-bounded-curved-perspective-row-v1.mjs");
console.log("perspective-sloped repeated-opening ranking now validates every member against a bounded straight or gradually curved perspective trend");
