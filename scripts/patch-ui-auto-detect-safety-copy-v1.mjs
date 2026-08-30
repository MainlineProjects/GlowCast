import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");
let changed = false;

const replacements = [
  ["<h1>GlowCast MVP Prototype</h1>", "<h1>GlowCast</h1>"],
  ['? "Start a projection map."', '? "Upload a photo and let GlowCast find the projection surface and architectural features automatically."'],
  ['? "Mask and edit the surface."', '? "Review automatic windows, doors and features. Draw only the cleanup GlowCast missed."'],
  ["1 Start", "1 Upload & Detect"],
  ["2 Mask & Edit", "2 Review"]
];

for (const [before, after] of replacements) {
  if (source.includes(before)) {
    source = source.replace(before, after);
    changed = true;
  }
}

const marker = "Automatic detection replaces only prior auto-detected masks. Manual cleanup masks stay untouched.";
if (!source.includes(marker)) {
  const actionMarker = 'data-testid="automatic-detect-action"';
  const actionIndex = source.indexOf(actionMarker);
  if (actionIndex < 0) throw new Error("Automatic detection action anchor not found.");

  const buttonEnd = source.indexOf("\n              </button>", actionIndex);
  if (buttonEnd < 0) throw new Error("Automatic detection action end not found.");

  const insertAt = buttonEnd + "\n              </button>".length;
  const helper = `\n              <p className="helperText">\n                Uses semantic architectural detection first, then boundary refinement. ${marker}\n              </p>`;
  source = source.slice(0, insertAt) + helper + source.slice(insertAt);
  changed = true;
}

if (changed) {
  fs.writeFileSync(path, source);
  console.log("Applied automatic-first workflow copy and semantic safety guidance.");
} else {
  console.log("Automatic-first workflow copy and semantic safety guidance already present.");
}
