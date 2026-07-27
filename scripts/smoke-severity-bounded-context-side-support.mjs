import assert from "node:assert/strict";

const residualLimit = Math.log(1.10);

function contextMeanResidual(residuals) {
  const sorted = [...residuals].sort((a, b) => a - b);
  if (sorted.length < 4) {
    return sorted.reduce((sum, residual) => sum + residual, 0) / Math.max(sorted.length, 1);
  }

  const secondWorst = sorted[sorted.length - 2];
  const worst = sorted[sorted.length - 1];
  const worstSeverity = Math.max(0, Math.min(1, worst / residualLimit));
  const contextResidualSeverityBlend = Math.max(0, Math.min(1, (worstSeverity - 0.35) / 0.65));
  const contextResidualCap = secondWorst + (worst - secondWorst) * contextResidualSeverityBlend;
  return sorted.reduce((sum, residual) => sum + Math.min(residual, contextResidualCap), 0) / sorted.length;
}

const clean = [0.010, 0.011, 0.012, 0.013];
const mildSecondary = [0.010, 0.011, 0.012, 0.035];
const severeSecondary = [0.010, 0.011, 0.012, 0.090];
const twoSevere = [0.010, 0.011, 0.082, 0.090];

const cleanMean = contextMeanResidual(clean);
const mildMean = contextMeanResidual(mildSecondary);
const severeMean = contextMeanResidual(severeSecondary);
const twoSevereMean = contextMeanResidual(twoSevere);

assert.ok(mildMean - cleanMean < 0.004,
  "one mild secondary residual should remain strongly capped as detector noise");
assert.ok(severeMean > mildMean + 0.010,
  "an extreme secondary residual must retain materially more context influence than mild noise");
assert.ok(twoSevereMean > severeMean + 0.010,
  "two severe context residuals must remain unmistakably noisier than one isolated severe residual");

const shortSevere = contextMeanResidual([0.010, 0.011, 0.090]);
assert.ok(shortSevere > severeMean,
  "short context must not gain the robust capping benefit reserved for broader architectural support");

console.log("severity-bounded context side-support smoke passed");
