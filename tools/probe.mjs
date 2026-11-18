import { createRequire } from "module"; const require = createRequire(import.meta.url);
const pw = require("playwright-core");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", e => console.log("ERR", e.message)); p.on("console", m => console.log("console", m.type(), m.text()));
await p.goto(process.argv[2] || "http://localhost:5180/", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
console.log(await p.evaluate(async () => { const r = []; r.push(document.querySelectorAll(".in").length);
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo({top:y,behavior:"instant"}); await new Promise(r => setTimeout(r, 200)); }
  await new Promise(r => setTimeout(r, 500)); r.push(document.querySelectorAll(".in").length, document.querySelectorAll("[data-reveal]").length); return r; }));
await b.close();
