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
const semanticMarkerBeforePill = `              <span
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
const semanticMarker = `              <span
                title={(zone.label ?? "").startsWith("Auto architectural mask")
                  ? "Auto-detected " + ((zone.label ?? "").replace("Auto architectural mask · ", "").trim() || "architectural feature")
                  : "Manual cleanup mask"}
                aria-label={(zone.label ?? "").startsWith("Auto architectural mask")
                  ? "Auto-detected " + ((zone.label ?? "").replace("Auto architectural mask · ", "").trim() || "architectural feature") + " " + (index + 1)
                  : "Manual cleanup mask " + (index + 1)}
                style={(zone.label ?? "").startsWith("Auto architectural mask")
                  ? { width: "auto", minWidth: "48px", maxWidth: "none", padding: "0 7px", borderRadius: "999px", whiteSpace: "nowrap", lineHeight: "24px" }
                  : undefined}
              >
                {(zone.label ?? "").startsWith("Auto architectural mask")
                  ? (((zone.label ?? "").replace("Auto architectural mask · ", "").trim().split(/\\s+/)[0] || "AUTO").toUpperCase() + " " + (index + 1))
                  : "M" + (index + 1)}
              </span>`;

if (source.includes(semanticMarker)) {
  console.log("Semantic mask badge pills already present.");
} else if (source.includes(semanticMarkerBeforePill)) {
  source = source.replace(semanticMarkerBeforePill, semanticMarker);
  await fs.writeFile(path, source);
  console.log("Kept semantic feature names on one readable pill instead of wrapping inside the old circular badge.");
} else if (source.includes(priorMarker)) {
  source = source.replace(priorMarker, semanticMarker);
  await fs.writeFile(path, source);
  console.log("Upgraded automatic mask badges from generic A1/A2 markers to readable semantic feature pills.");
} else if (source.includes(oldMarker)) {
  source = source.replace(oldMarker, semanticMarker);
  await fs.writeFile(path, source);
  console.log("Added readable semantic auto/manual labels to mask badges.");
} else {
  throw new Error("Mask number badge anchor not found.");
}
