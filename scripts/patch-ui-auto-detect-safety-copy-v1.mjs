import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const marker = "Automatic detection replaces only prior auto-detected masks. Manual cleanup masks stay untouched.";
if (source.includes(marker)) {
  console.log("Auto-detect safety copy already present.");
} else {
  const buttonText = 'Detecting Masks...' ;
  const textIndex = source.indexOf(buttonText);
  if (textIndex < 0) throw new Error("Auto Detect Masks button text not found.");

  const buttonEnd = source.indexOf("\n              </button>", textIndex);
  if (buttonEnd < 0) throw new Error("Auto Detect Masks button end not found.");

  const insertAt = buttonEnd + "\n              </button>".length;
  const helper = `\n              <p className="helperText">\n                Uses semantic architectural detection first, then boundary refinement. ${marker}\n              </p>`;
  source = source.slice(0, insertAt) + helper + source.slice(insertAt);
  fs.writeFileSync(path, source);
  console.log("Added semantic auto-detect safety copy.");
}
