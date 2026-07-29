import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");
const marker = "stableMaskCollapsedOutlineKeys";

if (!source.includes(marker)) {
  const helperStart = source.indexOf("function canonicalOutlineKey(");
  const helperEnd = source.indexOf("\nfunction stableMaskGeometryId(", helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error("stable outline identity helper not found");

  let helper = source.slice(helperStart, helperEnd);
  const anchor = `  const keys = points.map((point) => \`${'${Math.round(point.x * stableMaskJitterToleranceStep).toString(36)},${Math.round(point.y * stableMaskJitterToleranceStep).toString(36)}'}\`);\n  if (keys.length === 0) return "empty";`;
  if (!helper.includes(anchor)) throw new Error("stable outline quantization anchor not found");

  helper = helper.replace(
    anchor,
    `  const keys = points.map((point) => \`${'${Math.round(point.x * stableMaskJitterToleranceStep).toString(36)},${Math.round(point.y * stableMaskJitterToleranceStep).toString(36)}'}\`);
  const stableMaskCollapsedOutlineKeys = keys.filter((key, index) => index === 0 || key !== keys[index - 1]);
  if (
    stableMaskCollapsedOutlineKeys.length > 1 &&
    stableMaskCollapsedOutlineKeys[0] === stableMaskCollapsedOutlineKeys[stableMaskCollapsedOutlineKeys.length - 1]
  ) {
    stableMaskCollapsedOutlineKeys.pop();
  }
  if (stableMaskCollapsedOutlineKeys.length === 0) return "empty";`
  );
  helper = helper.replace("  const rotations = (sequence: string[]) =>", "  const rotations = (sequence: string[]) =>");
  helper = helper.replace("  const forward = rotations(keys);", "  const forward = rotations(stableMaskCollapsedOutlineKeys);");
  helper = helper.replace("  const reverse = rotations([...keys].reverse());", "  const reverse = rotations([...stableMaskCollapsedOutlineKeys].reverse());");

  source = source.slice(0, helperStart) + helper + source.slice(helperEnd);
}

await fs.writeFile(path, source);
await import("./smoke-collapse-redundant-stable-outline-points.mjs");
console.log("stable automatic mask identities now ignore redundant outline points");
