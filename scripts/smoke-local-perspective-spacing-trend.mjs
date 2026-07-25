import assert from "node:assert/strict";

function countMissingLikeSteps(normalizedSteps, openingSpans, axisSpan = 1200) {
  const evidence = normalizedSteps.map((normalizedStep, index) => {
    const localOpeningSpan = Math.max(1, (openingSpans[index] + openingSpans[index + 1]) / 2);
    return {
      normalizedStep,
      localOpeningSpan,
      step: normalizedStep * localOpeningSpan,
    };
  });

  const expectedAt = (index) => {
    const previous = evidence[index - 1]?.normalizedStep;
    const next = evidence[index + 1]?.normalizedStep;
    if (previous != null && next != null) {
      return Math.sqrt(Math.max(previous, 0.01) * Math.max(next, 0.01));
    }
    return previous ?? next ?? evidence[index]?.normalizedStep ?? 0;
  };

  return evidence.filter(({ normalizedStep, localOpeningSpan, step }, index) => {
    const localTrendRatio = normalizedStep / Math.max(expectedAt(index), 0.01);
    return localTrendRatio >= 1.65 && localTrendRatio <= 2.75 && step <= Math.min(axisSpan * 0.38, localOpeningSpan * 5.2);
  }).length;
}

assert.equal(
  countMissingLikeSteps([1.15, 1.32, 1.51, 1.73], [112, 92, 75, 61, 50]),
  0,
  "smooth perspective spacing growth must not look like a missing opening",
);

assert.equal(
  countMissingLikeSteps([1.15, 1.38, 1.62, 1.87], [112, 92, 75, 61, 50]),
  0,
  "one naturally wider interval that follows the local trend must remain valid",
);

assert.equal(
  countMissingLikeSteps([1.2, 2.45, 1.55, 1.78], [110, 90, 74, 61, 50]),
  1,
  "one abrupt locally doubled interval should still be recognized as one missing slot",
);

assert.equal(
  countMissingLikeSteps([1.2, 2.4, 1.5, 2.95], [110, 90, 74, 61, 50]),
  2,
  "two abrupt missing-slot intervals must still trigger the multi-gap evidence",
);

console.log("local perspective spacing trend smoke passed");
