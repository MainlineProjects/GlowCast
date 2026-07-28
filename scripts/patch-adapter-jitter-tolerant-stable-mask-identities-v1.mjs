import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "stableMaskJitterToleranceStep";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function canonicalOutlineKey(");
  const helperEnd = source.indexOf("\nfunction getAdapterDetectorLimits(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("stable mask identity helpers not found");

  let helpers = source.slice(helperStart, helperEnd);
  if (!helpers.includes("Math.round(point.x * 20)") || !helpers.includes("Math.round(value * 20)")) {
    throw new Error("stable mask identity quantization anchors not found");
  }

  helpers = helpers.replace("function canonicalOutlineKey(points: SimplePoint[]): string {", `const stableMaskJitterToleranceStep = 10;

function canonicalOutlineKey(points: SimplePoint[]): string {`);
  helpers = helpers.replaceAll("Math.round(point.x * 20)", "Math.round(point.x * stableMaskJitterToleranceStep)");
  helpers = helpers.replaceAll("Math.round(point.y * 20)", "Math.round(point.y * stableMaskJitterToleranceStep)");
  helpers = helpers.replaceAll("Math.round(value * 20)", "Math.round(value * stableMaskJitterToleranceStep)");
  source = source.slice(0, helperStart) + helpers + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-jitter-tolerant-stable-mask-identities.mjs");
console.log("stable automatic mask identities now tolerate minor detector jitter");
