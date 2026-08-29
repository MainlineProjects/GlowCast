import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const outDir = "browser-evidence";
mkdirSync(outDir, { recursive: true });

const facade = `${outDir}/automatic-first-facade.svg`;
writeFileSync(facade, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#d9d2c3"/><rect x="120" y="180" width="300" height="260" fill="#23374d" stroke="#fff" stroke-width="18"/><rect x="760" y="180" width="220" height="430" fill="#382b24" stroke="#fff" stroke-width="18"/><path d="M0 610H1200" stroke="#8b8174" stroke-width="12"/></svg>`);
const textureOnly = `${outDir}/texture-only.svg`;
writeFileSync(textureOnly, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#a65f43"/>${Array.from({length:18},(_,row)=>Array.from({length:18},(_,col)=>`<rect x="${col*72-(row%2)*36}" y="${row*44}" width="68" height="40" fill="none" stroke="#d9aa91" stroke-width="3"/>`).join("")).join("")}</svg>`);

const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { stdio: ["ignore", "pipe", "pipe"] });
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

function semanticResponse() {
  return {
    surface: { polygon: [{x:.05,y:.08},{x:.96,y:.08},{x:.96,y:.88},{x:.05,y:.88}] },
    masks: [
      { label: "window", confidence: .94, polygon: [{x:.10,y:.20},{x:.38,y:.20},{x:.38,y:.55},{x:.10,y:.55}] },
      { label: "door", confidence: .93, polygon: [{x:.63,y:.20},{x:.83,y:.20},{x:.83,y:.78},{x:.63,y:.78}] }
    ],
    debug: { warnings: [] }
  };
}

function textureResponse() {
  return {
    surface: { polygon: [{x:.05,y:.08},{x:.96,y:.08},{x:.96,y:.88},{x:.05,y:.88}] },
    masks: [],
    debug: { warnings: ["Semantic detector returned zero usable architectural objects; no edge-only masks were invented."] }
  };
}

async function exercise(viewport, evidenceName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  let mode = "semantic";
  await page.route("**/api/analyze-projection", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mode === "semantic" ? semanticResponse() : textureResponse()) });
  });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });

  const upload = page.locator('input[type="file"][accept="image/*"]').first();
  await upload.setInputFiles(facade);
  const status = page.getByTestId("automatic-detection-status");
  await status.waitFor({ state: "visible", timeout: 10000 });
  const statusText = await status.textContent();
  if (!statusText?.includes("2 masks") || !statusText.includes("semantic-grounding-dino-sam2")) {
    throw new Error(`Automatic semantic status was not visible: ${statusText}`);
  }
  const maskCount = await page.locator(".zone").count();
  if (maskCount !== 2) throw new Error(`Expected exactly two rendered semantic masks, found ${maskCount}`);
  await page.screenshot({ path: `${outDir}/${evidenceName}-semantic.png`, fullPage: true });

  mode = "texture";
  await upload.setInputFiles(textureOnly);
  await page.waitForFunction(() => document.body.textContent?.includes("did not promote wall texture or edge density into masks"), null, { timeout: 10000 });
  const textureMaskCount = await page.locator(".zone").count();
  if (textureMaskCount !== 0) throw new Error(`Texture-only facade created ${textureMaskCount} masks`);
  await page.screenshot({ path: `${outDir}/${evidenceName}-texture-rejection.png`, fullPage: true });

  await browser.close();
  return { evidenceName, semanticMasks: maskCount, textureMasks: textureMaskCount };
}

try {
  await waitForServer();
  const desktop = await exercise({ width: 1440, height: 1000 }, "desktop");
  const mobile = await exercise({ width: 390, height: 844 }, "mobile");
  writeFileSync(`${outDir}/summary.json`, `${JSON.stringify({ desktop, mobile }, null, 2)}\n`);
  console.log("Automatic-first browser E2E passed", { desktop, mobile });
} finally {
  server.kill("SIGTERM");
}
