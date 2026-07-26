import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const rowSpread = Math.max(...centersY) - Math.min(...centersY);
           const columnSpread = Math.max(...centersX) - Math.min(...centersX);
           const rowLike = rowSpread <= Math.max(bounds.height * 0.08, Math.min(...members.map((member) => member.box.height)) * 0.55);
           const columnLike = columnSpread <= Math.max(bounds.width * 0.08, Math.min(...members.map((member) => member.box.width)) * 0.55);
           if (!rowLike && !columnLike) return 0;`;

const newBlock = `const rowSpread = Math.max(...centersY) - Math.min(...centersY);
           const columnSpread = Math.max(...centersX) - Math.min(...centersX);
           const minMemberWidth = Math.min(...members.map((member) => member.box.width));
           const minMemberHeight = Math.min(...members.map((member) => member.box.height));
           const rowOrderedCenters = members
             .map((member) => ({ x: member.box.x + member.box.width / 2, y: member.box.y + member.box.height / 2 }))
             .sort((left, right) => left.x - right.x);
           const rowSpan = rowOrderedCenters[2].x - rowOrderedCenters[0].x;
           const rowMidFraction = rowSpan > 0
             ? (rowOrderedCenters[1].x - rowOrderedCenters[0].x) / rowSpan
             : 0.5;
           const rowExpectedMidY = rowOrderedCenters[0].y
             + (rowOrderedCenters[2].y - rowOrderedCenters[0].y) * rowMidFraction;
           const rowSlope = Math.abs(rowOrderedCenters[2].y - rowOrderedCenters[0].y) / Math.max(rowSpan, 1);
           const rowLineResidual = Math.abs(rowOrderedCenters[1].y - rowExpectedMidY);
           const perspectiveSlopedRow = rowSpan >= minMemberWidth * 1.2
             && rowSlope <= 0.45
             && rowLineResidual <= Math.max(bounds.height * 0.025, minMemberHeight * 0.22);
           const columnOrderedCenters = members
             .map((member) => ({ x: member.box.x + member.box.width / 2, y: member.box.y + member.box.height / 2 }))
             .sort((left, right) => left.y - right.y);
           const columnSpan = columnOrderedCenters[2].y - columnOrderedCenters[0].y;
           const columnMidFraction = columnSpan > 0
             ? (columnOrderedCenters[1].y - columnOrderedCenters[0].y) / columnSpan
             : 0.5;
           const columnExpectedMidX = columnOrderedCenters[0].x
             + (columnOrderedCenters[2].x - columnOrderedCenters[0].x) * columnMidFraction;
           const columnSlope = Math.abs(columnOrderedCenters[2].x - columnOrderedCenters[0].x) / Math.max(columnSpan, 1);
           const columnLineResidual = Math.abs(columnOrderedCenters[1].x - columnExpectedMidX);
           const perspectiveSlopedColumn = columnSpan >= minMemberHeight * 1.2
             && columnSlope <= 0.45
             && columnLineResidual <= Math.max(bounds.width * 0.025, minMemberWidth * 0.22);
           const rowLike = rowSpread <= Math.max(bounds.height * 0.08, minMemberHeight * 0.55) || perspectiveSlopedRow;
           const columnLike = columnSpread <= Math.max(bounds.width * 0.08, minMemberWidth * 0.55) || perspectiveSlopedColumn;
           if (!rowLike && !columnLike) return 0;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const perspectiveSlopedRow = rowSpan >= minMemberWidth * 1.2")) {
  throw new Error("Unable to locate three-mask row/column classification for perspective-sloped grouping patch");
}

await fs.writeFile(path, source);
await import("./smoke-perspective-sloped-row-grouping.mjs");
console.log("repeated-opening progression now preserves bounded perspective-sloped rows and columns while rejecting off-line fragments");
