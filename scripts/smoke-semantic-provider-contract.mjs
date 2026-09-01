import assert from "node:assert/strict";
import { dets, imageSizeFromDataUrl } from "../.tmp-semantic-contract/cv-core.js";

const header = Buffer.alloc(24);
header.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],0);
header.write("IHDR",12,"ascii");
header.writeUInt32BE(1200,16);
header.writeUInt32BE(800,20);
const imageDataUrl = `data:image/png;base64,${header.toString("base64")}`;
const size = imageSizeFromDataUrl(imageDataUrl);
assert.deepEqual(size,{width:1200,height:800});

const detections = dets({output:{detections:[
  {bbox:[120,160,420,440],label:"window",confidence:.91},
  {bbox:[0,0,1200,800],label:"brick wall",confidence:.99},
]}},size);
assert.equal(detections.length,1,"texture labels must be rejected while architectural objects survive");
assert.equal(detections[0].label,"window");
assert.ok(Math.abs(detections[0].polygon[0].x-.1)<1e-9);
assert.ok(Math.abs(detections[0].polygon[0].y-.2)<1e-9);
assert.ok(Math.abs(detections[0].polygon[2].x-.35)<1e-9);
assert.ok(Math.abs(detections[0].polygon[2].y-.55)<1e-9);
console.log("Semantic provider contract smoke passed: pixel-space Grounding-DINO boxes normalize and texture labels are rejected.");
