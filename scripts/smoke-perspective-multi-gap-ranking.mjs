import assert from "node:assert/strict";

function countMissingLikeSteps(openingSpans, normalizedSteps, axisSpan = 1200) {
  const evidence = normalizedSteps.map((normalizedStep, index) => {
    const localOpeningSpan = (openingSpans[index] + openingSpans[index + 1]) / 2;
    return {
      localOpeningSpan,
      normalizedStep,
      step: normalizedStep * localOpeningSpan,
    };
  });
  const smallestNormalizedSequenceStep = Math.min(...evidence.map(({ normalizedStep }) => normalizedStep));
  return evidence.filter(({ step, localOpeningSpan, normalizedStep }) => {
    const normalizedRatio = normalizedStep / smallestNormalizedSequenceStep;
    return normalizedRatio >= 1.65 && normalizedRatio <= 2.75 && step <= Math.min(axisSpan * 0.38, localOpeningSpan * 5.2);
  }).length;
}

const recedingOpeningSpans = [100, 80, 64, 51];
assert.equal(
  countMissingLikeSteps(recedingOpeningSpans, [1.5, 1.52, 1.48]),
  0,
  "normal perspective compression must not look like missing openings",
);

const twoMissingSlotsSpans = [100, 82, 67, 55, 45];
assert.equal(
  countMissingLikeSteps(twoMissingSlotsSpans, [1.5, 3.0, 1.52, 2.95]),
  2,
  "two locally doubled gaps should still be recognized as two missing-slot bridges",
);

assert.equal(
  countMissingLikeSteps([100, 78, 60, 46], [1.5, 2.25, 1.48]),
  0,
  "one moderately uneven perspective gap must not trigger the multi-gap guard",
);

console.log("perspective-aware multi-gap ranking smoke passed");
