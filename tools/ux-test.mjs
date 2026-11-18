// Сценарии «как посетители»: тренажёр, форма (без реальной отправки), FAQ с клавиатуры, меню на телефоне, reduced motion, 404.
import { createRequire } from "module"; const require = createRequire(import.meta.url);
const pw = require("playwright-core"); const URL0 = process.argv[2] || "http://localhost:5180/";
const b = await pw.chromium.launch(); const res = []; const ok = (n, c, x = "") => res.push(`${c ? "✔" : "✘"} ${n}${x ? " — " + x : ""}`);
const errs = [];
{ // 1. Офисный 1366×768: тренажёр
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } }); p.on("pageerror", e => errs.push(e.message));
  await p.goto(URL0 + "#trainer", { waitUntil: "networkidle" });
  ok("расчёт по умолчанию", (await p.textContent("#o-min")).replace(/\s/g, "") === "355178₽", await p.textContent("#o-min"));
  await p.fill("#c-cost", "500000"); await p.waitForTimeout(100);
  ok("расчёт пересчитывается", !(await p.textContent("#o-min")).includes("355"), await p.textContent("#o-min"));
  await p.fill("#c-cost", "300000"); await p.waitForTimeout(100);
  ok("кнопки торгов скрыты до старта", !(await p.isVisible("#a-bid")) && !(await p.isVisible("#a-quit")));
  await p.click("#a-go"); await p.waitForTimeout(300);
  ok("торги стартуют", await p.isVisible("#a-bid"), await p.textContent("#a-bid"));
  await p.click("#a-bid"); await p.waitForTimeout(200);
  ok("ставка пользователя в журнале", (await p.textContent("#a-log")).includes("Вы"));
  // играем: перебиваем, пока можно
  for (let i = 0; i < 120; i++) {
    if (await p.isVisible("#a-go")) break;
    if (await p.isEnabled("#a-bid")) await p.click("#a-bid");
    await p.waitForTimeout(700);
  }
  await p.waitForTimeout(13000);
  const st = await p.textContent("#a-status");
  ok("торги завершаются с итогом", await p.isVisible("#a-go"), st.slice(0, 110));
  const minTxt = (await p.textContent("#o-min")).replace(/\D/g, ""), last = await p.$$eval("#a-log li.me .num", l => l.map(x => +x.textContent.replace(/\D/g, "")));
  ok("пользователь не опускался ниже минимальной цены", last.every(v => v >= +minTxt), `мин. ${minTxt}, ставок ${last.length}`);
  await p.close();
}
{ // 2. Телефон 390: меню, форма, FAQ
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message));
  await p.goto(URL0, { waitUntil: "networkidle" });
  await p.click(".burger"); await p.waitForTimeout(400);
  ok("меню открывается", await p.isVisible("#nav a[href='#program']"));
  await p.click("#nav a[href='#signup']"); await p.waitForTimeout(800);
  ok("меню закрывается по ссылке", (await p.getAttribute(".burger", "aria-expanded")) === "false");
  await p.click("#form button[type=submit]"); ok("форма: пустое имя", (await p.textContent("#f-status")).includes("обращаться"));
  await p.fill("#f-name", "Тест"); await p.fill("#f-contact", "123"); await p.click("#form button[type=submit]");
  ok("форма: неверный контакт", (await p.textContent("#f-contact-e")).length > 0);
  await p.fill("#f-contact", "test@example.ru"); await p.click("#form button[type=submit]");
  ok("форма: без согласия", (await p.textContent("#f-status")).includes("согласие"));
  await p.check("#f-ok"); await p.click("#form button[type=submit]");
  ok("форма: честный демо-режим без отправки", (await p.textContent("#f-status")).includes("демо"));
  const fz = await p.$eval("#f-name", e => parseFloat(getComputedStyle(e).fontSize)); ok("шрифт полей ≥ 16 px (iOS не зумит)", fz >= 16, fz + "px");
  await ctx.close();
}
{ // 3. Клавиатура: FAQ
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); await p.goto(URL0 + "#faq", { waitUntil: "networkidle" });
  await p.focus("#qa1-b"); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
  ok("FAQ открывается Enter", (await p.getAttribute("#qa1-b", "aria-expanded")) === "true" && await p.isVisible("#qa1 p"));
  await p.keyboard.press("ArrowDown"); ok("FAQ: стрелка вниз к следующему вопросу", await p.evaluate(() => document.activeElement.id) === "qa2-b");
  await p.keyboard.press("Escape");
  await p.close();
}
{ // 4. Без анимаций: весь текст виден сразу
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto(URL0, { waitUntil: "networkidle" }); await p.waitForTimeout(300);
  const hidden = await p.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main p, main li")].filter(e => { if (e.closest(".qa__a")) return false; const s = getComputedStyle(e); return s.opacity === "0" || s.visibility === "hidden"; }).length);
  ok("reduced motion: скрытого текста нет", hidden === 0, "скрыто: " + hidden);
  await ctx.close();
}
{ // 5. 404 и SEO
  const p = await b.newPage(); const r = await p.goto(URL0 + "net-takoy-stranicy"); ok("404 отдаёт код 404", r.status() === 404);
  const r2 = await p.goto(URL0 + "tools/ux-test.mjs"); ok("служебные файлы не отдаются", r2.status() === 404);
  await p.goto(URL0); const seo = await p.evaluate(() => ({ h1: document.querySelectorAll("h1").length, t: document.title.length, d: document.querySelector('meta[name=description]').content.length, ld: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)["@graph"].length }));
  ok("SEO: один H1, title ≤ 60, description 120–160, JSON-LD", seo.h1 === 1 && seo.t <= 60 && seo.d >= 120 && seo.d <= 160 && seo.ld === 2, JSON.stringify(seo));
}
ok("ошибок JS нет", errs.length === 0, errs.join(" | "));
await b.close(); console.log(res.join("\n"));
