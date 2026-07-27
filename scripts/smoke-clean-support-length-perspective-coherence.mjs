import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function effectiveCleanSupportDistance(samples, trimmedSupportIndex = -1) {
  const retained = samples.filter((_, index) => index !== trimmedSupportIndex);
  const maxSupportDistance = Math.max(2, ...retained.map((sample) => sample.distance));
  const firstCoherenceBreakDistance = Math.min(
    ...retained
      .filter((sample) => sample.residual > residualLimit)
      .map((sample) => sample.distance),
    Number.POSITIVE_INFINITY,
  );

  return Number.isFinite(firstCoherenceBreakDistance)
    ? Math.max(2, Math.min(maxSupportDistance, firstCoherenceBreakDistance - 1))
    : maxSupportDistance;
}

function localityDecay(samples, trimmedSupportIndex = -1) {
  return 0.80 * Math.sqrt(2 / effectiveCleanSupportDistance(samples, trimmedSupportIndex));
}

const cleanLongFacade = [
  { distance: 1, residual: 0.01 },
  { distance: 2, residual: 0.02 },
  { distance: 3, residual: 0.02 },
  { distance: 4, residual: 0.03 },
  { distance: 5, residual: 0.02 },
  { distance: 6, residual: 0.03 },
];
assert.equal(effectiveCleanSupportDistance(cleanLongFacade), 6,
  "a continuous clean long facade should retain its full support length");

const facadeWithInternalBreak = [
  { distance: 1, residual: 0.01 },
  { distance: 2, residual: 0.02 },
  { distance: 3, residual: Math.log(1.24) },
  { distance: 4, residual: 0.02 },
  { distance: 5, residual: 0.02 },
  { distance: 6, residual: 0.03 },
];
assert.equal(effectiveCleanSupportDistance(facadeWithInternalBreak), 2,
  "a large internal spacing break should stop distant masks from inflating effective facade length");
assert.ok(localityDecay(facadeWithInternalBreak) > localityDecay(cleanLongFacade),
  "a broken facade should keep stronger local falloff than a genuinely continuous long row");

const facadeWithTrimmedDistantOutlier = [
  { distance: 1, residual: 0.01 },
  { distance: 2, residual: 0.02 },
  { distance: 3, residual: 0.02 },
  { distance: 4, residual: 0.03 },
  { distance: 5, residual: Math.log(1.30) },
  { distance: 6, residual: 0.02 },
];
assert.equal(effectiveCleanSupportDistance(facadeWithTrimmedDistantOutlier, 4), 6,
  "the already-trimmed single distant outlier should not shorten otherwise continuous support");

const nearBreak = [
  { distance: 1, residual: Math.log(1.20) },
  { distance: 2, residual: 0.01 },
  { distance: 3, residual: 0.01 },
  { distance: 4, residual: 0.01 },
];
assert.equal(effectiveCleanSupportDistance(nearBreak), 2,
  "effective support should never fall below the established short-facade floor");

console.log("clean-support-length perspective coherence smoke passed");
