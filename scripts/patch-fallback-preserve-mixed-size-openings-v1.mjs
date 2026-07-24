import fs from "node:fs/promises";

const adapterPath = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(adapterPath, "utf8");

const helperMarker = "function hasStrongSlenderBoundary(";
if (!source.includes(helperMarker)) {
  const insertAt = source.indexOf("function recoverSparseBridgeComponents(");
  if (insertAt < 0) throw new Error("Unable to locate sparse-bridge recovery function");
  const helper = `function hasStrongSlenderBoundary(points: EdgePoint[], box: SimpleBox): boolean {
  const tolerance = Math.max(1.2, Math.min(box.width, box.height) * 0.12);
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  for (const point of points) {
    if (point.x < box.x - tolerance || point.x > box.x + box.width + tolerance) continue;
    if (point.y < box.y - tolerance || point.y > box.y + box.height + tolerance) continue;
    if (Math.abs(point.y - box.y) <= tolerance) top += 1;
    if (Math.abs(point.y - (box.y + box.height)) <= tolerance) bottom += 1;
    if (Math.abs(point.x - box.x) <= tolerance) left += 1;
    if (Math.abs(point.x - (box.x + box.width)) <= tolerance) right += 1;
  }

  // Use the physical length of each side instead of total edge count. This prevents
  // a tall narrow door from demanding as many hits on its short lintel/sill as on its jambs.
  const horizontalHits = Math.max(3, Math.ceil(box.width * 0.55));
  const verticalHits = Math.max(4, Math.ceil(box.height * 0.35));
  return top >= horizontalHits && bottom >= horizontalHits && left >= verticalHits && right >= verticalHits;
}

`;
  source = source.slice(0, insertAt) + helper + source.slice(insertAt);
}

const anchor = `    const recoveredBox = terminalGroup.box;
    const area = recoveredBox.width * recoveredBox.height;
    if (
      recoveredBox.width < Math.max(5, bounds.width * 0.055) ||
      recoveredBox.height < Math.max(5, bounds.height * 0.055) ||
      area < boundsArea * 0.008
    ) return [];

    const sideCoverage = getFallbackSideCoverage(terminalGroup.points, recoveredBox);
    if (sideCoverage.sides < 3 || !sideCoverage.hasHorizontal || !sideCoverage.hasVertical) return [];
`;

const replacement = `    const recoveredBox = terminalGroup.box;
    const area = recoveredBox.width * recoveredBox.height;
    const sideCoverage = getFallbackSideCoverage(terminalGroup.points, recoveredBox);
    const widthRatio = recoveredBox.width / Math.max(bounds.width, 1);
    const heightRatio = recoveredBox.height / Math.max(bounds.height, 1);
    const aspect = recoveredBox.width / Math.max(recoveredBox.height, 0.01);
    const standardOpeningSize =
      recoveredBox.width >= Math.max(5, bounds.width * 0.055) &&
      recoveredBox.height >= Math.max(5, bounds.height * 0.055) &&
      area >= boundsArea * 0.008;
    const slenderBoundaryClosed = hasStrongSlenderBoundary(terminalGroup.points, recoveredBox);
    const slenderArchitecturalOpening =
      slenderBoundaryClosed &&
      area >= boundsArea * 0.006 &&
      (
        (widthRatio >= 0.035 && heightRatio >= 0.12 && aspect <= 0.5) ||
        (heightRatio >= 0.035 && widthRatio >= 0.12 && aspect >= 2)
      );
    const hasGeneralClosure = sideCoverage.sides >= 3 && sideCoverage.hasHorizontal && sideCoverage.hasVertical;

    // Keep valid terminals even if one sibling is too small or too open. Recovery is
    // still accepted only when at least two architectural regions survive the full gate.
    if ((!standardOpeningSize && !slenderArchitecturalOpening) || (!hasGeneralClosure && !slenderArchitecturalOpening)) continue;
`;

if (!source.includes(anchor)) {
  throw new Error("Unable to locate recovered fallback terminal-size validation");
}
source = source.replace(anchor, replacement);

const returnAnchor = "  return recovered.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));";
const returnReplacement = `  if (recovered.length < 2) return [];
  return recovered.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));`;
if (!source.includes(returnAnchor)) {
  throw new Error("Unable to locate recovered fallback return gate");
}
source = source.replace(returnAnchor, returnReplacement);

if (
  !source.includes(helperMarker) ||
  !source.includes("const slenderBoundaryClosed =") ||
  !source.includes("widthRatio >= 0.035") ||
  !source.includes("horizontalHits = Math.max(3") ||
  !source.includes("if (recovered.length < 2) return [];")
) {
  throw new Error("Mixed-size architectural opening preservation was not fully applied");
}

await fs.writeFile(adapterPath, source);
console.log("Preserved strongly closed mixed-size architectural openings and retained valid siblings when one terminal fails validation.");
