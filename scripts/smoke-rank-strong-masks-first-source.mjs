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
await import("./patch-adapter-multiple-missing-opening-guard-v1.mjs");
await import("./patch-adapter-perspective-multi-gap-guard-v1.mjs");
await import("./patch-adapter-local-spacing-trend-guard-v1.mjs");
await import("./patch-adapter-spacing-direction-break-guard-v1.mjs");
await import("./patch-adapter-local-spacing-outlier-guard-v1.mjs");
await import("./patch-adapter-local-narrow-spacing-outlier-guard-v1.mjs");
await import("./patch-adapter-geometry-aware-paired-spacing-v1.mjs");
await import("./patch-adapter-outline-aware-paired-spacing-v1.mjs");

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
  "const missingScaleConsistency = Math.min(",
  "const perspectiveMissingScaleCandidate = missingScaleConsistency <= 0.34;",
  "if (scaleConsistency > 0.28 && !perspectiveMissingScaleCandidate) return 0;",
  "const spacingProgresses = shrinkingForward ? gaps[1] <= gaps[0] * 1.25 + 1 : gaps[0] <= gaps[1] * 1.25 + 1;",
  "const regularSpacingProgression = scaleConsistency <= 0.28 && spacingProgresses;",
  "const missingOpeningStepRatio = largerCenterStep / smallerCenterStep;",
  "(scaleConsistency <= 0.28 || perspectiveMissingScaleCandidate) &&",
  "missingOpeningStepRatio >= 1.45 &&",
  "missingOpeningStepRatio <= 2.75 &&",
  "largerCenterStep <= Math.min(axisSpan * 0.38, openingSpanReference * 5.2);",
  "return regularSpacingProgression || missingOpeningBridge ? 1 : 0;",
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
  "const sequenceMembers = [candidate, ...alignedNeighbors];",
  "const sequenceStepEvidence = orderedSequence.slice(1).map((member, index) => {",
  "const localOpeningSpan = Math.max(1, (previousOpeningSpan + memberOpeningSpan) / 2);",
  "normalizedStep: step / localOpeningSpan",
  "const expectedNormalizedStepAt = (index: number) => {",
  "return Math.sqrt(Math.max(previous, 0.01) * Math.max(next, 0.01));",
  "const expectedNormalizedStep = expectedNormalizedStepAt(index);",
  "const localTrendRatio = normalizedStep / Math.max(expectedNormalizedStep, 0.01);",
  "localTrendRatio >= 1.65 && localTrendRatio <= 2.75",
  "step <= Math.min(sequenceAxisSpan * 0.38, localOpeningSpan * 5.2)",
  "const multipleMissingOpeningBridges = alignedNeighbors.length >= 3 && missingLikeStepCount >= 2;",
  "const hasAbruptSpacingDirectionBreak = (steps: number[]) => {",
  "const abruptSpacingDirectionBreak = alignedNeighbors.length >= 3 && hasAbruptSpacingDirectionBreak(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));",
  "Math.abs(current) >= priorTurn * 1.8",
  "const hasLocalizedSpacingOutlier = (steps: number[]) => steps.some((current, index) => {",
  "const localRatio = current / Math.max(expected, 0.01);",
  "localRatio >= 1.24 && localRatio < 1.65",
  "const localizedSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));",
  "const hasLocalizedNarrowSpacingOutlier = (steps: number[]) => steps.some((current, index) => {",
  "const pairLeft = orderedSequence[index];",
  "const pairRight = orderedSequence[index + 1];",
  "const outlineFillSimilarity = Math.min(pairLeftFill, pairRightFill) / Math.max(pairLeftFill, pairRightFill, 0.01);",
  "const outlineVertexSimilarity = Math.min(pairLeft.points.length, pairRight.points.length) / Math.max(pairLeft.points.length, pairRight.points.length, 1);",
  "const outlineShapeMatched = outlineFillSimilarity >= 0.68 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);",
  "const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82 && outlineShapeMatched;",
  "const likelyPairedAssembly = localRatio < 0.5 && geometryMatchedPair;",
  "const suspiciousTightCluster = localRatio >= 0.3 && localRatio < 0.5 && !likelyPairedAssembly;",
  "((localRatio >= 0.56 && localRatio <= 0.76) || suspiciousTightCluster)",
  "const localizedNarrowSpacingOutlier = alignedNeighbors.length >= 3 && hasLocalizedNarrowSpacingOutlier(sequenceStepEvidence.map(({ normalizedStep }) => normalizedStep));",
  "const repeatedRowOutlier = obviousRepeatedRowOutlier || obviousRepeatedRowPositionOutlier || obviousRepeatedRowRotationOutlier || multipleMissingOpeningBridges || abruptSpacingDirectionBreak || localizedSpacingOutlier || localizedNarrowSpacingOutlier;",
  "const groupScore = credibleGroupMember ? Math.min(1, consistentNeighborCount / 2) * (repeatedRowOutlier ? 0.35 : 1) : 0;",
  "groupScore * 0.06 + progressionScore * 0.03"
];

const missing = required.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  throw new Error(`Strongest-first mask ranking smoke failed; missing: ${missing.join(", ")}`);
}

await import("./smoke-perspective-multi-gap-ranking.mjs");
await import("./smoke-local-perspective-spacing-trend.mjs");
await import("./smoke-spacing-direction-break-ranking.mjs");
await import("./smoke-local-spacing-outlier-ranking.mjs");
await import("./smoke-local-narrow-spacing-outlier-ranking.mjs");
await import("./smoke-geometry-aware-paired-spacing-ranking.mjs");
await import("./smoke-outline-aware-paired-spacing-ranking.mjs");
await import("./smoke-aligned-group-ranking-source.mjs");
console.log("strongest-first automatic mask ranking source smoke passed with outline-aware paired spacing and full-row progression protections");
