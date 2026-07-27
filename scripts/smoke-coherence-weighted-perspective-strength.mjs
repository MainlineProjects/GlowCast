import assert from "node:assert/strict";

function spacingConsistency(residualRatios) {
  const supportLogResiduals = residualRatios
    .map((ratio) => Math.abs(Math.log(Math.max(ratio, 1e-6))))
    .sort((a, b) => a - b);
  const consistencyResiduals = supportLogResiduals.length >= 3
    ? supportLogResiduals.slice(0, -1)
    : supportLogResiduals;
  const supportConsistencyResidual = Math.max(0, ...consistencyResiduals);
  return Math.max(0, Math.min(1,
    1 - (supportConsistencyResidual / Math.log(1.10))
  ));
}

function weightedPerspectiveStrength(robustSlope, residualRatios) {
  return Math.min(1, Math.abs(robustSlope) / 0.18) * spacingConsistency(residualRatios);
}

const coherentStrong = weightedPerspectiveStrength(0.18, [1.00, 1.01, 0.99]);
assert.ok(coherentStrong > 0.88,
  "a strong, coherent perspective sequence should retain nearly full directional confidence");

const shallowCoherent = weightedPerspectiveStrength(0.018, [1.00, 1.01, 0.99]);
assert.ok(shallowCoherent > 0.08 && shallowCoherent < 0.10,
  "a shallow coherent sequence should still derive most of its confidence from slope magnitude");

const strongButNoisy = weightedPerspectiveStrength(0.18, [1.18, 0.84]);
assert.ok(strongButNoisy < 0.05,
  "a steep but internally noisy sequence should not receive strong directional confidence");

const oneOutlierAmongCoherentSupport = weightedPerspectiveStrength(0.18, [1.00, 1.01, 0.99, 1.30]);
assert.ok(oneOutlierAmongCoherentSupport > 0.88,
  "one isolated noisy support interval should not erase an otherwise coherent perspective trend");

const flat = weightedPerspectiveStrength(0, [1.00, 1.00, 1.00]);
assert.equal(flat, 0, "flat geometry should never gain perspective confidence from spacing coherence alone");

console.log("coherence-weighted perspective strength smoke passed");
