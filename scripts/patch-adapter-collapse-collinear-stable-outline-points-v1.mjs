import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "stableMaskCollinearOutlineKeys";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function canonicalOutlineKey(");
  const helperEnd = source.indexOf("\nfunction stableMaskGeometryId(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("stable outline identity helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const anchor = `  if (stableMaskCollapsedOutlineKeys.length === 0) return "empty";`;
  if (!helper.includes(anchor)) throw new Error("collapsed stable outline anchor not found");

  helper = helper.replace(
    anchor,
    `  if (stableMaskCollapsedOutlineKeys.length === 0) return "empty";
  const decodeStableMaskPoint = (key: string) => {
    const [x, y] = key.split(",");
    return { x: Number.parseInt(x, 36), y: Number.parseInt(y, 36) };
  };
  let stableMaskCollinearOutlineKeys = [...stableMaskCollapsedOutlineKeys];
  let removedStableMaskCollinearPoint = true;
  while (removedStableMaskCollinearPoint && stableMaskCollinearOutlineKeys.length > 3) {
    removedStableMaskCollinearPoint = false;
    stableMaskCollinearOutlineKeys = stableMaskCollinearOutlineKeys.filter((key, index, sequence) => {
      const previous = decodeStableMaskPoint(sequence[(index - 1 + sequence.length) % sequence.length]);
      const current = decodeStableMaskPoint(key);
      const next = decodeStableMaskPoint(sequence[(index + 1) % sequence.length]);
      const incomingX = current.x - previous.x;
      const incomingY = current.y - previous.y;
      const outgoingX = next.x - current.x;
      const outgoingY = next.y - current.y;
      const cross = incomingX * outgoingY - incomingY * outgoingX;
      const dot = incomingX * outgoingX + incomingY * outgoingY;
      const redundant = cross === 0 && dot >= 0;
      if (redundant) removedStableMaskCollinearPoint = true;
      return !redundant;
    });
  }`
  );
  helper = helper.replace("  const forward = rotations(stableMaskCollapsedOutlineKeys);", "  const forward = rotations(stableMaskCollinearOutlineKeys);");
  helper = helper.replace(
    "  const reverse = rotations([...stableMaskCollapsedOutlineKeys].reverse());",
    "  const reverse = rotations([...stableMaskCollinearOutlineKeys].reverse());"
  );

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-collapse-collinear-stable-outline-points.mjs");
console.log("stable automatic mask identities now ignore harmless collinear outline points");
