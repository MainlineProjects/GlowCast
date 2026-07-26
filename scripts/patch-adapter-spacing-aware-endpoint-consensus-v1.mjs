import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `        const supportCandidates = [localPool];`;
const newBlock = `        const localPoolAxisSteps = localPool.slice(1).map((member, index) =>
          axisCoordinate(member) - axisCoordinate(localPool[index]),
        ).filter((step) => step > 0);
        if (localPoolAxisSteps.length >= 3) {
          const medianPoolAxisStep = median(localPoolAxisSteps);
          const largestPoolAxisStep = Math.max(...localPoolAxisSteps);
          if (largestPoolAxisStep > medianPoolAxisStep * 1.75) return false;
        }
        const supportCandidates = [localPool];`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const localPoolAxisSteps = localPool.slice(1)")) {
  throw new Error("Unable to locate endpoint support candidate block for spacing-aware consensus patch");
}

await fs.writeFile(path, source);
await import("./smoke-spacing-aware-endpoint-consensus.mjs");
await import("./patch-adapter-perspective-normalized-endpoint-spacing-v1.mjs");
console.log("endpoint neighbor consensus now follows local perspective spacing without crossing missing-opening-sized gaps");
