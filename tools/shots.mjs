// Полные скриншоты 1440 и 390 с прокруткой (чтобы сработали появления). Только на D.
// node tools/shots.mjs http://localhost:5180/ D:/cache/site-audit/murashov-shots [reduced]
import { createRequire } from "module"; import fs from "fs"; const require = createRequire(import.meta.url);
const pw = require("playwright-core");
const [url = "http://localhost:5180/", out = "D:/cache/site-audit/murashov-shots", mode = ""] = process.argv.slice(2);
if (/^c:/i.test(out)) throw new Error("не на диск C");
fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch();
for (const [name, opts] of [["d1440", { viewport: { width: 1440, height: 900 } }], ["m390", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ["m360", { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]]) {
  const ctx = await b.newContext({ ...opts, locale: "ru-RU", reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(3800);
  await p.screenshot({ path: `${out}/${name}-hero.png` });
  const info = await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * .6) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 160)); }
    await new Promise(r => setTimeout(r, 1300)); scrollTo({ top: 0, behavior: "instant" });
    const wide = [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest(".hp,.hero__bg,.ftr__big")).slice(0, 6).map(e => e.className || e.tagName);
    return { hscroll: document.documentElement.scrollWidth - innerWidth, wide, h: document.body.scrollHeight }; });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  console.log(name, JSON.stringify(info), errs.length ? "ERRORS: " + errs.join(" | ") : "0 ошибок");
  await ctx.close();
}
await b.close();
