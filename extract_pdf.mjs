import fs from "node:fs/promises";
globalThis.DOMMatrix = class DOMMatrix {};
globalThis.ImageData = class ImageData {};
globalThis.Path2D = class Path2D {};
const pdfjsLib = await import("file:///C:/Users/Shammika%20Wijesinghe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs");

const data = new Uint8Array(await fs.readFile("./EC8204_Aug26_Project Description.pdf"));
const pdf = await pdfjsLib.getDocument({ data }).promise;
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  console.log(`\n--- PAGE ${i} ---\n${content.items.map((x) => x.str).join(" ")}`);
}
