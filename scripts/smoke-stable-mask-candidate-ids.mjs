import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /function stableMaskCandidateId\(prefix: string, box: SimpleBox\): string/);
assert.match(source, /stableMaskCandidateId\("mask_fallback", box\)/);
assert.match(source, /stableMaskCandidateId\("mask_candidate", box\)/);
assert.doesNotMatch(source, /mask_(?:fallback|candidate)_" \+ Date\.now\(\)/);

function stableId(prefix, box) {
  const geometry = [box.x, box.y, box.width, box.height]
    .map((value) => Math.round(value * 20).toString(36))
    .join("_");
  return prefix + "_" + geometry;
}

const box = { x: 10.02, y: 20.01, width: 30.03, height: 40.04 };
assert.equal(stableId("mask_candidate", box), stableId("mask_candidate", { ...box }));
assert.equal(
  stableId("mask_candidate", box),
  stableId("mask_candidate", { x: 10.019, y: 20.012, width: 30.031, height: 40.039 }),
  "subpixel detector jitter should not replace a user's automatic mask identity"
);
assert.notEqual(
  stableId("mask_candidate", box),
  stableId("mask_candidate", { ...box, x: 10.2 }),
  "meaningfully different geometry must retain a distinct identity"
);
assert.notEqual(stableId("mask_candidate", box), stableId("mask_fallback", box));

console.log("stable automatic mask candidate ID smoke passed");
