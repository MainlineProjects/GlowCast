import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const sizeScore = Math.min(1, areaRatio / 0.045);
      const fillRatio = Math.min(1, polygonArea(candidate.points) / boxArea);
      const aspect = candidate.box.width / Math.max(candidate.box.height, 0.01);`;
const newBlock = `const fillRatio = Math.min(1, polygonArea(candidate.points) / boxArea);
      const aspect = candidate.box.width / Math.max(candidate.box.height, 0.01);
      const slenderArchitectural = (aspect >= 0.08 && aspect < 0.28) || (aspect > 3.8 && aspect <= 8);
      // Mixed architectural groups often contain smaller doors, sidelights, columns, or
      // transom-like regions beside larger windows. Give plausible slender regions a
      // slightly smaller area target without changing conventional-window ranking.
      const sizeTarget = slenderArchitectural ? 0.03 : 0.045;
      const sizeScore = Math.min(1, areaRatio / sizeTarget);`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const sizeTarget = slenderArchitectural ? 0.03 : 0.045;")) {
  throw new Error("Unable to locate architectural mask size-score block");
}

const oldAspect = "const aspectScore = aspect >= 0.28 && aspect <= 3.8 ? 1 : aspect >= 0.18 && aspect <= 5.2 ? 0.55 : 0.1;";
const fairAspect = "const aspectScore = aspect >= 0.28 && aspect <= 3.8 ? 1 : aspect >= 0.08 && aspect <= 8 ? 0.62 : 0.1;";
if (source.includes(oldAspect)) {
  source = source.replace(oldAspect, fairAspect);
} else if (!source.includes(fairAspect)) {
  throw new Error("Unable to preserve fair slender architectural aspect score");
}

await fs.writeFile(path, source);
console.log("made strongest-first ranking size-aware for mixed-size slender architectural masks");
