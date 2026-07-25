import assert from "node:assert/strict";

function polygonArea(points) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function outlineShapeMatched(left, right) {
  const leftArea = Math.max(left.box.width * left.box.height, 0.01);
  const rightArea = Math.max(right.box.width * right.box.height, 0.01);
  const leftFill = Math.min(1, polygonArea(left.points) / leftArea);
  const rightFill = Math.min(1, polygonArea(right.points) / rightArea);
  const fillSimilarity = Math.min(leftFill, rightFill) / Math.max(leftFill, rightFill, 0.01);
  const vertexSimilarity = Math.min(left.points.length, right.points.length) / Math.max(left.points.length, right.points.length, 1);
  const bothNearRectangular = leftFill >= 0.86 && rightFill >= 0.86;
  return fillSimilarity >= 0.68 && (vertexSimilarity >= 0.5 || bothNearRectangular);
}

const rectangle = {
  box: { x: 0, y: 0, width: 20, height: 30 },
  points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 30 }, { x: 0, y: 30 }],
};
const slightlyChamferedWindow = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 24, y: 2 }, { x: 26, y: 0 }, { x: 42, y: 0 }, { x: 44, y: 2 }, { x: 44, y: 28 }, { x: 42, y: 30 }, { x: 26, y: 30 }, { x: 24, y: 28 }],
};
const triangularFragment = {
  box: { x: 24, y: 0, width: 20, height: 30 },
  points: [{ x: 24, y: 30 }, { x: 34, y: 0 }, { x: 44, y: 30 }],
};

assert.equal(
  outlineShapeMatched(rectangle, slightlyChamferedWindow),
  true,
  "a rectangular opening and a similarly filled chamfered opening should remain compatible as a paired assembly",
);

assert.equal(
  outlineShapeMatched(rectangle, triangularFragment),
  false,
  "similarly sized boxes with strongly different outline fill/complexity should not masquerade as a paired opening",
);

console.log("outline-aware paired-spacing ranking smoke passed");
