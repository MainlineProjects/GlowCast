import assert from "node:assert/strict";

function robustCurveCoefficient(centers, axis = "row") {
  const ordered = [...centers].sort((left, right) => axis === "row" ? left.x - right.x : left.y - right.y);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const span = axis === "row" ? last.x - first.x : last.y - first.y;
  const candidates = ordered.slice(1, -1).map((center) => {
    const fraction = span > 0
      ? ((axis === "row" ? center.x - first.x : center.y - first.y) / span)
      : 0;
    const weight = 4 * fraction * (1 - fraction);
    const linear = axis === "row"
      ? first.y + (last.y - first.y) * fraction
      : first.x + (last.x - first.x) * fraction;
    const observed = axis === "row" ? center.y : center.x;
    return weight > 0.18 ? (observed - linear) / weight : null;
  }).filter((value) => value !== null).sort((left, right) => left - right);

  if (candidates.length === 0) return 0;
  const middle = Math.floor(candidates.length / 2);
  return candidates.length % 2 === 0
    ? (candidates[middle - 1] + candidates[middle]) / 2
    : candidates[middle];
}

function maxCurveResidual(centers, coefficient, axis = "row") {
  const ordered = [...centers].sort((left, right) => axis === "row" ? left.x - right.x : left.y - right.y);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const span = axis === "row" ? last.x - first.x : last.y - first.y;
  return ordered.reduce((maxResidual, center) => {
    const fraction = span > 0
      ? ((axis === "row" ? center.x - first.x : center.y - first.y) / span)
      : 0;
    const linear = axis === "row"
      ? first.y + (last.y - first.y) * fraction
      : first.x + (last.x - first.x) * fraction;
    const expected = linear + coefficient * 4 * fraction * (1 - fraction);
    const observed = axis === "row" ? center.y : center.x;
    return Math.max(maxResidual, Math.abs(observed - expected));
  }, 0);
}

const smoothRow = [
  { x: 10, y: 10 },
  { x: 30, y: 14 },
  { x: 50, y: 20 },
  { x: 70, y: 28 },
  { x: 90, y: 38 },
];
assert.ok(Math.abs(robustCurveCoefficient(smoothRow) + 4) < 1e-9, "smooth row should recover its shared curvature coefficient");

const badMidpointRow = [
  { x: 10, y: 10 },
  { x: 30, y: 14 },
  { x: 50, y: 32 },
  { x: 70, y: 28 },
  { x: 90, y: 38 },
];
const robustRowCoefficient = robustCurveCoefficient(badMidpointRow);
assert.ok(Math.abs(robustRowCoefficient + 4) < 1e-9, "one displaced midpoint must not steer the row curvature away from the surrounding openings");
assert.ok(maxCurveResidual(badMidpointRow, robustRowCoefficient) >= 12, "the displaced midpoint should remain exposed as a large residual after robust fitting");

const badMidpointColumn = [
  { x: 10, y: 10 },
  { x: 14, y: 30 },
  { x: 32, y: 50 },
  { x: 28, y: 70 },
  { x: 38, y: 90 },
];
const robustColumnCoefficient = robustCurveCoefficient(badMidpointColumn, "column");
assert.ok(Math.abs(robustColumnCoefficient + 4) < 1e-9, "column fitting should resist one displaced midpoint symmetrically");
assert.ok(maxCurveResidual(badMidpointColumn, robustColumnCoefficient, "column") >= 12, "the displaced column midpoint should remain exposed instead of bending the fitted curve");

console.log("robust curved perspective fit smoke passed");
