import assert from "node:assert/strict";

function support({ bin, direction, binHits, minHits = 4 }) {
  const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));
  const surroundingHits = [1, 2, 3]
    .map((offset) => binHits.get(bin + direction * offset) ?? 0)
    .filter((hits) => hits > 0);
  const surroundingMean = surroundingHits.length > 0
    ? surroundingHits.reduce((sum, hits) => sum + hits, 0) / surroundingHits.length
    : resumedBinMinHits;
  const relativeMinHits = Math.max(resumedBinMinHits, Math.ceil(surroundingMean * 0.55));
  return (binHits.get(bin) ?? 0) >= relativeMinHits;
}

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 2], [5, 2], [6, 2]]) }),
  true,
  "two resumed hits should remain convincing on a lightly sampled edge"
);

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 6], [5, 6], [6, 6]]) }),
  false,
  "two resumed hits should not qualify when the surrounding edge is densely detected"
);

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 4], [4, 6], [5, 6], [6, 6]]) }),
  true,
  "substantial resumed support should qualify against a dense surrounding edge"
);

assert.equal(
  support({ bin: 4, direction: -1, binHits: new Map([[4, 3], [3, 4], [2, 5], [1, 4]]) }),
  true,
  "density-relative support should work symmetrically at the far endpoint"
);

console.log("three-sided fallback endpoint occlusion density smoke passed");
