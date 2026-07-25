import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `return Array.from({ length: 8 }, (_, index) => {
            const angle = (Math.PI * 2 * index) / 8;`;

const newBlock = `const contourSampleCount = 16;
          return Array.from({ length: contourSampleCount }, (_, index) => {
            const angle = (Math.PI * 2 * index) / contourSampleCount;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const contourSampleCount = 16;")) {
  throw new Error("Unable to locate normalized contour ray sampling for high-resolution profile patch");
}

await fs.writeFile(path, source);
console.log("paired-mask contour profile now samples sixteen rays so narrow contour defects cannot hide between coarse directions");
