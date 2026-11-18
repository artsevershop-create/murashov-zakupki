import { createRequire } from "module"; const require = createRequire(import.meta.url); const pw = require("playwright-core");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://localhost:5180/#trainer", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
await p.click("#a-go");
for (let i = 0; i < 14; i++) { if (await p.isEnabled("#a-bid")) await p.click("#a-bid"); await p.waitForTimeout(900); }
await p.locator(".tr__auc").screenshot({ path: "D:/cache/site-audit/murashov-trainer-mid.png" });
await p.waitForTimeout(14000);
await p.locator(".tr__auc").screenshot({ path: "D:/cache/site-audit/murashov-trainer-end.png" });
await b.close();
