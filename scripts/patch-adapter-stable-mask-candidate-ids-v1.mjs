import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "function stableMaskCandidateId(";

if (!source.includes(marker)) {
  const insertAt = source.indexOf("function addFallbackCandidates(");
  if (insertAt < 0) throw new Error("fallback candidate insertion point not found");

  const helper = `function stableMaskCandidateId(prefix: string, box: SimpleBox): string {
  const geometry = [box.x, box.y, box.width, box.height]
    .map((value) => Math.round(value * 20).toString(36))
    .join("_");
  return prefix + "_" + geometry;
}

`;
  source = source.slice(0, insertAt) + helper + source.slice(insertAt);
}

source = source.replace(
  /id:\s*["']mask_fallback_["']\s*\+\s*Date\.now\(\)\s*\+\s*["']_["']\s*\+\s*next\.length\s*,/g,
  'id: stableMaskCandidateId("mask_fallback", box),'
);
source = source.replace(
  /id:\s*["']mask_candidate_["']\s*\+\s*Date\.now\(\)\s*\+\s*["']_["']\s*\+\s*accepted\.length\s*,/g,
  'id: stableMaskCandidateId("mask_candidate", box),'
);

if (!source.includes('stableMaskCandidateId("mask_fallback", box)')) {
  throw new Error("stable fallback ID wiring not found");
}
if (!source.includes('stableMaskCandidateId("mask_candidate", box)')) {
  throw new Error("stable detector ID wiring not found");
}

await fs.writeFile(path, source);
await import("./smoke-stable-mask-candidate-ids.mjs");
console.log("automatic mask identities now remain stable across repeated scans");
