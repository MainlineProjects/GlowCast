import assert from "node:assert/strict";

function support({ bin, direction, binHits, minHits = 4 }) {
  const resumedBinMinHits = Math.max(2, Math.ceil(minHits * 0.45));
  const samples = [1, 2, 3]
    .map((offset) => {
      const hits = binHits.get(bin + direction * offset) ?? 0;
      const uninterrupted = Array.from({ length: offset }, (_, index) =>
        binHits.get(bin + direction * (index + 1)) ?? 0
      ).every((intermediateHits) => intermediateHits > 0);
      return { hits, weight: uninterrupted ? 4 - offset : 0 };
    })
    .filter((sample) => sample.hits > 0 && sample.weight > 0);
  const sorted = samples.map((sample) => sample.hits).sort((a, b) => a - b);
  const robustCap = sorted.length > 1 ? sorted[sorted.length - 2] : sorted[0] ?? resumedBinMinHits;
  const weightedTotal = samples.reduce((sum, sample) => sum + Math.min(sample.hits, robustCap) * sample.weight, 0);
  const totalWeight = samples.reduce((sum, sample) => sum + sample.weight, 0);
  const density = totalWeight > 0 ? weightedTotal / totalWeight : resumedBinMinHits;
  const relativeMinHits = Math.max(resumedBinMinHits, Math.ceil(density * 0.55));
  return (binHits.get(bin) ?? 0) >= relativeMinHits;
}

assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 2], [5, 0], [6, 12]]) }),
  true,
  "dense support beyond an empty region should not inflate resumed-edge requirements"
);
assert.equal(
  support({ bin: 3, direction: 1, binHits: new Map([[3, 2], [4, 6], [5, 6], [6, 12]]) }),
  false,
  "uninterrupted dense nearby support should still require stronger resumed evidence"
);
assert.equal(
  support({ bin: 4, direction: -1, binHits: new Map([[4, 2], [3, 2], [2, 0], [1, 11]]) }),
  true,
  "continuity awareness should remain symmetric at the opposite endpoint"
);

console.log("three-sided fallback endpoint occlusion continuity-aware density smoke passed");
