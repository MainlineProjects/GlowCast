import fs from "node:fs/promises";

const path = "src/App.tsx";
let source = await fs.readFile(path, "utf8");

const semanticSummary = 'Automatic detection: {detectionDebug.candidateMasks} masks · {detectionDebug.source}{detectionDebug.semanticWarnings ? ` · ${detectionDebug.semanticWarnings} warning${detectionDebug.semanticWarnings === 1 ? "" : "s"}` : ""}';
const friendlySemanticSummary = 'Automatic detection: {detectionDebug.candidateMasks} architectural mask{detectionDebug.candidateMasks === 1 ? "" : "s"} · semantic object proposals + boundary refinement{detectionDebug.semanticWarnings ? ` · ${detectionDebug.semanticWarnings} warning${detectionDebug.semanticWarnings === 1 ? "" : "s"}` : ""}';
const oldSummary = 'Debug: {detectionDebug.edgePoints.toLocaleString()} edges · {detectionDebug.candidateMasks} masks · {detectionDebug.polygonScoped ? "surface polygon scoped" : "full surface bounds"} · {detectionDebug.source}{detectionDebug.detectorDiagnostics ? ` · components ${detectionDebug.detectorDiagnostics.components} · rejected: closure ${detectionDebug.detectorDiagnostics.rejectedClosure}, size ${detectionDebug.detectorDiagnostics.rejectedSize}, aspect ${detectionDebug.detectorDiagnostics.rejectedAspect}, confidence ${detectionDebug.detectorDiagnostics.rejectedConfidence} · boundary penalties ${detectionDebug.detectorDiagnostics.boundaryPenalized}` : ""}';
const oldFriendlySummary = 'Detection summary: {detectionDebug.edgePoints.toLocaleString()} edges analyzed · {detectionDebug.candidateMasks} usable mask{detectionDebug.candidateMasks === 1 ? "" : "s"} created · {detectionDebug.polygonScoped ? "limited to your projection surface" : "scanned across the full surface"}';

if (source.includes(friendlySemanticSummary)) {
  console.log("Friendly semantic detection summary already present.");
} else if (source.includes(semanticSummary)) {
  source = source.replace(semanticSummary, friendlySemanticSummary);
  await fs.writeFile(path, source);
  console.log("Replaced semantic detector status with a user-friendly summary.");
} else if (source.includes(oldFriendlySummary)) {
  console.log("Legacy friendly detection summary already present.");
} else if (source.includes(oldSummary)) {
  source = source.replace(oldSummary, oldFriendlySummary);
  await fs.writeFile(path, source);
  console.log("Replaced technical detector debug text with a user-friendly summary.");
} else {
  throw new Error("Detector summary anchor not found.");
}
