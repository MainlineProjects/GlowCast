import assert from "node:assert/strict";

function support({ bin, direction, binHits, minHits = 4 }) {
  const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));
  const samples = [1, 2, 3]
    .map((offset) => ({ hits: binHits.get(bin + direction * offset) ?? 0, weight: 4 - offset }))
    .filter((sample) => sample.hits > 0);
  const sorted = samples.map((sample) => sample.hits).sort((a, b) => a - b);
  const robustCap = sorted.length > 1 ? sorted[sorted.length - 2] : sorted[0] ?? resumedBinMinHits;
  const weightedTotal = samples.reduce((sum, sample) => sum + Math.min(sample.hits, robustCap) * sample.weight, 0);
  const totalWeight = samples.reduce((sum, sample) => sum + sample.weight, 0);
  const density = totalWeight > 0 ? weightedTotal / totalWeight : resumedBinMinHits;
  const relativeMinHits = Math.max(resumedBinMinHits, Math.ceil(density * 0.55));
  return (binHits.get(bin) ?? 0) >= relativeMinHits;
}

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 2], [5, 2], [6, 12]]) }),
  true,
  "one isolated far dense bin should remain robustly ignored"
);
assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 6], [5, 6], [6, 12]]) }),
  false,
  "consistently dense nearby support should require stronger resumed evidence"
);
assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 3], [4, 4], [5, 2], [6, 2]]) }),
  true,
  "strong resumed support should pass when nearby context is moderate"
);
assert.equal(
  support({ bin: 4, direction: -1, binHits: new Map([[4, 2], [3, 2], [2, 2], [1, 11]]) }),
  true,
  "distance weighting should remain symmetric at the far endpoint"
);

console.log("three-sided fallback endpoint occlusion distance-weighted density smoke passed");
