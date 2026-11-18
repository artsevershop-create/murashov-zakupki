/* Курс А. Мурашова: motion, навигация, тренажёр «предел цены» и учебные торги, форма.
   Без зависимостей. Всё курсорное — только на pointer:fine; при reduced motion контент виден сразу. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var mq = function (q) { try { return matchMedia(q).matches; } catch (e) { return false; } };
  var REDUCED = mq("(prefers-reduced-motion: reduce)");
  var FINE = mq("(hover: hover) and (pointer: fine)");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var NO_MOTION = false;
  try { NO_MOTION = localStorage.getItem("noMotion") === "1"; } catch (e) {}
  if (NO_MOTION) { root.classList.add("no-motion"); REDUCED = true; }
  var rub = function (n) { return Math.round(n).toLocaleString("ru-RU").replace(/ |\s/g, " ") + " ₽"; };

  /* ---------- hero: один оркестрованный вход ≤ 3,5 с, потом «тихая жизнь» ---------- */
  function hero() {
    var h = $(".hero"); if (!h) return;
    var hls = $$(".hl", h);
    function go() {
      h.classList.add("go");
      if (REDUCED) { hls.forEach(function (m) { m.classList.add("on"); }); h.classList.add("live"); return; }
      setTimeout(function () { hls[0] && hls[0].classList.add("on"); }, 900);
      setTimeout(function () { hls[1] && hls[1].classList.add("on"); }, 2200);
      setTimeout(function () { h.classList.add("live"); }, 3400);
    }
    var ready = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
    var done = false, start = function () { if (!done) { done = true; requestAnimationFrame(function () { requestAnimationFrame(go); }); } };
    ready.then(start); setTimeout(start, 700); // не ждать шрифты дольше 0,7 с

    // лист слегка поворачивается за курсором (только мышь)
    var doc = $(".hero__doc", h);
    if (!FINE || REDUCED || !doc) return;
    var raf = 0, tx = 0, ty = 0;
    h.addEventListener("pointermove", function (e) {
      tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5);
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (!h.classList.contains("live")) return;
        doc.classList.add("tilt"); doc.style.transform = "perspective(900px) rotate(2deg) rotateY(" + (tx * 7).toFixed(2) + "deg) rotateX(" + (-ty * 6).toFixed(2) + "deg)"; });
    });
    h.addEventListener("pointerleave", function () { doc.style.transform = ""; });
  }

  /* ---------- заголовки по словам из маски ---------- */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    var text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text.replace(/ /g, " "));
    var i = 0;
    el.innerHTML = text.split(" ").map(function (w) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + (i++) + '">' + w.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + "</span></span>";
    }).join(" ");
    el.dataset.splitDone = "1";
  }

  /* ---------- появления: авто-reveal по селекторам + отложенные эффекты ---------- */
  function reveal() {
    var AUTO = ".path__card, .lesson, .tr__calc, .tr__auc, .final__do, .protocol, .file, .kpi li, .terms div, .author__photo, .author__txt, .qa, .form, .contacts, .sec__head .lead, .program__uni";
    $$(AUTO).forEach(function (el) { if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", ""); });
    var seen = new Map();
    $$("[data-reveal]").forEach(function (el) {
      var p = el.parentElement, n = seen.get(p) || 0; seen.set(p, n + 1);
      el.style.transitionDelay = ((n % 8) * 70) + "ms";
    });
    var els = $$("[data-reveal], [data-split], .path, .ticks, .protocol, .sec .hl");
    var splitAll = function () { $$("[data-split]").forEach(splitWords); };
    if (!REDUCED) { if (d.fonts && d.fonts.ready) d.fonts.ready.then(splitAll); else splitAll(); }
    var on = function (el) { el.classList.add(el.classList.contains("hl") ? "on" : "in"); };
    if (REDUCED || !("IntersectionObserver" in window)) { els.forEach(on); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { on(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) {
      if (el.closest(".hero")) return;
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) requestAnimationFrame(function () { on(el); });
      else io.observe(el);
    });
    // подстраховка: при очень быстрой прокрутке IO может «проскочить» блок — проявляем всё, что уже выше низа экрана
    var pending = els.filter(function (el) { return !el.closest(".hero"); }), t = false;
    function sweep() {
      t = false;
      pending = pending.filter(function (el) {
        if (el.classList.contains("in") || el.classList.contains("on")) return false;
        if (el.getBoundingClientRect().top < innerHeight) { on(el); io.unobserve(el); return false; }
        return true;
      });
      if (!pending.length) removeEventListener("scroll", onScroll);
    }
    function onScroll() { if (!t) { t = true; setTimeout(sweep, 250); } }
    addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- магнитные кнопки ---------- */
  function magnetic() {
    if (!FINE || REDUCED) return;
    $$("[data-magnetic]").forEach(function (el) {
      var k = 0.24, raf = 0, tx = 0, ty = 0, x = 0, y = 0;
      function loop() { x += (tx - x) * 0.18; y += (ty - y) * 0.18; el.style.translate = x.toFixed(2) + "px " + y.toFixed(2) + "px";
        raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.1) ? requestAnimationFrame(loop) : 0; }
      el.addEventListener("pointermove", function (e) { var r = el.getBoundingClientRect(); tx = (e.clientX - r.left - r.width / 2) * k; ty = (e.clientY - r.top - r.height / 2) * k; if (!raf) raf = requestAnimationFrame(loop); });
      el.addEventListener("pointerleave", function () { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  /* ---------- шапка, прогресс, мобильная панель, меню ---------- */
  function chrome() {
    var h = $("[data-header]"), bar = $(".progress i"), mbar = $(".mbar"), signup = $("#signup"), heroEl = $(".hero");
    var darks = $$('[data-theme="night"]'), last = scrollY, ticking = false, prev = {};
    function set(el, cls, v) { var k = cls + (el === h ? "h" : "m"); if (prev[k] !== v) { prev[k] = v; el.classList.toggle(cls, v); } }
    function upd() {
      ticking = false; var y = scrollY, H = d.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty("--p", H > 0 ? (y / H).toFixed(4) : 0);
      if (h) {
        set(h, "is-solid", y > 40);
        set(h, "is-hidden", y > last && y > 240 && !root.classList.contains("menu-open"));
        var line = 36, dark = darks.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= line && r.bottom >= line; });
        set(h, "on-dark", dark);
      }
      if (mbar && heroEl && signup) {
        var past = heroEl.getBoundingClientRect().bottom < 0, sr = signup.getBoundingClientRect(), atForm = sr.top < innerHeight && sr.bottom > 0;
        set(mbar, "show", past && !atForm);
      }
      last = y;
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener("resize", upd); upd();

    var burger = $(".burger"), nav = $("#nav");
    if (!burger || !nav) return;
    function close() { root.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Открыть меню"); }
    burger.addEventListener("click", function () {
      var open = !root.classList.contains("menu-open");
      root.classList.toggle("menu-open", open); burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      if (open) { var a = $("a", nav); a && a.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("menu-open")) { close(); burger.focus(); } });
    addEventListener("resize", function () { if (innerWidth > 900) close(); });
  }

  /* ---------- программа: активное занятие и линия прогресса (порт scroll-timeline с 21st.dev) ---------- */
  function program() {
    var lessons = $$(".lesson"), rail = $(".rail"), links = $$(".rail a"), navLinks = $$(".nav a[href^='#']");
    if (!lessons.length) return;
    var cur = -1;
    function setActive(i) {
      if (i === cur) return; cur = i;
      lessons.forEach(function (l, k) { l.classList.toggle("is-active", k === i); });
      links.forEach(function (a, k) { a.classList.toggle("done", k < i); if (k === i) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current"); });
      if (rail) rail.style.setProperty("--p", links.length > 1 ? (Math.max(0, i) / (links.length - 1)).toFixed(3) : 0);
    }
    var secs = navLinks.map(function (a) { return d.getElementById(a.getAttribute("href").slice(1)); });
    function upd() {
      var mid = innerHeight * 0.45, idx = -1;
      lessons.forEach(function (l, k) { if (l.getBoundingClientRect().top < mid) idx = k; });
      setActive(idx);
      var active = -1; secs.forEach(function (s, k) { if (s && s.getBoundingClientRect().top < mid) active = k; });
      navLinks.forEach(function (a, k) { if (k === active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    }
    var t = false; addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; upd(); }); } }, { passive: true }); upd();
  }

  /* ---------- вопросы: аккордеон (порт accessible accordion с 21st.dev на vanilla) ---------- */
  function faq() {
    $$(".qa button").forEach(function (b) {
      var panel = d.getElementById(b.getAttribute("aria-controls"));
      b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", String(open)); panel.classList.toggle("open", open); });
    });
    var btns = $$(".qa button");
    btns.forEach(function (b, i) {
      b.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : null;
        if (j === null) return; e.preventDefault(); btns[(j + btns.length) % btns.length].focus();
      });
    });
  }

  /* ---------- тренажёр: экономика участия ---------- */
  var econ = { min: 0, work: 0 };
  function num(el) { var v = parseFloat(String(el.value).replace(/\s| /g, "").replace(",", ".")); return isFinite(v) && v >= 0 ? v : NaN; }
  function fmtInput(el) { var v = num(el); if (!isNaN(v) && el.inputMode === "numeric") el.value = Math.round(v).toLocaleString("ru-RU").replace(/ | /g, " "); }
  function calc() {
    var f = $("#calc"); if (!f) return;
    var ids = ["c-cost", "c-ship", "c-pack", "c-tax", "c-margin", "c-days", "c-rate"], els = {};
    ids.forEach(function (id) { els[id] = d.getElementById(id); });
    var oMin = $("#o-min"), oWork = $("#o-work");
    function run() {
      var v = {}, bad = false;
      ids.forEach(function (id) { v[id] = num(els[id]); var invalid = isNaN(v[id]); els[id].setAttribute("aria-invalid", String(invalid)); bad = bad || invalid; });
      var share = (v["c-tax"]) / 100, shareW = (v["c-tax"] + v["c-margin"]) / 100;
      if (bad || share >= 1 || shareW >= 1) { oMin.textContent = "—"; oWork.textContent = "—"; econ.min = econ.work = 0; chartLimits(); return; }
      var costs = v["c-cost"] + v["c-ship"] + v["c-pack"];
      var finance = costs * (v["c-rate"] / 100) * (v["c-days"] / 365);
      var base = costs + finance;
      econ.min = base / (1 - share); econ.work = base / (1 - shareW);
      [[oMin, econ.min], [oWork, econ.work]].forEach(function (p) { var t = rub(p[1]); if (p[0].textContent !== t) { p[0].textContent = t; if (!REDUCED) { p[0].classList.remove("flash"); void p[0].offsetWidth; p[0].classList.add("flash"); setTimeout(function () { p[0].classList.remove("flash"); }, 500); } } });
      chartLimits(); auction.refresh();
    }
    f.addEventListener("input", run);
    $$("input[data-num]", f).forEach(function (el) { el.addEventListener("blur", function () { fmtInput(el); }); });
    f.addEventListener("submit", function (e) { e.preventDefault(); });
    run();
  }

  /* ---------- тренажёр: учебные торги на понижение ---------- */
  var chartLimits = function () {};
  var auction = { refresh: function () {} };
  function auc() {
    var go = $("#a-go"), bid = $("#a-bid"), quit = $("#a-quit"), price = $("#b-price"), who = $("#b-who"), timer = $("#b-timer"),
      status = $("#a-status"), log = $("#a-log"), stamp = $("#a-stamp"), startEl = $("#a-start"), stepEl = $("#a-step"), chart = $("#b-chart");
    if (!go) return;
    var line = $(".chart__line", chart), lMin = $(".chart__min", chart), lWork = $(".chart__work", chart);
    var S = null, TURN = 12000;
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    function yOf(p, start) { var lo = start * 0.6; return Math.max(0, Math.min(220, 220 - (p - lo) / (start - lo) * 210)); }
    chartLimits = function () {
      var start = num(startEl) || 1;
      [[lMin, econ.min], [lWork, econ.work]].forEach(function (p) { var y = p[1] ? yOf(p[1], start) : -10; p[0].setAttribute("y1", y); p[0].setAttribute("y2", y); });
    };
    function draw() {
      if (!S) { line.setAttribute("points", ""); return; }
      var n = Math.max(S.hist.length, 12), pts = [];
      S.hist.forEach(function (p, i) { var x = i / (n - 1) * 600, y = yOf(p, S.start); if (i) pts.push(x.toFixed(1) + "," + yOf(S.hist[i - 1], S.start).toFixed(1)); pts.push(x.toFixed(1) + "," + y.toFixed(1)); });
      line.setAttribute("points", pts.join(" "));
    }
    function show(p) { price.textContent = rub(p); if (!REDUCED) { price.classList.remove("tick"); void price.offsetWidth; price.classList.add("tick"); } }
    function say(html) { status.innerHTML = html; }
    function addLog(name, p, me) { var li = d.createElement("li"); if (me) li.className = "me"; li.innerHTML = "<span>" + name + "</span><span class='num'>" + rub(p) + "</span>"; log.prepend(li); }
    function next() { return S.price - S.step; }
    function updBid() {
      if (!S || S.over) return;
      var n = next();
      if (S.leader === "me") { bid.disabled = true; bid.textContent = "Вы лидируете"; }
      else if (econ.min && n < econ.min) { bid.disabled = true; bid.textContent = "Ниже вашего предела"; }
      else { bid.disabled = false; bid.textContent = "Снизить до " + rub(n); }
    }
    function place(name, me) {
      S.price = next(); S.leader = me ? "me" : name; S.hist.push(S.price); S.deadline = performance.now() + TURN;
      show(S.price); who.textContent = me ? "лидер: вы" : "лидер: " + name; addLog(me ? "Вы" : name, S.price, me); draw();
      if (me) say("Ваше предложение — <b>" + rub(S.price) + "</b>. Ждём ответа соперников.");
      else if (econ.min && next() < econ.min) say("<span class='bad'>" + name + " снизил до " + rub(S.price) + ". Следующий шаг ниже вашей минимальной цены — дальше работа в убыток.</span> Можно выйти из торгов: это тоже решение.");
      else say(name + " снизил цену до " + rub(S.price) + ". Ваш ход — или держите паузу.");
      updBid(); schedule();
    }
    function schedule() {
      clearTimeout(S.botT);
      var cands = S.bots.filter(function (b) { return b.name !== S.leader && next() >= b.floor; });
      if (!cands.length) return;
      var b = cands[Math.floor(Math.random() * cands.length)];
      S.botT = setTimeout(function () { if (S && !S.over && S.leader !== b.name && next() >= b.floor) place(b.name, false); }, rnd(1800, 5200));
    }
    function end(reason) {
      if (!S || S.over) return; S.over = true; clearTimeout(S.botT); cancelAnimationFrame(S.raf);
      bid.hidden = true; quit.hidden = true; go.hidden = false; go.textContent = "Ещё раз"; timer.style.setProperty("--t", 0);
      var p = S.price, m = econ.min;
      stamp.classList.remove("lost");
      if (S.leader === "me") {
        stamp.querySelector("span").textContent = "Победа"; stamp.classList.add("on");
        say("Вы победили по цене <b>" + rub(p) + "</b>" + (m ? ". Запас над минимальной ценой — <b>" + rub(p - m) + "</b>." : ".") + " Дальше — договор и исполнение: занятие 8.");
        who.textContent = "победитель: вы";
      } else if (S.leader) {
        var below = m && p < m;
        stamp.querySelector("span").textContent = below ? "Без убытка" : "Не вышло"; stamp.classList.add("on"); if (!below) stamp.classList.add("lost");
        say(below ? "Победил " + S.leader + " по цене " + rub(p) + " — <b>ниже вашей минимальной цены</b>. Вы не стали работать в убыток: заранее установленный предел сработал."
                  : "<span class='bad'>Победил " + S.leader + " по цене " + rub(p) + ".</span> Ваш предел — " + rub(m) + ": запас для снижения был" + (reason === "quit" ? ", а вы вышли раньше." : ". Решение принимают до торгов — этому посвящены занятия 5 и 7."));
        who.textContent = "победитель: " + S.leader;
      } else { say("Предложений не было — торги не состоялись. В учебной модели это значит: попробуйте ещё раз."); }
      if (!REDUCED) setTimeout(function () { stamp.classList.remove("on"); }, 4200);
    }
    function loop() {
      if (!S || S.over) return;
      var left = Math.max(0, S.deadline - performance.now());
      timer.style.setProperty("--t", (left / TURN).toFixed(3)); timer.classList.toggle("low", left < 3500);
      if (left <= 0) return end("time");
      S.raf = requestAnimationFrame(loop);
    }
    go.addEventListener("click", function () {
      var start = num(startEl), stepPct = parseFloat(stepEl.value) || 1;
      if (!start || start < 1000) { startEl.setAttribute("aria-invalid", "true"); say("<span class='bad'>Укажите начальную цену.</span>"); startEl.focus(); return; }
      startEl.setAttribute("aria-invalid", "false");
      if (!econ.min) { say("<span class='bad'>Сначала заполните расчёт цены в шаге 1.</span>"); return; }
      var m = econ.min;
      if (m >= start) { say("<span class='bad'>Ваша минимальная цена " + rub(m) + " не ниже начальной.</span> Участвовать в такой закупке — работать в убыток: это и есть решение «отказаться»."); return; }
      if (S) { clearTimeout(S.botT); cancelAnimationFrame(S.raf); }
      // у соперников свои пределы: иногда ниже вашего, иногда выше
      S = { start: start, step: Math.max(1, Math.round(start * stepPct / 100)), price: start, leader: null, hist: [start], over: false, deadline: performance.now() + TURN,
        bots: [{ name: "Участник 2", floor: m * rnd(0.95, 1.1) }, { name: "Участник 3", floor: m * rnd(1.02, 1.2) }] };
      log.innerHTML = ""; stamp.classList.remove("on", "lost"); show(start); who.textContent = "торги идут"; draw(); chartLimits();
      go.hidden = true; bid.hidden = false; quit.hidden = false; updBid();
      say("Торги начались с " + rub(start) + ", шаг — " + rub(S.step) + ". Каждое предложение продлевает время.");
      schedule(); S.raf = requestAnimationFrame(loop); bid.focus();
    });
    bid.addEventListener("click", function () { if (S && !S.over && !bid.disabled) place("Вы", true); });
    quit.addEventListener("click", function () { if (S && !S.over) { if (S.leader === "me") { say("Вы лидер — дождитесь окончания времени."); return; } S.quitted = true; clearTimeout(S.botT);
      // соперники доторговываются без вас
      var fin = function () { var c = S.bots.filter(function (b) { return b.name !== S.leader && next() >= b.floor; }); if (c.length && S.hist.length < 80) { var b = c[0]; S.price = next(); S.leader = b.name; S.hist.push(S.price); addLog(b.name, S.price); fin(); } };
      fin(); show(S.price); draw(); end("quit"); } });
    startEl.addEventListener("input", function () { if (!S || S.over) { var v = num(startEl); if (v) price.textContent = rub(v); } chartLimits(); });
    auction.refresh = function () { updBid(); };
    // пауза, если вкладку скрыли: таймер не «съедает» ход
    d.addEventListener("visibilitychange", function () { if (!S || S.over) return; if (d.hidden) { S.pausedLeft = S.deadline - performance.now(); clearTimeout(S.botT); } else if (S.pausedLeft) { S.deadline = performance.now() + S.pausedLeft; S.pausedLeft = 0; schedule(); S.raf = requestAnimationFrame(loop); } });
  }

  /* ---------- форма записи (отправка не подключена — честное сообщение) ---------- */
  function form() {
    var f = $("#form"); if (!f) return;
    var st = $("#f-status"), contact = $("#f-contact"), err = $("#f-contact-e");
    var ENDPOINT = ""; // ЗАПОЛНИТЬ: адрес обработчика (CRM, почта, бот). Пока пусто — заявка никуда не уходит.
    f.addEventListener("submit", function (e) {
      e.preventDefault(); st.className = "form__status"; err.textContent = "";
      if ($("#f-site").value) return; // honeypot
      var name = $("#f-name"), ok = $("#f-ok"), c = contact.value.trim();
      var validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || c.replace(/\D/g, "").length >= 10;
      name.setAttribute("aria-invalid", String(!name.value.trim())); contact.setAttribute("aria-invalid", String(!validContact));
      if (!name.value.trim()) { st.textContent = "Напишите, как к вам обращаться."; st.classList.add("err"); name.focus(); return; }
      if (!validContact) { err.textContent = "Нужен телефон (от 10 цифр) или e-mail."; st.textContent = "Проверьте контакт."; st.classList.add("err"); contact.focus(); return; }
      if (!ok.checked) { st.textContent = "Отметьте согласие на обработку персональных данных."; st.classList.add("err"); ok.focus(); return; }
      if (!ENDPOINT) { st.textContent = "Форма в демо-режиме: заявка не отправлена. Отправку подключим, когда будут контакты для приёма заявок."; st.classList.add("err"); return; }
      var btn = $("button[type=submit]", f); btn.disabled = true; st.textContent = "Отправляем…";
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.value.trim(), contact: c, msg: $("#f-msg").value.trim() }) })
        .then(function (r) { if (!r.ok) throw 0; st.textContent = "Спасибо! Заявка отправлена — свяжемся с вами."; st.classList.add("ok"); f.reset(); })
        .catch(function () { st.textContent = "Не получилось отправить. Попробуйте ещё раз или напишите напрямую."; st.classList.add("err"); })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- стоп-кран анимаций ---------- */
  function motionToggle() {
    var b = $("#motion-toggle"); if (!b) return;
    var set = function (v) { b.setAttribute("aria-pressed", String(v)); b.textContent = v ? "Включить анимацию" : "Остановить анимацию"; };
    set(NO_MOTION);
    b.addEventListener("click", function () { var v = b.getAttribute("aria-pressed") !== "true"; try { localStorage.setItem("noMotion", v ? "1" : "0"); } catch (e) {} root.classList.toggle("no-motion", v); set(v); if (!v) location.reload(); });
  }

  function init() {
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    hero(); reveal(); magnetic(); chrome(); program(); faq(); auc(); calc(); form(); motionToggle();
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();
})();
