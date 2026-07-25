import fs from "node:fs/promises";

await import("./patch-adapter-fair-slender-mask-ranking-v1.mjs");
await import("./patch-adapter-size-aware-mixed-mask-ranking-v1.mjs");
await import("./patch-adapter-aligned-group-ranking-v1.mjs");
await import("./patch-adapter-perspective-progression-ranking-v1.mjs");
await import("./patch-adapter-progression-outlier-guard-v1.mjs");
await import("./patch-adapter-positional-outlier-guard-v1.mjs");
await import("./patch-adapter-rotation-outlier-guard-v1.mjs");
await import("./patch-adapter-orientation-progression-guard-v1.mjs");
await import("./patch-adapter-long-orientation-progression-guard-v1.mjs");
await import("./patch-adapter-single-missing-opening-progression-v1.mjs");

const source = await fs.readFile("src/core/maskCandidateAdapter.ts", "utf8");

const required = [
  "function polygonArea(",
  "function rankArchitecturalMasks(",
  "const slenderArchitectural = (aspect >= 0.08 && aspect < 0.28) || (aspect > 3.8 && aspect <= 8);",
  "const sizeTarget = slenderArchitectural ? 0.03 : 0.045;",
  "const sizeScore = Math.min(1, areaRatio / sizeTarget);",
  "const fillRatio = Math.min(1, polygonArea(candidate.points) / boxArea);",
  "return rankArchitecturalMasks(suppressIsolatedMaskSpecks(",
  "aspect >= 0.08 && aspect <= 8 ? 0.62 : 0.1",
  "const credibleGroupMember = fillRatio >= 0.35 && areaRatio >= 0.003 && candidate.points.length <= 14 && aspect >= 0.08 && aspect <= 8;",
  "const alignedNeighbors = candidates.filter((other) => {",
  "const perspectiveScaleMatch = widthRatio >= 0.48 && heightRatio >= 0.48 && Math.abs(Math.log(widthScale) - Math.log(heightScale)) <= 0.22;",
  "const dimensionallyConsistent = strictDimensionMatch || perspectiveScaleMatch;",
  "const rowSpacingReference = perspectiveScaleMatch ? Math.min(candidate.box.width, other.box.width) : Math.max(candidate.box.width, other.box.width);",
  "const columnSpacingReference = perspectiveScaleMatch ? Math.min(candidate.box.height, other.box.height) : Math.max(candidate.box.height, other.box.height);",
  "const consistentNeighborCount = alignedNeighbors.length;",
  "const progressionScore = alignedNeighbors.length >= 2",
  "const scaleConsistency = Math.abs(Math.log(Math.max(scaleOne, 0.01)) - Math.log(Math.max(scaleTwo, 0.01)));",
  "const spacingProgresses = shrinkingForward ? gaps[1] <= gaps[0] * 1.25 + 1 : gaps[0] <= gaps[1] * 1.25 + 1;",
  "const missingOpeningStepRatio = largerCenterStep / smallerCenterStep;",
  "missingOpeningStepRatio >= 1.45 &&",
  "missingOpeningStepRatio <= 2.75 &&",
  "largerCenterStep <= Math.min(axisSpan * 0.38, openingSpanReference * 5.2);",
  "return spacingProgresses || missingOpeningBridge ? 1 : 0;",
  "const obviousRepeatedRowOutlier = alignedNeighbors.length >= 2 && progressionScore === 0 && (sizeVsNeighbor < 0.42 || sizeVsNeighbor > 2.4);",
  "const tightNeighborRow = neighborRowSpread <= Math.max(bounds.height * 0.025, neighborHeightMedian * 0.18);",
  "const tightNeighborColumn = neighborColumnSpread <= Math.max(bounds.width * 0.025, neighborWidthMedian * 0.18);",
  "const obviousRepeatedRowPositionOutlier = alignedNeighbors.length >= 2 && progressionScore === 0",
  "const dominantEdgeAngle = (points: Array<{ x: number; y: number }>) => {",
  "const neighborOrientationStrength = neighborAngles.length",
  "const angleDistance = (left: number, right: number) => {",
  "const orderedOrientationSequence = [candidate, ...alignedNeighbors]",
  "const signedAngleDelta = (left: number, right: number) => {",
  "const turnSteps = angles.slice(1).map((angle, index) => signedAngleDelta(angles[index], angle));",
  "const consistentDirection = nonTrivialTurns.length < 2 || nonTrivialTurns.every((step) => Math.sign(step) === Math.sign(nonTrivialTurns[0]));",
  "const smoothTurnRate = turnSpread <= Math.PI / 45;",
  "const obviousRepeatedRowRotationOutlier = alignedNeighbors.length >= 2 && orientationProgressionScore === 0 && neighborOrientationStrength >= 0.92 && rotationDelta > Math.PI / 13;",
  "const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier;",
  "const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;",
  "groupScore * 0.06 + progressionScore * 0.03"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Strongest-first mask ranking smoke failed; missing: ${missing.join(", ")}`);
}

await import("./smoke-aligned-group-ranking-source.mjs");
console.log("strongest-first automatic mask ranking source smoke passed with bounded missing-opening progression support and full-row orientation guards");
