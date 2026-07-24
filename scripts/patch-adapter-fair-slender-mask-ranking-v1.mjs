import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldScore = "const aspectScore = aspect >= 0.28 && aspect <= 3.8 ? 1 : aspect >= 0.18 && aspect <= 5.2 ? 0.55 : 0.1;";
const newScore = "const aspectScore = aspect >= 0.28 && aspect <= 3.8 ? 1 : aspect >= 0.08 && aspect <= 8 ? 0.62 : 0.1;";

if (source.includes(oldScore)) {
  source = source.replace(
    oldScore,
    `// Keep plausible slender doors, sidelights, columns, and transom-like regions competitive\n      // without giving extreme slivers the same ranking boost as conventional openings.\n      ${newScore}`
  );
  await fs.writeFile(path, source);
  console.log("broadened architectural aspect ranking for plausible slender masks");
} else if (source.includes(newScore)) {
  console.log("fair slender-mask architectural ranking already applied");
} else {
  throw new Error("Unable to locate architectural mask aspect ranking score");
}
