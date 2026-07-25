import fs from "node:fs/promises";

const path = "src/core/maskCandidateAdapter.ts";
let source = await fs.readFile(path, "utf8");

const oldBlock = `const outlineShapeMatched = outlineFillSimilarity >= 0.68 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);
        const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82 && outlineShapeMatched;`;

const newBlock = `const normalizedContourProfile = (candidate: MaskCandidateOutput) => {
          const centerX = candidate.box.x + candidate.box.width / 2;
          const centerY = candidate.box.y + candidate.box.height / 2;
          const halfWidth = Math.max(candidate.box.width / 2, 0.01);
          const halfHeight = Math.max(candidate.box.height / 2, 0.01);
          const normalizedPoints = candidate.points.map((point) => ({
            x: (point.x - centerX) / halfWidth,
            y: (point.y - centerY) / halfHeight,
          }));

          const contourSampleCount = 16;
          return Array.from({ length: contourSampleCount }, (_, index) => {
            const angle = (Math.PI * 2 * index) / contourSampleCount;
            const rayX = Math.cos(angle);
            const rayY = Math.sin(angle);
            let nearest = Number.POSITIVE_INFINITY;

            for (let pointIndex = 0; pointIndex < normalizedPoints.length; pointIndex += 1) {
              const start = normalizedPoints[pointIndex];
              const end = normalizedPoints[(pointIndex + 1) % normalizedPoints.length];
              const segmentX = end.x - start.x;
              const segmentY = end.y - start.y;
              const denominator = rayX * segmentY - rayY * segmentX;
              if (Math.abs(denominator) < 0.000001) continue;

              const rayDistance = (start.x * segmentY - start.y * segmentX) / denominator;
              const segmentFraction = (start.x * rayY - start.y * rayX) / denominator;
              if (rayDistance >= 0 && segmentFraction >= 0 && segmentFraction <= 1) {
                nearest = Math.min(nearest, rayDistance);
              }
            }

            return Number.isFinite(nearest) ? nearest : 0;
          });
        };
        const pairLeftContour = normalizedContourProfile(pairLeft);
        const pairRightContour = normalizedContourProfile(pairRight);
        const contourProfileSimilarity = pairLeftContour.reduce((sum, leftRadius, index) => {
          const rightRadius = pairRightContour[index];
          if (leftRadius <= 0 && rightRadius <= 0) return sum + 1;
          if (leftRadius <= 0 || rightRadius <= 0) return sum;
          return sum + Math.min(leftRadius, rightRadius) / Math.max(leftRadius, rightRadius, 0.01);
        }, 0) / pairLeftContour.length;
        const outlineShapeMatched = outlineFillSimilarity >= 0.68 && contourProfileSimilarity >= 0.82 && (outlineVertexSimilarity >= 0.5 || bothNearRectangular);
        const geometryMatchedPair = widthRatio >= 0.72 && heightRatio >= 0.72 && crossAxisOverlap >= 0.82 && outlineShapeMatched;`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes("const contourSampleCount = 16;")) {
  throw new Error("Unable to locate outline-aware paired-mask guard for sixteen-ray contour-profile patch");
}

await fs.writeFile(path, source);
await import("./smoke-high-resolution-contour-profile-ranking.mjs");
console.log("paired-mask spacing preservation now requires a coherent sixteen-ray normalized contour profile");
