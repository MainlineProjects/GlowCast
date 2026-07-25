import assert from "node:assert/strict";

function hasLocalizedNarrowSpacingOutlier(steps) {
  return steps.some((current, index) => {
    if (index === 0 || index === steps.length - 1) return false;
    const previous = Math.max(steps[index - 1], 0.01);
    const next = Math.max(steps[index + 1], 0.01);
    const expected = Math.sqrt(previous * next);
    const localRatio = current / Math.max(expected, 0.01);
    const visiblyNarrowerThanNeighbors = current <= Math.min(previous, next) * 0.82;
    const likelyPairedAssembly = localRatio < 0.5;
    return visiblyNarrowerThanNeighbors && localRatio >= 0.56 && localRatio <= 0.76 && !likelyPairedAssembly;
  });
}

assert.equal(
  hasLocalizedNarrowSpacingOutlier([1.7, 1.05, 1.55, 1.35]),
  true,
  "one moderately compressed interval inside a repeated row should be treated as a local spacing outlier",
);

assert.equal(
  hasLocalizedNarrowSpacingOutlier([1.82, 1.63, 1.47, 1.34, 1.23]),
  false,
  "smooth perspective compression must remain valid",
);

assert.equal(
  hasLocalizedNarrowSpacingOutlier([1.28, 1.38, 1.5, 1.61]),
  false,
  "smooth expansion must remain valid",
);

assert.equal(
  hasLocalizedNarrowSpacingOutlier([1.7, 0.72, 1.6]),
  false,
  "very tight paired-window or mullion-like spacing should remain reviewable rather than being treated as a stray clustered fragment",
);

assert.equal(
  hasLocalizedNarrowSpacingOutlier([1.62, 1.26, 1.48, 1.33]),
  false,
  "small natural spacing variation must not be penalized",
);

console.log("localized narrow-spacing outlier ranking smoke passed");
