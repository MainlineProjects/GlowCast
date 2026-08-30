import fs from "node:fs/promises";

const sourcePrep = await fs.readFile("scripts/source-prep.mjs", "utf8");
const patch = await fs.readFile("scripts/patch-ui-auto-detect-masks-v1.mjs", "utf8");
const friendlySummaryPatch = await fs.readFile("scripts/patch-ui-friendly-detection-summary-v1.mjs", "utf8");
const app = await fs.readFile("src/App.tsx", "utf8");
const detection = await fs.readFile("src/detection.ts", "utf8");
const cvCore = await fs.readFile("functions/api/cv-core.ts", "utf8");
const viteConfig = await fs.readFile("vite.config.ts", "utf8");
const indexHtml = await fs.readFile("index.html", "utf8");

function requireText(name, source, text) {
  if (!source.includes(text)) {
    console.error(`UI auto-detect wiring smoke failed: missing ${name}.`);
    process.exit(1);
  }
}

function rejectText(name, source, text) {
  if (source.includes(text)) {
    console.error(`UI auto-detect wiring smoke failed: unexpected ${name}.`);
    process.exit(1);
  }
}

requireText("source-prep resilient runner", sourcePrep, "async function runPatch(path, { required = false } = {})");
requireText("required auto-detect prep", sourcePrep, 'patch-ui-auto-detect-masks-v1.mjs", { required: true }');
requireText("React Vite plugin", viteConfig, "react()");
requireText("Cloudflare build SHA input", viteConfig, "CF_PAGES_COMMIT_SHA");
rejectText("developer-only build badge", indexHtml, "glowcast-build-stamp");

requireText("prepared semantic automatic function", app, "async function runAutomaticSemanticDetection(sourceUrl: string)");
requireText("prepared upload automatic call", app, "void runAutomaticSemanticDetection(src)");
requireText("prepared recent-photo automatic call", app, "void runAutomaticSemanticDetection(photo.imageUrl)");
requireText("prepared semantic API call", app, "detectSurfaceAndMasks(sourceUrl)");
requireText("prepared compatible auto detect button", app, "Auto Detect Masks");
requireText("prepared semantic button handler", app, "onClick={runLocalAutoMaskDetection}");
requireText("prepared automatic status", app, 'data-testid="automatic-detection-status"');
requireText("prepared conservative zero-result copy", app, "did not promote wall texture or edge density into masks");
requireText("prepared semantic feature label summary", app, 'replace("Auto architectural mask · ", "")');
rejectText("edge-only candidate promotion in automatic function", app.slice(app.indexOf("async function runAutomaticSemanticDetection"), app.indexOf("function resetForPhoto")), "runCandidateDetection(");

requireText("semantic backend request", detection, 'fetch("/api/analyze-projection"');
requireText("architectural semantic prompt", cvCore, "garage opening");
requireText("texture rejection vocabulary", cvCore, '"brick","mortar","siding"');
requireText("foliage rejection vocabulary", cvCore, '"foliage","tree","bush","plant"');
rejectText("plant detector target", cvCore.split("export const DETECTOR_PROMPT=")[1].split(";")[0], "plant");

requireText("semantic function patch", patch, "runAutomaticSemanticDetection(sourceUrl: string)");
requireText("automatic upload patch", patch, "void runAutomaticSemanticDetection(src)");
requireText("no texture promotion patch copy", patch, "No edge-only masks were created");
requireText("friendly summary includes semantic labels", friendlySummaryPatch, 'replace("Auto architectural mask · ", "")');
requireText("friendly summary includes conservative zero label", friendlySummaryPatch, "no confident architectural objects");

console.log("UI auto-detect wiring smoke passed: prepared app is automatic-first, semantic-first, names detected architectural features, and refuses texture-only edge promotion.");
