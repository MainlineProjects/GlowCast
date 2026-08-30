import fs from "node:fs/promises";

const path = "src/App.tsx";
let source = await fs.readFile(path, "utf8");

const oldMarker = "              <span>{index + 1}</span>";
const priorMarker = `              <span
                title={(zone.label ?? "").startsWith("Auto architectural mask") ? "Auto-detected mask" : "Manual mask"}
                aria-label={((zone.label ?? "").startsWith("Auto architectural mask") ? "Auto-detected mask " : "Manual mask ") + (index + 1)}
              >
                {(zone.label ?? "").startsWith("Auto architectural mask") ? "A" : "M"}{index + 1}
              </span>`;
const semanticMarker = `              <span
                title={(zone.label ?? "").startsWith("Auto architectural mask")
                  ? "Auto-detected " + ((zone.label ?? "").replace("Auto architectural mask · ", "").trim() || "architectural feature")
                  : "Manual cleanup mask"}
                aria-label={(zone.label ?? "").startsWith("Auto architectural mask")
                  ? "Auto-detected " + ((zone.label ?? "").replace("Auto architectural mask · ", "").trim() || "architectural feature") + " " + (index + 1)
                  : "Manual cleanup mask " + (index + 1)}
              >
                {(zone.label ?? "").startsWith("Auto architectural mask")
                  ? (((zone.label ?? "").replace("Auto architectural mask · ", "").trim().split(/\\s+/)[0] || "AUTO").toUpperCase() + " " + (index + 1))
                  : "M" + (index + 1)}
              </span>`;

if (source.includes(semanticMarker)) {
  console.log("Semantic mask badges already present.");
} else if (source.includes(priorMarker)) {
  source = source.replace(priorMarker, semanticMarker);
  await fs.writeFile(path, source);
  console.log("Upgraded automatic mask badges from generic A1/A2 markers to visible semantic feature labels.");
} else if (source.includes(oldMarker)) {
  source = source.replace(oldMarker, semanticMarker);
  await fs.writeFile(path, source);
  console.log("Added visible semantic auto/manual labels to mask badges.");
} else {
  throw new Error("Mask number badge anchor not found.");
}
