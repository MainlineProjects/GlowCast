import assert from "node:assert/strict";

function supportSpacingIsSafe(steps) {
  if (steps.length < 3) return true;
  const lastStepIndex = steps.length - 1;
  const normalizedGapRatios = steps.map((step, index) => {
    let expectedStep;
    if (index === 0) {
      expectedStep = (steps[1] ** 2) / Math.max(steps[2], 1e-6);
    } else if (index === lastStepIndex) {
      expectedStep = (steps[lastStepIndex - 1] ** 2) / Math.max(steps[lastStepIndex - 2], 1e-6);
    } else {
      expectedStep = Math.sqrt(steps[index - 1] * steps[index + 1]);
    }
    return step / Math.max(expectedStep, 1e-6);
  });
  return Math.max(...normalizedGapRatios) <= 1.58;
}

assert.equal(supportSpacingIsSafe([20, 20, 20, 20]), true, "regular spacing should remain eligible");
assert.equal(supportSpacingIsSafe([42, 30, 21.5, 15.4]), true, "aggressively receding perspective spacing should remain eligible");
assert.equal(supportSpacingIsSafe([15.4, 21.5, 30, 42]), true, "aggressively expanding perspective spacing should remain eligible");
assert.equal(supportSpacingIsSafe([42, 30, 43, 15.4]), false, "an interior missing-opening-sized gap should be rejected relative to local perspective");
assert.equal(supportSpacingIsSafe([68, 30, 21.5, 15.4]), false, "a boundary missing-opening-sized gap should be rejected relative to projected perspective spacing");
assert.equal(supportSpacingIsSafe([25, 23, 20, 18]), true, "mild natural spacing variation should remain eligible");

console.log("perspective-normalized endpoint spacing smoke passed");
