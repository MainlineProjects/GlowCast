import fs from 'node:fs';

const p = 'src/App.tsx';
let s = fs.readFileSync(p, 'utf8');
let changed = false;

function insertBeforeEdgeScannerButton(source, insertion) {
  const scannerText = 'Show Edge Scanner';
  const textIndex = source.indexOf(scannerText);
  if (textIndex < 0) return null;
  const buttonStart = source.lastIndexOf('<button', textIndex);
  if (buttonStart < 0) return null;
  return source.slice(0, buttonStart) + insertion + '\n              ' + source.slice(buttonStart);
}

function insertDebugHelper(source, insertion) {
  const buttonText = 'Auto Detect Masks';
  const buttonIndex = source.indexOf(buttonText);
  if (buttonIndex < 0) return null;
  const buttonEnd = source.indexOf('\n              </button>', buttonIndex);
  if (buttonEnd < 0) return null;
  const insertAt = buttonEnd + '\n              </button>'.length;
  return source.slice(0, insertAt) + insertion + source.slice(insertAt);
}

if (!s.includes('const [detectionDebug, setDetectionDebug]')) {
  const anchor = '  const [edgePoints, setEdgePoints] = useState<EdgePoint[]>([]);';
  if (!s.includes(anchor)) throw new Error('Could not find edgePoints state anchor.');
  s = s.replace(
    anchor,
    anchor + '\n  const [detectionDebug, setDetectionDebug] = useState<{ candidateMasks: number; source: string; semanticWarnings: number } | null>(null);'
  );
  changed = true;
}

if (!s.includes('setDetectionDebug(null);')) {
  const anchor = '    setEdgePoints([]);';
  if (!s.includes(anchor)) throw new Error('Could not find resetEdgeScanner edgePoints anchor.');
  s = s.replace(anchor, anchor + '\n    setDetectionDebug(null);');
  changed = true;
}

const functionBlock = [
  '',
  '  async function runAutomaticSemanticDetection(sourceUrl: string) {',
  '    if (!sourceUrl) return;',
  '',
  '    try {',
  '      setDetecting(true);',
  '      setDebugWarnings([]);',
  '      setDrawMode(false);',
  '      setCornerMode(false);',
  '      setCornerPoints([]);',
  '      setSurfacePolygonMode(false);',
  '      setProjectionOnly(false);',
  '      setDetectMessage("Analyzing windows, doors, openings, arches and columns...");',
  '',
  '      const analysis = await detectSurfaceAndMasks(sourceUrl);',
  '      const detected = analysis.masks.map((candidate, index) => ({',
  '        ...candidate,',
  '        id: Date.now() + index,',
  '        included: true,',
  '        shape: "rectangle" as MaskShape,',
  '        label: "Auto architectural mask · " + (candidate.label ?? "architectural opening")',
  '      }));',
  '',
  '      setSurfaceZone(analysis.surface);',
  '      setShowSurfaceHandles(false);',
  '      setZones((current) => [',
  '        ...current.filter((zone) => !(zone.label ?? "").startsWith("Auto architectural mask")),',
  '        ...detected',
  '      ]);',
  '      setDebugWarnings(analysis.warnings);',
  '      setDetectionDebug({ candidateMasks: detected.length, source: "semantic-grounding-dino-sam2", semanticWarnings: analysis.warnings.length });',
  '      setStep("mask");',
  '',
  '      if (detected.length) {',
  '        setSelectedTarget("zone");',
  '        setSelectedZoneId(detected[0].id);',
  '        setDetectMessage("Automatic analysis found " + detected.length + " architectural feature" + (detected.length === 1 ? "" : "s") + ". Review masks, then make only the cleanup edits you need.");',
  '      } else {',
  '        setSelectedTarget("surface");',
  '        setSelectedZoneId(null);',
  '        setDetectMessage("Automatic analysis found no confident architectural objects. GlowCast did not promote wall texture or edge density into masks; manual cleanup remains available.");',
  '      }',
  '    } catch (error) {',
  '      const message = error instanceof Error ? error.message : "Automatic semantic detection failed.";',
  '      setDebugWarnings([message]);',
  '      setDetectionDebug({ candidateMasks: 0, source: "semantic-unavailable", semanticWarnings: 1 });',
  '      setStep("mask");',
  '      setDetectMessage("Automatic object detection is unavailable right now. No edge-only masks were created; you can still adjust the surface or draw cleanup masks manually.");',
  '    } finally {',
  '      setDetecting(false);',
  '    }',
  '  }',
  '',
  '  async function runLocalAutoMaskDetection() {',
  '    if (!imageUrl) return;',
  '    await runAutomaticSemanticDetection(imageUrl);',
  '  }',
  ''
].join('\n');

const resetAnchor = '\n  function resetForPhoto(src: string, thumbnail: string | null, size: ImageSize, message: string) {';
const oldFunctionStart = s.indexOf('  async function runLocalAutoMaskDetection()');
if (oldFunctionStart >= 0) {
  const oldFunctionEnd = s.indexOf(resetAnchor, oldFunctionStart);
  if (oldFunctionEnd < 0) throw new Error('Could not locate end of previous auto-detect function.');
  s = s.slice(0, oldFunctionStart) + functionBlock.trimStart() + s.slice(oldFunctionEnd);
  changed = true;
} else if (!s.includes('async function runAutomaticSemanticDetection(sourceUrl: string)')) {
  if (!s.includes(resetAnchor)) throw new Error('Could not find resetForPhoto anchor.');
  s = s.replace(resetAnchor, functionBlock + resetAnchor);
  changed = true;
}

const uploadBefore = `    resetForPhoto(
      src,
      thumbnail,
      size,
      "Photo loaded. Use Draw Projection Surface to define where you want to project."
    );`;
const uploadAfter = `    resetForPhoto(
      src,
      thumbnail,
      size,
      "Photo loaded. Automatic architectural analysis is starting..."
    );
    void runAutomaticSemanticDetection(src);`;
if (s.includes(uploadBefore)) {
  s = s.replace(uploadBefore, uploadAfter);
  changed = true;
}

const recentBefore = `    resetForPhoto(
      photo.imageUrl,
      photo.thumbnailUrl,
      photo.imageSize,
      "Recent photo loaded. Use Draw Projection Surface to start."
    );`;
const recentAfter = `    resetForPhoto(
      photo.imageUrl,
      photo.thumbnailUrl,
      photo.imageSize,
      "Recent photo loaded. Automatic architectural analysis is starting..."
    );
    void runAutomaticSemanticDetection(photo.imageUrl);`;
if (s.includes(recentBefore)) {
  s = s.replace(recentBefore, recentAfter);
  changed = true;
}

const buttonBlock = '<button type="button" className="primary" onClick={runLocalAutoMaskDetection} disabled={!imageUrl || detecting || edgeScanning || cornerMode || surfacePolygonMode}>\n                <ScanLine size={18} /> {detecting ? "Detecting Masks..." : "Auto Detect Masks"}\n              </button>';
if (!s.includes('onClick={runLocalAutoMaskDetection}')) {
  const next = insertBeforeEdgeScannerButton(s, buttonBlock);
  if (!next) throw new Error('Could not find edge scanner button anchor.');
  s = next;
  changed = true;
}

if (s.includes('Avoid Masks')) {
  s = s.replaceAll('Avoid Masks', 'Detected Features');
  changed = true;
}

const debugBlock = '\n              {detectionDebug && (\n                <p className="helperText" data-testid="automatic-detection-status">\n                  Automatic detection: {detectionDebug.candidateMasks} masks · {detectionDebug.source}{detectionDebug.semanticWarnings ? ` · ${detectionDebug.semanticWarnings} warning${detectionDebug.semanticWarnings === 1 ? "" : "s"}` : ""}\n                </p>\n              )}';
if (!s.includes('data-testid="automatic-detection-status"')) {
  const next = insertDebugHelper(s, debugBlock);
  if (next) {
    s = next;
    changed = true;
  }
}

if (!changed) {
  console.log('No changes made. Semantic-first auto detect patch is already applied.');
} else {
  fs.writeFileSync(p, s);
  console.log('Applied automatic-first semantic detection UI patch.');
}
