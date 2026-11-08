/* Тренажор „Просто“ (trainer.html) – замества тренажора за ниво Просто в центровете.
   Настройки: тема (от ±1, ±2 до трицифрени до 999), брой числа в примера, скорост (сек. на число, стъпки ~10 %), примери в серия, звук и глас.
   Режим „Стена“: числата едно след друго на екрана/проектора → „= ?“ → учителят показва отговора с бутон.
   Режим „Домашно“: детето смята на физическия абакус и въвежда отговора; записват се точност и време (localStorage ma.trainer.v1).
   Параметри: ?mode=wall|home&topic=s3&count=5&speed=2&n=10 */
(function () {
  const E = window.ABACUS_ENGINE, T = window.ABACUS_TEXTS, Q = new URLSearchParams(location.search);
  const SPEEDS = [10, 7.5, 5, 4, 3.6, 3.2, 2.9, 2.6, 2.2, 2, 1.8, 1.6, 1.4, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30];
  const LKEY = "ma.trainer.v1", SKEY = "ma.trainer.settings";
  let S = { mode: "wall", topic: "s3", count: 3, speed: 2, n: 10, beep: true, voice: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem(SKEY) || "{}")); } catch (e) {}
  ["mode", "topic"].forEach(k => { if (Q.get(k)) S[k] = Q.get(k); }); ["count", "speed", "n"].forEach(k => { if (Q.get(k)) S[k] = +Q.get(k); });
  const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} };
  const $ = (s) => document.querySelector(s);
  const topic = () => E.TOPICS.find(t => t.id === S.topic) || E.TOPICS[1];
  let gen = 0, series = null, typed = "";
  const wait = (ms) => { const g = gen; return new Promise((r, rej) => setTimeout(() => g === gen ? r() : rej("stale"), ms)); };
  function log(o) { try { const a = JSON.parse(localStorage.getItem(LKEY) || "[]"); a.push(Object.assign({ t: Date.now() }, o)); localStorage.setItem(LKEY, JSON.stringify(a.slice(-5000))); } catch (e) {} }

  // звук: кратко „тик“ при всяко число; глас (по желание) – записите „плюс 3“ и т.н. (едноцифрени), иначе синтез на устройството
  let ac = null; function tick() { if (!S.beep) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12); o.stop(ac.currentTime + 0.13); } catch (e) {} }
  let AUD = {}; fetch("config/abacus-audio.json?v=1").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUD[x.t] = x.f; })).catch(() => {});
  function speak(n, first) {
    if (!S.voice) return; const txt = first ? T.number(n) : T.op(n > 0 ? "+" : "-", Math.abs(n));
    try { if (AUD[txt]) { new Audio("assets/audio/abacus/" + AUD[txt]).play().catch(() => {}); return; }
      const v = (speechSynthesis.getVoices() || []).find(x => /^bg/i.test(x.lang)); if (v) { const u = new SpeechSynthesisUtterance(txt); u.voice = v; u.lang = v.lang; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) {}
  }

  // ---- екран с настройки ----
  function settings() {
    gen++;
    const tp = topic();
    document.body.innerHTML = `<div class="tr-app">
      <div class="tr-head"><div class="tr-title">Тренажор · Просто</div>
        <div class="tr-seg" role="group" aria-label="Режим"><button data-m="wall" class="${S.mode === "wall" ? "on" : ""}">Стена</button><button data-m="home" class="${S.mode === "home" ? "on" : ""}">Домашно</button></div></div>
      <div class="tr-set">
        <div class="tr-card" style="grid-column: span 2; min-width: 0"><h3>Тема</h3><select id="tp">${E.TOPICS.map(t => `<option value="${t.id}" ${t.id === tp.id ? "selected" : ""}>${t.name}</option>`).join("")}</select>
          <div class="tr-ex" id="ex" style="margin-top:8px"></div></div>
        <div class="tr-card"><h3>Числа в примера</h3><div class="tr-step"><button data-k="count" data-d="-1" aria-label="по-малко">‹</button><b id="v-count">${S.count}</b><button data-k="count" data-d="1" aria-label="повече">›</button></div></div>
        <div class="tr-card"><h3>Скорост (сек. на число)</h3><div class="tr-step"><button data-k="speed" data-d="-1" aria-label="по-бавно">‹</button><b id="v-speed">${S.speed}</b><button data-k="speed" data-d="1" aria-label="по-бързо">›</button></div></div>
        <div class="tr-card"><h3>Примери в серия</h3><div class="tr-step"><button data-k="n" data-d="-1">‹</button><b id="v-n">${S.n}</b><button data-k="n" data-d="1">›</button></div>
          <label class="tr-tog"><input type="checkbox" id="beep" ${S.beep ? "checked" : ""}> звук при всяко число</label>
          <label class="tr-tog"><input type="checkbox" id="voice" ${S.voice ? "checked" : ""}> глас (диктовка)</label></div>
      </div>
      <button class="tr-start" id="go">Старт</button>
      <div class="tr-info">${S.mode === "wall" ? "Стена: децата смятат на абакусите си; отговорът се показва с бутон." : "Домашно: смятай на абакуса и въведи отговора."}</div></div>`;
    const sample = () => { const ex = E.simpleExample(Object.assign({ count: S.count }, topic())); $("#ex").textContent = ex ? "Пример: " + fmt(ex.nums) + " = " + ex.answer : "Няма примери с тези настройки"; };
    sample();
    document.querySelectorAll(".tr-seg button").forEach(b => b.onclick = () => { S.mode = b.dataset.m; save(); settings(); });
    $("#tp").onchange = (e) => { S.topic = e.target.value; save(); sample(); };
    document.querySelectorAll(".tr-step button").forEach(b => b.onclick = () => {
      const k = b.dataset.k, d = +b.dataset.d;
      if (k === "speed") { const i = SPEEDS.indexOf(S.speed); S.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, (i < 0 ? 9 : i) + d))]; }
      else if (k === "count") { const i = COUNTS.indexOf(S.count); S.count = COUNTS[Math.max(0, Math.min(COUNTS.length - 1, (i < 0 ? 2 : i) + d))]; sample(); }
      else S.n = Math.max(1, Math.min(50, S.n + d * (S.n >= 10 ? 5 : 1)));
      $("#v-" + k).textContent = S[k]; save();
    });
    $("#beep").onchange = (e) => { S.beep = e.target.checked; save(); }; $("#voice").onchange = (e) => { S.voice = e.target.checked; save(); };
    $("#go").onclick = () => startSeries();
  }
  const fmt = (nums) => nums.map((n, i) => i === 0 ? String(n) : (n > 0 ? "+ " + n : "− " + -n)).join(" ");

  // ---- серия ----
  function startSeries() { series = { i: 0, ok: 0, times: [], items: [], id: Date.now() }; log({ ev: "series", S: Object.assign({}, S) }); runExample().catch(() => {}); }
  async function runExample() {
    gen++; const ex = E.simpleExample(Object.assign({ count: S.count }, topic()));
    if (!ex) { alertBox("Няма примери с тези настройки."); return; }
    series.cur = ex;
    document.body.innerHTML = `<div class="tr-app"><div class="tr-head"><div class="tr-info">${topic().name} · ${S.count} числа · ${S.speed} с · пример ${series.i + 1} от ${S.n}</div><button class="tr-btn" id="stop">Край</button></div>
      <div class="tr-stage"><div class="tr-num" id="num"></div><div id="after"></div></div></div>`;
    $("#stop").onclick = () => summary();
    const num = $("#num");
    for (const k of [3, 2, 1]) { num.className = "tr-num"; num.textContent = k; await wait(600); }
    num.textContent = ""; await wait(350);
    const ms = S.speed * 1000, gap = Math.min(250, Math.max(60, ms * 0.12));
    for (let i = 0; i < ex.nums.length; i++) {
      const n = ex.nums[i]; num.className = "tr-num " + (i === 0 || n > 0 ? "plus" : "minus");
      num.textContent = i === 0 ? String(n) : (n > 0 ? "+" + n : "−" + -n); tick(); speak(n, i === 0);
      await wait(ms - gap); num.textContent = ""; await wait(gap);
    }
    num.className = "tr-num ask"; num.textContent = "= ?"; series.askedAt = Date.now();
    if (S.mode === "wall") wallAfter(); else homeAfter();
  }
  function wallAfter() {
    $("#after").innerHTML = `<div class="tr-row"><button class="tr-btn primary" id="show">Покажи отговора</button></div>`;
    $("#show").onclick = () => { $("#num").textContent = series.cur.answer; $("#after").innerHTML = `<div class="tr-ex">${fmt(series.cur.nums)} = ${series.cur.answer}</div><div class="tr-row"><button class="tr-btn" id="again">↺ Повтори примера</button><button class="tr-btn primary" id="next">Следващ →</button></div>`;
      $("#next").onclick = () => nextEx(null); $("#again").onclick = () => replay(); log({ ev: "wall", nums: series.cur.nums, ans: series.cur.answer }); };
  }
  async function replay() {   // същият пример още веднъж
    gen++; const ex = series.cur, num = $("#num"); $("#after").innerHTML = "";
    const ms = S.speed * 1000, gap = Math.min(250, Math.max(60, ms * 0.12));
    try { for (let i = 0; i < ex.nums.length; i++) { const n = ex.nums[i]; num.className = "tr-num " + (i === 0 || n > 0 ? "plus" : "minus"); num.textContent = i === 0 ? String(n) : (n > 0 ? "+" + n : "−" + -n); tick(); speak(n, i === 0); await wait(ms - gap); num.textContent = ""; await wait(gap); }
      num.className = "tr-num ask"; num.textContent = "= ?"; S.mode === "wall" ? wallAfter() : homeAfter(); } catch (e) {}
  }
  function homeAfter() {
    typed = "";
    $("#after").innerHTML = `<div class="tr-typed" id="typed">…</div><div class="tr-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button data-d="${d}">${d}</button>`).join("")}</div>
      <div class="tr-row" style="margin-top:10px"><button class="tr-btn" data-d="back">⌫</button><button class="tr-btn primary" data-d="ok">✓ Готово</button></div>`;
    $("#after").onclick = (e) => { const d = e.target.dataset && e.target.dataset.d; if (d == null) return;
      if (d === "back") typed = typed.slice(0, -1); else if (d === "ok") { if (typed !== "") return check(); } else if (typed.length < 4) typed += d;
      $("#typed").textContent = typed || "…"; };
  }
  function check() {
    const ok = +typed === series.cur.answer, sec = (Date.now() - series.askedAt) / 1000;
    series.items.push({ nums: series.cur.nums, ans: series.cur.answer, got: +typed, ok, sec }); if (ok) series.ok++; series.times.push(sec);
    log({ ev: "answer", topic: S.topic, count: S.count, speed: S.speed, nums: series.cur.nums, ans: series.cur.answer, got: +typed, ok, sec });
    $("#num").textContent = series.cur.answer; $("#num").className = "tr-num " + (ok ? "plus" : "minus");
    $("#after").innerHTML = `<div class="tr-res ${ok ? "ok" : "no"}">${ok ? "Браво! Точно така." : "Отговорът е " + series.cur.answer + "."}</div><div class="tr-ex">${fmt(series.cur.nums)} = ${series.cur.answer}</div>
      <div class="tr-row"><button class="tr-btn" id="again">↺ Повтори примера</button><button class="tr-btn primary" id="next">Следващ →</button></div>`;
    $("#next").onclick = () => nextEx(); $("#again").onclick = () => replay();
  }
  function nextEx() { series.i++; if (series.i >= S.n) return summary(); runExample().catch(() => {}); }
  function summary() {
    gen++; const home = S.mode === "home" && series && series.items.length;
    log({ ev: "summary", S: Object.assign({}, S), ok: series ? series.ok : 0, of: series ? series.items.length : 0 });
    document.body.innerHTML = `<div class="tr-app"><div class="tr-stage"><div class="tr-sum">${home ? `Верни: <b>${series.ok} от ${series.items.length}</b><br>Средно време за отговор: ${(series.times.reduce((a, b) => a + b, 0) / series.times.length).toFixed(1)} с<br><span class="tr-ex">${topic().name} · ${S.count} числа · ${S.speed} с</span>` : "Серията приключи."}</div>
      <div class="tr-row"><button class="tr-btn" id="set">Настройки</button><button class="tr-btn primary" id="more">Още една серия</button></div></div></div>`;
    $("#set").onclick = settings; $("#more").onclick = startSeries;
  }
  function alertBox(t) { document.body.innerHTML = `<div class="tr-app"><div class="tr-stage"><div class="tr-sum">${t}</div><button class="tr-btn" id="set">Настройки</button></div></div>`; $("#set").onclick = settings; }
  settings();
  window.TRAINER = { S, start: startSeries, series: () => series, type: (v) => { typed = String(v); check(); } };
})();
