import fs from 'node:fs/promises';
import path from 'node:path';

const FOLDER_ID = process.env.GLOWCAST_REFERENCE_FOLDER_ID || '154_ygM9h5WUEI_HfRPW6FqkCM5ILh5Z6';
const MANIFEST_NAME = 'benchmark_manifest_v2.json';
const token = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
const endpoint = process.env.GLOWCAST_PRODUCTION_ANALYZE_URL;
const outDir = process.env.GLOWCAST_BENCHMARK_OUT || 'private-benchmark-evidence';

if (!token) throw new Error('GOOGLE_OAUTH_ACCESS_TOKEN is required. Authenticate a read-only Google service account first.');
if (!endpoint) throw new Error('GLOWCAST_PRODUCTION_ANALYZE_URL is required and must point to the deployed POST /api/analyze-projection endpoint.');

const headers = { Authorization: `Bearer ${token}` };
const esc = value => value.replaceAll("'", "\\'");

async function driveJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  return res.json();
}
async function driveBytes(id) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { headers });
  if (!res.ok) throw new Error(`Drive download ${res.status}: ${await res.text()}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), mime: res.headers.get('content-type') || 'application/octet-stream' };
}
async function listChildren(folderId) {
  const q = encodeURIComponent(`'${esc(folderId)}' in parents and trashed = false`);
  const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,size)');
  let pageToken = '';
  const files = [];
  do {
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=1000&fields=${fields}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const page = await driveJson(url);
    files.push(...(page.files || []));
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return files;
}
function collectImageNames(node, found = []) {
  if (typeof node === 'string' && /\.(png|jpe?g|webp)$/i.test(node)) found.push(node);
  else if (Array.isArray(node)) for (const v of node) collectImageNames(v, found);
  else if (node && typeof node === 'object') for (const v of Object.values(node)) collectImageNames(v, found);
  return found;
}
function manifestEntries(manifest) {
  const candidates = manifest.images || manifest.benchmarks || manifest.cases || manifest.items || manifest.files;
  if (Array.isArray(candidates)) return candidates;
  const names = [...new Set(collectImageNames(manifest))];
  return names.map(name => ({ file: name }));
}
function entryName(entry) {
  if (typeof entry === 'string') return entry;
  return entry.file || entry.filename || entry.name || entry.image || entry.path;
}
function dataUrl(bytes, mime) { return `data:${mime};base64,${bytes.toString('base64')}`; }

await fs.mkdir(outDir, { recursive: true });
const children = await listChildren(FOLDER_ID);
const byName = new Map(children.map(f => [f.name, f]));
const manifestFile = byName.get(MANIFEST_NAME);
if (!manifestFile) throw new Error(`${MANIFEST_NAME} not found in Drive folder ${FOLDER_ID}`);
const manifestDownload = await driveBytes(manifestFile.id);
const manifest = JSON.parse(manifestDownload.bytes.toString('utf8'));
const entries = manifestEntries(manifest);
if (entries.length !== 24) throw new Error(`Authoritative manifest must resolve to exactly 24 entries; resolved ${entries.length}.`);

const results = [];
for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const name = entryName(entry);
  if (!name) throw new Error(`Manifest entry ${i + 1} has no image filename.`);
  const driveFile = byName.get(name) || byName.get(path.basename(name));
  if (!driveFile) throw new Error(`Manifest image missing from private Drive folder: ${name}`);
  const { bytes, mime } = await driveBytes(driveFile.id);
  if (!mime.startsWith('image/')) throw new Error(`${name} downloaded with non-image MIME ${mime}`);
  const started = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageDataUrl: dataUrl(bytes, mime) })
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  const record = {
    index: i + 1,
    file: name,
    drive_file_id: driveFile.id,
    mime_type: mime,
    bytes: bytes.length,
    http_status: res.status,
    elapsed_ms: Date.now() - started,
    detector_provider: body?.debug?.detectorProvider ?? null,
    segmentation_provider: body?.debug?.segmentationProvider ?? null,
    mask_count: Array.isArray(body?.masks) ? body.masks.length : null,
    warnings: body?.debug?.warnings ?? [],
    response: body
  };
  results.push(record);
  await fs.writeFile(path.join(outDir, `${String(i + 1).padStart(2, '0')}-${path.basename(name)}.json`), JSON.stringify(record, null, 2));
  if (!res.ok) throw new Error(`Production semantic endpoint failed for ${name}: HTTP ${res.status}`);
}

const summary = {
  status: 'BRIDGE_EXECUTED',
  manifest: MANIFEST_NAME,
  image_count: results.length,
  all_24_posted_to_production_semantic_endpoint: results.length === 24,
  endpoint,
  results: results.map(({ response, ...r }) => r)
};
await fs.writeFile(path.join(outDir, '00-BRIDGE-SUMMARY.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
