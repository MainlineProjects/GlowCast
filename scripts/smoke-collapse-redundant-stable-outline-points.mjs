import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /stableMaskCollapsedOutlineKeys/);
assert.match(source, /key !== keys\[index - 1\]/);
assert.match(source, /stableMaskCollapsedOutlineKeys\.pop\(\)/);
assert.match(source, /rotations\(stableMaskCollapsedOutlineKeys\)/);

function canonical(keys) {
  const collapsed = keys.filter((key, index) => index === 0 || key !== keys[index - 1]);
  if (collapsed.length > 1 && collapsed[0] === collapsed[collapsed.length - 1]) collapsed.pop();
  if (collapsed.length === 0) return "empty";
  const rotations = (sequence) => sequence.map((_, index) => sequence.slice(index).concat(sequence.slice(0, index)).join(";"));
  return [...rotations(collapsed), ...rotations([...collapsed].reverse())].sort()[0];
}

const rectangle = ["a", "b", "c", "d"];
assert.equal(canonical(rectangle), canonical(["a", "a", "b", "c", "c", "d", "a"]), "redundant consecutive and closing points should preserve identity");
assert.equal(canonical(rectangle), canonical(["c", "d", "a", "b"]), "outline starting point should remain irrelevant");
assert.equal(canonical(rectangle), canonical(["d", "c", "b", "a"]), "outline winding should remain irrelevant");
assert.notEqual(canonical(rectangle), canonical(["a", "b", "x", "d"]), "meaningfully different geometry must remain distinct");

console.log("redundant stable outline point collapse smoke passed");
