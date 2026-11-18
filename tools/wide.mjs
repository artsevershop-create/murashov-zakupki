import { createRequire } from "module"; const require = createRequire(import.meta.url); const pw = require("playwright-core");
const b = await pw.webkit.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p.goto("http://localhost:5180/", { waitUntil: "load" }); await p.waitForTimeout(3000);
console.log(await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth,
  wide: [...document.querySelectorAll("*")].map(e => [e, e.getBoundingClientRect()]).filter(([e, r]) => r.right > innerWidth + 1 || r.width > innerWidth + 1).slice(0, 12).map(([e, r]) => (e.className?.baseVal ?? e.className) + "|" + e.tagName + "|" + Math.round(r.left) + "-" + Math.round(r.right)) })));
await b.close();
