import fs from "node:fs/promises";

const adapterPath = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(adapterPath, "utf8");

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
    const slenderArchitecturalOpening =
      sideCoverage.sides === 4 &&
      area >= boundsArea * 0.006 &&
      (
        (widthRatio >= 0.035 && heightRatio >= 0.12 && aspect <= 0.5) ||
        (heightRatio >= 0.035 && widthRatio >= 0.12 && aspect >= 2)
      );

    // Preserve a strongly closed narrow door, sidelight, transom, or similar opening
    // beside larger regions without broadly relaxing the fallback noise floor.
    if ((!standardOpeningSize && !slenderArchitecturalOpening) || sideCoverage.sides < 3 || !sideCoverage.hasHorizontal || !sideCoverage.hasVertical) return [];
`;

if (!source.includes(anchor)) {
  throw new Error("Unable to locate recovered fallback terminal-size validation");
}
source = source.replace(anchor, replacement);

if (!source.includes("const slenderArchitecturalOpening =") || !source.includes("sideCoverage.sides === 4") || !source.includes("widthRatio >= 0.035")) {
  throw new Error("Mixed-size architectural opening preservation was not fully applied");
}

await fs.writeFile(adapterPath, source);
console.log("Preserved strongly closed mixed-size architectural openings during sparse-bridge recovery.");
