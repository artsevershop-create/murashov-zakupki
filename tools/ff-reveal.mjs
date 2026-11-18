import { createRequire } from "module"; const require = createRequire(import.meta.url); const pw = require("playwright-core");
const b = await pw.firefox.launch();
for (let run = 0; run < 3; run++) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(process.argv[2], { waitUntil: "load" }); await p.waitForTimeout(3800);
  console.log(await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * .7) { scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 120)); }
    await new Promise(r => setTimeout(r, 1200)); scrollTo({ top: document.body.scrollHeight, behavior: "instant" }); await new Promise(r => setTimeout(r, 800));
    return [...document.querySelectorAll("[data-reveal]:not(.in)")].map(e => e.className + "|" + Math.round(e.getBoundingClientRect().top + scrollY) + "/" + document.body.scrollHeight); }));
  await p.close();
}
await b.close();
