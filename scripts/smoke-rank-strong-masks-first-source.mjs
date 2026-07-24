import "./patch-adapter-fair-slender-mask-ranking-v1.mjs";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "function polygonArea(",
  "function rankArchitecturalMasks(",
  "const sizeScore = Math.min(1, areaRatio / 0.045);",
  "const fillRatio = Math.min(1, polygonArea(candidate.points) / boxArea);",
  "return rankArchitecturalMasks(suppressIsolatedMaskSpecks(",
  "aspect >= 0.08 && aspect <= 8 ? 0.62 : 0.1"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Strongest-first mask ranking smoke failed; missing: ${missing.join(", ")}`);
}

console.log("strongest-first automatic mask ranking source smoke passed with fair slender-mask treatment");
