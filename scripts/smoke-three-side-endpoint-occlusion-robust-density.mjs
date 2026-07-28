import assert from "node:assert/strict";

function support({ bin, direction, binHits, minHits = 4 }) {
  const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));
  const surroundingHits = [1, 2, 3]
    .map((offset) => binHits.get(bin + direction * offset) ?? 0)
    .filter((hits) => hits > 0);
  const sortedSurroundingHits = [...surroundingHits].sort((a, b) => a - b);
  const robustDensity = sortedSurroundingHits.length > 0
    ? sortedSurroundingHits[Math.floor((sortedSurroundingHits.length - 1) / 2)]
    : resumedBinMinHits;
  const relativeMinHits = Math.max(resumedBinMinHits, Math.ceil(robustDensity * 0.55));
  return (binHits.get(bin) ?? 0) >= relativeMinHits;
}

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 2], [5, 2], [6, 12]]) }),
  true,
  "one isolated dense surrounding bin should not over-penalize otherwise light edge support"
);

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 6], [5, 6], [6, 12]]) }),
  false,
  "consistently dense surrounding support should still require stronger resumed evidence"
);

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 4], [4, 6], [5, 6], [6, 12]]) }),
  true,
  "substantial resumed support should pass against robustly dense surroundings"
);

assert.equal(
  support({ bin: 4, direction: -1, binHits: new Map([[4, 2], [3, 2], [2, 2], [1, 11]]) }),
  true,
  "robust density normalization should work symmetrically at the far endpoint"
);

console.log("three-sided fallback endpoint occlusion robust density smoke passed");
