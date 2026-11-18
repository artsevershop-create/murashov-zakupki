// Скриншоты по секциям: node tools/sections.mjs <url> <out> <width>
import { createRequire } from "module"; import fs from "fs"; const require = createRequire(import.meta.url);
const pw = require("playwright-core");
const [url, out, w = "1440"] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const mob = +w < 700;
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: mob ? 844 : 900 }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(3600);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * .6) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 150)); } await new Promise(r => setTimeout(r, 1300)); });
const ids = await p.evaluate(() => [...document.querySelectorAll("main > section, footer")].map((s, i) => s.id || "s" + i));
for (const [i, id] of ids.entries()) {
  const el = await p.$("#" + id);
  if (el) await el.screenshot({ path: `${out}/${w}-${String(i).padStart(2, "0")}-${id}.png` });
}
const f = await p.$("footer"); if (f) await f.screenshot({ path: `${out}/${w}-99-footer.png` });
await b.close(); console.log(ids.join(", "));
