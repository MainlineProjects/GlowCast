import assert from "node:assert/strict";

function hasAbruptSpacingDirectionBreak(steps) {
  const inspect = (orderedSteps) => {
    const deltas = orderedSteps.slice(1).map((step, index) => Math.log(Math.max(step, 0.01) / Math.max(orderedSteps[index], 0.01)));
    return deltas.some((current, index) => {
      if (index < 2) return false;
      const previousOne = deltas[index - 1];
      const previousTwo = deltas[index - 2];
      const previousDirection = Math.sign(previousOne);
      const sustainedDirection = previousDirection !== 0 && Math.sign(previousTwo) === previousDirection && Math.abs(previousOne) >= 0.035 && Math.abs(previousTwo) >= 0.035;
      const abruptReversal = Math.sign(current) === -previousDirection && Math.abs(current) >= 0.2;
      const priorTurn = Math.max(Math.abs(previousOne), Math.abs(previousTwo));
      return sustainedDirection && abruptReversal && Math.abs(current) >= priorTurn * 1.8;
    });
  };
  return inspect(steps) || inspect([...steps].reverse());
}

assert.equal(
  hasAbruptSpacingDirectionBreak([1.68, 1.5, 1.34, 1.95]),
  true,
  "a sudden widening after sustained perspective compression should be treated as an outlier",
);

assert.equal(
  hasAbruptSpacingDirectionBreak([1.95, 1.34, 1.5, 1.68]),
  true,
  "the guard should catch the same abrupt break regardless of row direction",
);

assert.equal(
  hasAbruptSpacingDirectionBreak([1.68, 1.5, 1.34, 1.28, 1.31]),
  false,
  "gentle curvature that slightly reverses the spacing trend must remain valid",
);

assert.equal(
  hasAbruptSpacingDirectionBreak([1.12, 1.2, 1.3, 1.43, 1.58]),
  false,
  "smoothly expanding perspective spacing must remain valid",
);

assert.equal(
  hasAbruptSpacingDirectionBreak([1.82, 1.59, 1.39, 1.22, 1.08]),
  false,
  "smoothly compressing perspective spacing must remain valid",
);

console.log("spacing direction-break ranking smoke passed");
