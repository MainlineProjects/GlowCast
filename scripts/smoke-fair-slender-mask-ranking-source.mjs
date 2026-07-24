import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "function rankArchitecturalMasks(",
  "aspect >= 0.08 && aspect <= 8 ? 0.62 : 0.1",
  "plausible slender doors, sidelights, columns, and transom-like regions competitive"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Fair slender-mask ranking smoke failed; missing: ${missing.join(", ")}`);
}

console.log("fair slender architectural-mask ranking source smoke passed");
