import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldScore = "const sizeScore = Math.min(1, areaRatio / 0.045);";
const newScore = `const slenderArchitectural = (aspect >= 0.08 && aspect < 0.28) || (aspect > 3.8 && aspect <= 8);
      // Mixed architectural groups often contain smaller doors, sidelights, columns, or
      // transom-like regions beside larger windows. Give plausible slender regions a
      // slightly smaller area target without changing conventional-window ranking.
      const sizeTarget = slenderArchitectural ? 0.03 : 0.045;
      const sizeScore = Math.min(1, areaRatio / sizeTarget);`;

if (source.includes(oldScore)) {
  source = source.replace(oldScore, newScore);
  await fs.writeFile(path, source);
  console.log("made strongest-first size ranking fairer for smaller slender architectural masks");
} else if (source.includes("const sizeTarget = slenderArchitectural ? 0.03 : 0.045;")) {
  console.log("mixed-size architectural ranking already applied");
} else {
  throw new Error("Unable to locate architectural mask size score");
}
