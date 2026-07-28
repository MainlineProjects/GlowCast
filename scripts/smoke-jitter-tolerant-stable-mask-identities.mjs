import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /const stableMaskJitterToleranceStep = 10;/);
assert.match(source, /Math\.round\(point\.x \* stableMaskJitterToleranceStep\)/);
assert.match(source, /Math\.round\(point\.y \* stableMaskJitterToleranceStep\)/);
assert.match(source, /Math\.round\(value \* stableMaskJitterToleranceStep\)/);
assert.doesNotMatch(source, /Math\.round\((?:point\.[xy]|value) \* 20\)/);

function quantize(value) {
  return Math.round(value * 10);
}

assert.equal(quantize(20.01), quantize(20.04), "minor detector jitter should preserve identity");
assert.notEqual(quantize(20.01), quantize(20.16), "meaningful movement must still produce a new identity");

console.log("jitter-tolerant stable automatic mask identity smoke passed");
