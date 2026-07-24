import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const adapterPath = "src/core/maskCandidateAdapter.ts";
const detectorPath = "src/core/architecturalDetector.ts";
const edgeDetectPath = "src/edgeDetect.ts";
const adapterSource = await fs.readFile(adapterPath, "utf8");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "glowcast-mixed-size-recovery-"));
const sourceRoot = path.join(tempDir, "src");
const coreDir = path.join(sourceRoot, "core");
const outDir = path.join(tempDir, "out");
const sourcePath = path.join(coreDir, "maskCandidateAdapter.ts");

await fs.mkdir(coreDir, { recursive: true });
await fs.writeFile(path.join(tempDir, "package.json"), '{"type":"module"}\n');
await fs.writeFile(sourcePath, adapterSource.replace("function recoverSparseBridgeComponents", "export function recoverSparseBridgeComponents"));
await fs.copyFile(detectorPath, path.join(coreDir, "architecturalDetector.ts"));
await fs.copyFile(edgeDetectPath, path.join(sourceRoot, "edgeDetect.ts"));

execFileSync(process.execPath, [
  "node_modules/typescript/bin/tsc", sourcePath, "--ignoreConfig", "--rootDir", sourceRoot,
  "--outDir", outDir, "--module", "ES2020", "--target", "ES2020",
  "--moduleResolution", "Bundler", "--skipLibCheck"
], { stdio: "inherit" });

const emittedAdapterPath = path.join(outDir, "core", "maskCandidateAdapter.js");
const emittedDetectorPath = path.join(outDir, "core", "architecturalDetector.js");
const emittedAdapter = await fs.readFile(emittedAdapterPath, "utf8");
const emittedDetector = await fs.readFile(emittedDetectorPath, "utf8");
await fs.writeFile(emittedAdapterPath, emittedAdapter.replace(/from\s+["']\.\/architecturalDetector["']/g, 'from "./architecturalDetector.js"'));
await fs.writeFile(emittedDetectorPath, emittedDetector.replace(/from\s+["']\.\.\/edgeDetect["']/g, 'from "../edgeDetect.js"'));

function addClosedFrame(points, x1, y1, x2, y2, strength = 220) {
  for (let x = x1; x <= x2; x += 1) points.push({ x, y: y1, strength }, { x, y: y2, strength });
  for (let y = y1; y <= y2; y += 1) points.push({ x: x1, y, strength }, { x: x2, y, strength });
}

try {
  const { recoverSparseBridgeComponents } = await import(pathToFileURL(emittedAdapterPath).href);
  const bounds = { x: 0, y: 0, width: 120, height: 100 };
  const points = [];

  // Narrow, tall four-sided opening beside two conventional windows.
  addClosedFrame(points, 5, 12, 10, 82);
  addClosedFrame(points, 30, 27, 58, 68);
  addClosedFrame(points, 80, 24, 114, 70);

  // Thin clutter bridges make the three openings one connected fallback component.
  for (let x = 11; x < 30; x += 1) points.push({ x, y: 48, strength: 220 });
  for (let x = 59; x < 80; x += 1) points.push({ x, y: 46, strength: 220 });

  const recovered = recoverSparseBridgeComponents(points, { x: 5, y: 12, width: 109, height: 70 }, bounds);
  if (recovered.length !== 3) {
    throw new Error(`Expected narrow opening plus two larger openings, received ${recovered.length}.`);
  }
  const narrow = recovered.find((candidate) => candidate.width <= 7 && candidate.height >= 60);
  if (!narrow) {
    throw new Error("Mixed-size recovery discarded the legitimate narrow four-sided opening.");
  }

  // A similarly narrow but open three-sided fragment must not gain the exception.
  const noisy = [];
  for (let y = 12; y <= 82; y += 1) noisy.push({ x: 5, y, strength: 220 }, { x: 10, y, strength: 220 });
  for (let x = 5; x <= 10; x += 1) noisy.push({ x, y: 82, strength: 220 });
  addClosedFrame(noisy, 30, 27, 58, 68);
  for (let x = 11; x < 30; x += 1) noisy.push({ x, y: 48, strength: 220 });

  const rejected = recoverSparseBridgeComponents(noisy, { x: 5, y: 12, width: 53, height: 70 }, bounds);
  if (rejected.length) {
    throw new Error("Mixed-size exception preserved an open narrow fragment that should remain rejected.");
  }

  console.log("Mixed-size recovery smoke passed: strongly closed narrow openings survive beside larger openings while open narrow fragments stay rejected.");
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
