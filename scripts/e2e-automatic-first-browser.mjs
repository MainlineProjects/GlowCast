import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const outDir = "browser-evidence";
mkdirSync(outDir, { recursive: true });

const facade = `${outDir}/automatic-first-facade.svg`;
writeFileSync(facade, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#d9d2c3"/><rect x="120" y="180" width="300" height="260" fill="#23374d" stroke="#fff" stroke-width="18"/><rect x="760" y="180" width="220" height="430" fill="#382b24" stroke="#fff" stroke-width="18"/><path d="M0 610H1200" stroke="#8b8174" stroke-width="12"/></svg>`);
const textureOnly = `${outDir}/texture-only.svg`;
writeFileSync(textureOnly, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#a65f43"/>${Array.from({length:18},(_,row)=>Array.from({length:18},(_,col)=>`<rect x="${col*72-(row%2)*36}" y="${row*44}" width="68" height="40" fill="none" stroke="#d9aa91" stroke-width="3"/>`).join("")).join("")}</svg>`);

const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4173"], { stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", chunk => { serverLog += String(chunk); });
server.stderr.on("data", chunk => { serverLog += String(chunk); });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch("http://127.0.0.1:4173/");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Vite server did not become ready.\n${serverLog}`);
}

const semanticResponse = {
  surface: { polygon: [{x:.05,y:.08},{x:.96,y:.08},{x:.96,y:.88},{x:.05,y:.88}] },
  masks: [
    { label: "window", confidence: .94, polygon: [{x:.10,y:.20},{x:.38,y:.20},{x:.38,y:.55},{x:.10,y:.55}] },
    { label: "door", confidence: .93, polygon: [{x:.63,y:.20},{x:.83,y:.20},{x:.83,y:.78},{x:.63,y:.78}] }
  ],
  debug: { warnings: [] }
};
const textureResponse = {
  surface: { polygon: [{x:.05,y:.08},{x:.96,y:.08},{x:.96,y:.88},{x:.05,y:.88}] },
  masks: [],
  debug: { warnings: ["Semantic detector returned zero usable architectural objects; no edge-only masks were invented."] }
};

async function assertDesktopReviewComposition(page, expectedMasks) {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width <= 960) return;
  const stage = page.locator(".stage").first();
  const photo = page.locator(".surfaceLayer img.referencePhoto").first();
  const stageBox = await stage.boundingBox();
  const photoBox = await photo.boundingBox();
  if (!stageBox || !photoBox) throw new Error("Desktop automatic-review stage or photo is missing");
  if (stageBox.y < 0 || stageBox.y >= viewport.height - 100 || photoBox.y < 0 || photoBox.y >= viewport.height - 100) {
    throw new Error(`Automatic review photo is outside the initial desktop viewport: stage=${JSON.stringify(stageBox)} photo=${JSON.stringify(photoBox)} viewport=${JSON.stringify(viewport)}`);
  }
  if (photoBox.width < 420 || photoBox.height < 260) {
    throw new Error(`Automatic review photo is too small for immediate desktop review: ${JSON.stringify(photoBox)}`);
  }
  const visibleMaskCount = await page.locator(".surfaceLayer .zone").evaluateAll((nodes, viewportHeight) => nodes.filter((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8 && rect.top < viewportHeight && rect.bottom > 0;
  }).length, viewport.height);
  if (visibleMaskCount !== expectedMasks) {
    throw new Error(`Initial desktop viewport expected ${expectedMasks} visible automatic masks, found ${visibleMaskCount}`);
  }
}

async function assertAutomaticFirstCleanupHierarchy(page) {
  const autoButton = page.getByTestId("automatic-detect-action");
  const advanced = page.locator("details.advancedCleanup").first();
  const summary = advanced.locator("summary");
  const edgeButton = page.getByRole("button", { name: /Show Edge Scanner/i });
  const autoBox = await autoButton.boundingBox();
  const advancedBox = await advanced.boundingBox();
  if (!autoBox || !advancedBox || autoBox.y >= advancedBox.y) {
    throw new Error(`Automatic detection must lead collapsed manual cleanup: auto=${JSON.stringify(autoBox)} advanced=${JSON.stringify(advancedBox)}`);
  }
  if (await advanced.getAttribute("open") !== null) throw new Error("Advanced manual cleanup must start collapsed");
  if (await edgeButton.isVisible()) throw new Error("Edge scanner is visible before advanced manual cleanup is opened");
  await summary.click();
  if (!(await edgeButton.isVisible())) throw new Error("Edge scanner is unavailable after opening advanced manual cleanup");
  await summary.click();
  if (await edgeButton.isVisible()) throw new Error("Advanced manual cleanup did not collapse after verification");
}

async function assertNoPrimaryEdgeDebug(page) {
  const visibleDebugPanels = await page.locator(".edgeDebugPanel").evaluateAll((nodes) => nodes.filter((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }).length);
  if (visibleDebugPanels) throw new Error(`Legacy Edge Debug diagnostics are exposed in normal automatic review: ${visibleDebugPanels} panel(s)`);
  const bodyText = (await page.locator("body").textContent()) ?? "";
  if (/edge debug/i.test(bodyText)) throw new Error("Legacy Edge Debug copy is exposed in normal automatic review");
}

async function captureEditorProof(page, name, expectedMasks) {
  const surface = page.locator(".surfaceLayer").first();
  const photo = surface.locator("img.referencePhoto");
  await surface.scrollIntoViewIfNeeded();
  await surface.waitFor({ state: "visible" });
  await photo.waitFor({ state: "visible" });
  const photoBox = await photo.boundingBox();
  if (!photoBox || photoBox.width < 180 || photoBox.height < 120) {
    throw new Error(`Reference photo is not visibly reviewable: ${JSON.stringify(photoBox)}`);
  }
  const maskCount = await surface.locator(".zone").count();
  if (maskCount !== expectedMasks) throw new Error(`Focused editor expected ${expectedMasks} masks, found ${maskCount}`);
  if (expectedMasks > 0) {
    const visibleMasks = await surface.locator(".zone").evaluateAll((nodes) => nodes.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 8 && rect.height > 8;
    }).length);
    if (visibleMasks !== expectedMasks) throw new Error(`Expected ${expectedMasks} visibly rendered masks, found ${visibleMasks}`);
  }
  await surface.screenshot({ path: `${outDir}/${name}-editor.png`, timeout: 12000 });
}

async function assertSemanticMaskBadges(page) {
  const labels = (await page.locator(".surfaceLayer .zone span").allTextContents())
    .map(text => text.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!labels.some(label => label === "WINDOW 1")) {
    throw new Error(`Window mask is not visibly identified by semantic feature name: ${JSON.stringify(labels)}`);
  }
  if (!labels.some(label => label === "DOOR 2")) {
    throw new Error(`Door mask is not visibly identified by semantic feature name: ${JSON.stringify(labels)}`);
  }
}

async function assertAutomaticCompletionCopy(page) {
  const status = page.getByTestId("automatic-detection-status");
  const statusText = await status.textContent();
  if (!statusText?.includes("Automatic analysis complete:")) {
    throw new Error(`Automatic completion state is unclear: ${statusText}`);
  }
  const action = page.getByTestId("automatic-detect-action");
  const actionText = (await action.textContent())?.replace(/\s+/g, " ").trim();
  if (!actionText?.includes("Re-run Automatic Detection")) {
    throw new Error(`Completed automatic analysis still looks like an initial manual action: ${actionText}`);
  }
}

async function exercise(viewport, evidenceName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(12000);
  let response = semanticResponse;
  await page.route("**/api/analyze-projection", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
  });

  try {
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded", timeout: 12000 });
    let upload = page.locator('input[type="file"][accept="image/*"]').first();
    await upload.waitFor({ state: "attached" });
    await upload.setInputFiles(facade);

    const status = page.getByTestId("automatic-detection-status");
    await status.waitFor({ state: "visible" });
    const statusText = await status.textContent();
    if (!statusText?.includes("2 architectural masks") || !statusText.includes("semantic object proposals + boundary refinement")) {
      throw new Error(`Automatic semantic status was not visible: ${statusText}`);
    }
    await assertAutomaticCompletionCopy(page);
    const semanticMaskCount = await page.locator(".zone").count();
    if (semanticMaskCount !== 2) throw new Error(`Expected exactly two rendered semantic masks, found ${semanticMaskCount}`);
    const maskSummary = await page.locator("body").textContent();
    if (!maskSummary?.includes("2 of 2 auto enabled") || !maskSummary.includes("0 manual")) {
      throw new Error(`Semantic detections are not identified as automatic masks in review UI: ${maskSummary?.match(/\([^)]*auto enabled[^)]*\)/)?.[0] ?? "status missing"}`);
    }
    if (!maskSummary.includes("Detected Features")) throw new Error("Automatic results panel is still labeled as manual avoid-mask workflow");
    await assertSemanticMaskBadges(page);
    await assertAutomaticFirstCleanupHierarchy(page);
    await assertNoPrimaryEdgeDebug(page);
    await assertDesktopReviewComposition(page, 2);
    await page.screenshot({ path: `${outDir}/${evidenceName}-semantic.png`, fullPage: false, timeout: 12000 });
    await captureEditorProof(page, `${evidenceName}-semantic`, 2);

    response = textureResponse;
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded", timeout: 12000 });
    upload = page.locator('input[type="file"][accept="image/*"]').first();
    await upload.waitFor({ state: "attached" });
    await upload.setInputFiles(textureOnly);
    await page.waitForFunction(() => document.body.textContent?.includes("did not promote wall texture or edge density into masks"), null, { timeout: 12000 });
    const textureMaskCount = await page.locator(".zone").count();
    if (textureMaskCount !== 0) throw new Error(`Texture-only facade created ${textureMaskCount} masks`);
    await assertAutomaticCompletionCopy(page);
    await assertAutomaticFirstCleanupHierarchy(page);
    await assertNoPrimaryEdgeDebug(page);
    await assertDesktopReviewComposition(page, 0);
    await page.screenshot({ path: `${outDir}/${evidenceName}-texture-rejection.png`, fullPage: false, timeout: 12000 });
    await captureEditorProof(page, `${evidenceName}-texture-rejection`, 0);

    return { evidenceName, semanticMasks: semanticMaskCount, textureMasks: textureMaskCount };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

try {
  await waitForServer();
  const desktop = await exercise({ width: 1440, height: 1000 }, "desktop");
  const mobile = await exercise({ width: 390, height: 844 }, "mobile");
  writeFileSync(`${outDir}/summary.json`, `${JSON.stringify({ desktop, mobile }, null, 2)}\n`);
  console.log("Automatic-first browser E2E passed", { desktop, mobile });
} finally {
  if (!server.killed) server.kill("SIGTERM");
  await Promise.race([
    new Promise(resolve => server.once("exit", resolve)),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
}
