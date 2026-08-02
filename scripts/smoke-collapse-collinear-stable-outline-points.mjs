import assert from "node:assert/strict";
import fs from "node:fs/promises";

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");
assert.match(source, /stableMaskCollinearOutlineKeys/);
assert.match(source, /cross === 0 && dot >= 0/);
assert.match(source, /rotations\(stableMaskCollinearOutlineKeys\)/);

function simplify(keys) {
  const decode = (key) => {
    const [x, y] = key.split(",");
    return { x: Number.parseInt(x, 36), y: Number.parseInt(y, 36) };
  };
  let sequence = [...keys];
  let removed = true;
  while (removed && sequence.length > 3) {
    removed = false;
    sequence = sequence.filter((key, index, values) => {
      const previous = decode(values[(index - 1 + values.length) % values.length]);
      const current = decode(key);
      const next = decode(values[(index + 1) % values.length]);
      const incomingX = current.x - previous.x;
      const incomingY = current.y - previous.y;
      const outgoingX = next.x - current.x;
      const outgoingY = next.y - current.y;
      const cross = incomingX * outgoingY - incomingY * outgoingX;
      const dot = incomingX * outgoingX + incomingY * outgoingY;
      const redundant = cross === 0 && dot >= 0;
      if (redundant) removed = true;
      return !redundant;
    });
  }
  return sequence;
}

function canonical(keys) {
  const simplified = simplify(keys);
  const rotations = (sequence) => sequence.map((_, index) => sequence.slice(index).concat(sequence.slice(0, index)).join(";"));
  return [...rotations(simplified), ...rotations([...simplified].reverse())].sort()[0];
}

const rectangle = ["0,0", "a,0", "a,a", "0,a"];
const subdividedRectangle = ["0,0", "5,0", "a,0", "a,5", "a,a", "5,a", "0,a", "0,5"];
assert.equal(canonical(rectangle), canonical(subdividedRectangle), "straight-edge intermediate points should preserve identity");
assert.notEqual(canonical(rectangle), canonical(["0,0", "5,1", "a,0", "a,a", "0,a"]), "a real bend must remain identity-significant");
assert.notEqual(canonical(rectangle), canonical(["0,0", "a,0", "5,0", "a,a", "0,a"]), "backtracking collinear geometry must not be collapsed");

console.log("collinear stable outline point collapse smoke passed");
