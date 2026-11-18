// Генерирует img/og.png (1200×630) и img/apple-touch-icon.png (180×180) из HTML на шрифтах проекта.
import { createRequire } from "module"; import path from "path"; import { fileURLToPath } from "url";
const require = createRequire(import.meta.url); const pw = require("playwright-core");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] || "http://localhost:5180/";
const b = await pw.chromium.launch();
const og = `<!doctype html><html><head><link rel="stylesheet" href="${base}css/site.css"><style>
body{margin:0;width:1200px;height:630px;overflow:hidden}
.og{position:relative;width:1200px;height:630px;padding:64px 72px;box-sizing:border-box;color:#fff;
background:radial-gradient(60% 60% at 85% 20%,rgba(242,209,58,.14),transparent 70%),repeating-linear-gradient(0deg,transparent 0 35px,rgba(232,239,234,.04) 35px 36px),#0F2A27}
.og .brand{position:absolute;left:72px;top:56px;color:#E8EFEA}.og .brand__txt b{font-size:22px}.og .brand__txt small{font-size:16px}.og .brand__mark{width:40px;height:40px}.og .brand__mark::after{left:13px;top:8px;width:10px;height:19px;border-width:0 4px 4px 0}
.og h1{position:absolute;left:72px;top:170px;font-size:104px;line-height:.92;color:#fff;margin:0}
.og .hl{color:#15201E}
.og p{position:absolute;left:72px;bottom:60px;font:500 26px/1.4 "Golos Text";color:#A7BDB6}
.og .stamp{right:80px;top:120px;font-size:34px;border-color:#93A7F5;color:#93A7F5;mix-blend-mode:normal}
</style></head><body><div class="og">
<span class="brand"><span class="brand__mark"></span><span class="brand__txt"><b>Александр Мурашов</b><small>закупки для поставщика</small></span></span>
<h1>Участие в закупках<br><mark class="hl">со стороны поставщика</mark></h1>
<div class="stamp"><span>8 занятий<br>по 2 часа</span></div>
<p>Программа для новичков: поиск закупки, цена, заявка, торги, договор</p></div></body></html>`;
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(base + "404.html"); await p.setContent(og, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: path.join(ROOT, "img/og.png") });
const icon = `<!doctype html><html><body style="margin:0"><img src="${base}favicon.svg" width="180" height="180" style="display:block"></body></html>`;
const q = await b.newPage({ viewport: { width: 180, height: 180 } }); await q.setContent(icon, { waitUntil: "networkidle" });
await q.screenshot({ path: path.join(ROOT, "img/apple-touch-icon.png") });
await b.close(); console.log("ok");
