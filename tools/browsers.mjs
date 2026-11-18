// 5 движков × десктоп/телефон: ошибки JS, горизонтальный скролл, H1, видимость hero и тренажёра.
import { createRequire } from "module"; const require = createRequire(import.meta.url); const pw = require("playwright-core");
const URL0 = process.argv[2] || "http://localhost:5180/"; const out = [];
const engines = [["Chromium", pw.chromium, {}], ["Chrome", pw.chromium, { channel: "chrome" }], ["Edge", pw.chromium, { channel: "msedge" }], ["Firefox", pw.firefox, {}], ["WebKit", pw.webkit, {}]];
for (const [name, type, opt] of engines) {
  let b; try { b = await type.launch(opt); } catch (e) { out.push(`— ${name}: не запустился (${e.message.split("\n")[0].slice(0, 80)})`); continue; }
  for (const [v, vo] of [["1440", { viewport: { width: 1440, height: 900 } }], ["390", { viewport: { width: 390, height: 844 }, ...(name === "Firefox" ? {} : { isMobile: true, hasTouch: true }) }]]) {
    const ctx = await b.newContext(vo); const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", e => errs.push(e.message.slice(0, 100)));
    await p.goto(URL0, { waitUntil: "load" }); await p.waitForTimeout(3800);
    const m = await p.evaluate(async () => { const h1 = document.querySelector("h1").getBoundingClientRect();
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * .7) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 120)); }
      await new Promise(r => setTimeout(r, 1200));
      const notIn = document.querySelectorAll("[data-reveal]:not(.in)").length;
      return { hs: document.documentElement.scrollWidth - innerWidth, h1: Math.round(h1.height), heroGo: document.querySelector(".hero").classList.contains("go"), notIn,
        font: document.fonts.check('800 40px "Sofia Sans Extra Condensed"', "Участие") }; });
    await p.click("#a-go").catch(() => {}); await p.waitForTimeout(400);
    const bidOk = await p.isVisible("#a-bid");
    const good = !errs.length && m.hs <= 0 && m.heroGo && m.notIn === 0 && bidOk;
    out.push(`${good ? "✔" : "✘"} ${name} ${v}: ошибок ${errs.length}${errs.length ? " (" + errs[0] + ")" : ""}, гор.скролл ${m.hs}, hero ${m.heroGo ? "ок" : "нет"}, не проявилось ${m.notIn}, шрифт ${m.font ? "ок" : "нет"}, торги ${bidOk ? "ок" : "нет"}`);
    await ctx.close();
  }
  await b.close();
}
console.log(out.join("\n"));
