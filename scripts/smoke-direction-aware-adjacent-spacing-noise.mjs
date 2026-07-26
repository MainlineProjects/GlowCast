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

    if (steps.length >= 4) {
      for (let left = 0; left < support.length - 1; left += 1) {
        for (let right = left + 1; right < support.length; right += 1) {
          const first = support[left];
          const second = support[right];
          if (second.index - first.index < 2) continue;
          const robustSlope = (second.value - first.value) / (second.index - first.index);
          if (Math.abs(robustSlope) > 0.55) continue;
          const robustIntercept = first.value - (robustSlope * first.index);
          const robustExpected = Math.exp(robustIntercept + (robustSlope * candidateIndex));
          const robustCandidateRatio = steps[candidateIndex] / Math.max(robustExpected, 1e-6);
          if (robustCandidateRatio <= 1.58) continue;

          const remainder = support.filter((_, index) => index !== left && index !== right);
          let spacingNoiseCount = 0;
          const tolerableRemainder = remainder.every((point) => {
            const predicted = Math.exp(robustIntercept + (robustSlope * point.index));
            const ratio = Math.exp(point.value) / Math.max(predicted, 1e-6);
            if (ratio >= (1 / 1.10) && ratio <= 1.10) return true;
            const adjacentToMissingCandidate = Math.abs(point.index - candidateIndex) === 1;
            const perspectiveDirection = Math.sign(robustSlope);
            const adjacentDirection = Math.sign(point.index - candidateIndex);
            const adjacentOnExpandingSide = adjacentToMissingCandidate
              && perspectiveDirection !== 0
              && adjacentDirection === perspectiveDirection;
            const compressedNoiseFloor = adjacentOnExpandingSide
              ? 0.78
              : (adjacentToMissingCandidate ? 0.70 : 0.45);
            const expandedNoiseCeiling = adjacentOnExpandingSide
              ? 1.16
              : (adjacentToMissingCandidate ? 1.22 : 1.35);
            if (ratio >= compressedNoiseFloor && ratio < (1 / 1.10)) {
              spacingNoiseCount += 1;
              return spacingNoiseCount <= 1;
            }
            if (ratio > 1.10 && ratio <= expandedNoiseCeiling) {
              spacingNoiseCount += 1;
              return spacingNoiseCount <= 1;
            }
            return false;
          });
          if (tolerableRemainder) return false;
        }
      }
    }
  }

  return true;
}

assert.equal(supportSpacingIsSafe([20, 20, 20, 20]), true, "regular spacing should remain eligible");
assert.equal(supportSpacingIsSafe([68, 30, 28, 15.4]), false, "a strong missing gap with coherent support should remain detectable");
assert.equal(supportSpacingIsSafe([10, 26, 30, 40]), true, "expanded noise immediately on the expanding side should not manufacture a missing-gap hypothesis");
assert.equal(supportSpacingIsSafe([40, 30, 26, 10]), true, "the expanding-side guard should work in the reverse perspective direction too");
assert.equal(supportSpacingIsSafe([42, 30, 29, 15.4]), true, "distant bounded noise should retain the existing tolerance");

console.log("direction-aware adjacent spacing-noise smoke passed");
