import assert from "node:assert/strict";

function supportSpacingIsSafe(steps) {
  if (steps.length < 3) return true;

  const logSteps = steps.map((step) => Math.log(Math.max(step, 1e-6)));
  for (let candidateIndex = 0; candidateIndex < steps.length; candidateIndex += 1) {
    const support = logSteps
      .map((value, index) => ({ index, value }))
      .filter(({ index }) => index !== candidateIndex);
    const meanIndex = support.reduce((sum, point) => sum + point.index, 0) / support.length;
    const meanLogStep = support.reduce((sum, point) => sum + point.value, 0) / support.length;
    const denominator = support.reduce((sum, point) => sum + ((point.index - meanIndex) ** 2), 0);
    const slope = denominator > 0
      ? support.reduce((sum, point) => sum + ((point.index - meanIndex) * (point.value - meanLogStep)), 0) / denominator
      : 0;
    const intercept = meanLogStep - (slope * meanIndex);
    const expectedStep = Math.exp(intercept + (slope * candidateIndex));
    const candidateRatio = steps[candidateIndex] / Math.max(expectedStep, 1e-6);
    const supportResidualRatio = Math.max(...support.map((point) =>
      Math.exp(Math.abs(point.value - (intercept + (slope * point.index)))),
    ));

    if (candidateRatio > 1.58 && supportResidualRatio <= 1.10) return false;
  }

  return true;
}

assert.equal(supportSpacingIsSafe([20, 20, 20, 20]), true, "regular spacing should remain eligible");
assert.equal(supportSpacingIsSafe([42, 30, 21.5, 15.4]), true, "aggressively receding perspective spacing should remain eligible");
assert.equal(supportSpacingIsSafe([15.4, 21.5, 30, 42]), true, "aggressively expanding perspective spacing should remain eligible");
assert.equal(supportSpacingIsSafe([42, 21, 21.5, 15.4]), true, "one compressed noisy interval should not make a clean neighboring gap look like a missing opening");
assert.equal(supportSpacingIsSafe([42, 30, 43, 15.4]), false, "an interior missing-opening-sized gap should still be rejected when the remaining progression is coherent");
assert.equal(supportSpacingIsSafe([68, 30, 21.5, 15.4]), false, "a boundary missing-opening-sized gap should still be rejected when the remaining progression is coherent");
assert.equal(supportSpacingIsSafe([25, 23, 20, 18]), true, "mild natural spacing variation should remain eligible");

console.log("robust perspective spacing consensus smoke passed");
