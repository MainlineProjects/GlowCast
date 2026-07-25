import assert from "node:assert/strict";

function hasLocalizedSpacingOutlier(steps) {
  return steps.some((current, index) => {
    if (index === 0 || index === steps.length - 1) return false;
    const previous = Math.max(steps[index - 1], 0.01);
    const next = Math.max(steps[index + 1], 0.01);
    const expected = Math.sqrt(previous * next);
    const localRatio = current / Math.max(expected, 0.01);
    const visiblyWiderThanNeighbors = current >= Math.max(previous, next) * 1.08;
    return visiblyWiderThanNeighbors && localRatio >= 1.24 && localRatio < 1.65;
  });
}

assert.equal(
  hasLocalizedSpacingOutlier([1.78, 1.52, 1.76, 1.31]),
  true,
  "one moderately oversized interval inside a compressing row should be treated as a local outlier",
);

assert.equal(
  hasLocalizedSpacingOutlier([1.82, 1.63, 1.47, 1.34, 1.23]),
  false,
  "smooth perspective compression must remain valid",
);

assert.equal(
  hasLocalizedSpacingOutlier([1.2, 1.29, 1.39, 1.5, 1.62]),
  false,
  "smooth perspective expansion must remain valid",
);

assert.equal(
  hasLocalizedSpacingOutlier([1.65, 1.48, 1.55, 1.37, 1.26]),
  false,
  "small natural spacing curvature must not be penalized",
);

assert.equal(
  hasLocalizedSpacingOutlier([1.72, 2.9, 1.38]),
  false,
  "a missing-opening-sized gap remains the responsibility of the existing missing-slot guard",
);

console.log("localized spacing-outlier ranking smoke passed");
