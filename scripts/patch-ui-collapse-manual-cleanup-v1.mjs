import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const withoutLegacyDebug = source.replace(/\s*<div className="edgeDebugPanel">[\s\S]*?<\/div>/g, "");
const removedLegacyDebug = withoutLegacyDebug !== source;
source = withoutLegacyDebug;

if (source.includes('className="advancedCleanup"')) {
  if (removedLegacyDebug) fs.writeFileSync(path, source);
  console.log(removedLegacyDebug
    ? "Advanced manual cleanup already collapsed; removed legacy Edge Debug diagnostics."
    : "Advanced manual cleanup is already collapsed.");
  process.exit(0);
}

const scannerText = "Show Edge Scanner";
const scannerIndex = source.indexOf(scannerText);
if (scannerIndex < 0) throw new Error("Could not find Show Edge Scanner control.");
const blockStart = source.lastIndexOf("<button", scannerIndex);
if (blockStart < 0) throw new Error("Could not find edge-scanner button start.");

const endLabels = ["Apply Selected Candidate", "Create Edge Mask Candidates"];
let endLabelIndex = -1;
for (const label of endLabels) {
  const index = source.indexOf(label, scannerIndex);
  if (index > endLabelIndex) endLabelIndex = index;
}
if (endLabelIndex < 0) throw new Error("Could not find the end of the edge/manual cleanup controls.");
const endButtonClose = source.indexOf("</button>", endLabelIndex);
if (endButtonClose < 0) throw new Error("Could not find cleanup button end.");
const blockEnd = endButtonClose + "</button>".length;

const controls = source.slice(blockStart, blockEnd);
const wrapped = `<details className="advancedCleanup">\n                <summary>Advanced manual cleanup</summary>\n                <p className="helperText">Use edge tools only to correct or refine automatic architectural masks.</p>\n                <div className="advancedCleanupControls">\n                  ${controls}\n                </div>\n              </details>`;

source = source.slice(0, blockStart) + wrapped + source.slice(blockEnd);
fs.writeFileSync(path, source);
console.log(removedLegacyDebug
  ? "Removed legacy Edge Debug diagnostics and collapsed edge/manual masking controls behind Advanced manual cleanup."
  : "Collapsed edge/manual masking controls behind Advanced manual cleanup.");
