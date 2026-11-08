/* Виртуален соробан – интерфейс на прототипа (abacus.html) за Експеримент A: може ли детето да учи само с AI треньора.
   Режими (?mode=...):
     free      – Свободно: детето показва числа.
     simple / brothers – единични задачи по правило; живо следене на пътя → подсказка; оценка на техниката (ABACUS_ENGINE.judge).
     chain-simple / chain-brothers – вериги от 2–3 действия на видим абакус (всяко действие се оценява поотделно).
     flash     – Разпознаване: абакус за миг → детето въвежда числото. Времето се нагажда (по-кратко при успехи, по-дълго при грешка).
     memory    – Възпроизвеждане по памет: абакус за миг, после празен → детето го нарежда → „Готово“.
     mental-simple / mental-brothers – Мислено проследяване: началото за миг, после абакусът е скрит и действията идват едно по едно;
                 накрая детето НАРЕЖДА топчетата (не казва число) → „Готово“. Това доказва проследяване наум, не само верен отговор.
   Отделно мерим: точност (верен резултат), методика (правилни движения), самостоятелност (без подсказка и без човешка помощ).
   Бутонът „Помогнах“ (горе вдясно) е за наблюдаващия учител – записва всяка човешка намеса.
   Данни за теста: localStorage ma.proto.v1 (всяко събитие); ma.seen.v1 – показаните задачи (предпочитаме нови).
   Гласът засега е синтез на устройството (bg-BG, ако го има); ?voice=0 изключва. */
(function () {
  const E = window.ABACUS_ENGINE, T = window.ABACUS_TEXTS, Q = new URLSearchParams(location.search), DEBUG = Q.get("debug") === "1";
  const RODS = Math.max(1, Math.min(3, +Q.get("rods") || 1));
  const LKEY = "ma.proto.v1", SKEY = "ma.seen.v1";
  const W = 180, H = 560, BEAM = 175, X0 = 110;
  const MODES = [["free", "Свободно"], ["simple", "Просто"], ["brothers", "Братя"], ["chain-simple", "Вериги · Просто"], ["chain-brothers", "Вериги · Братя"],
    ["flash", "Разпознаване (флаш)"], ["memory", "По памет"], ["mental-simple", "Наум · Просто"], ["mental-brothers", "Наум · Братя"]];
  let st = E.make(RODS), moves = [], task = null, planM = null, hintLvl = 0, helped = 0, human = 0, busy = false, mode = "free", queue = [];
  let chain = null, flashMs = +Q.get("flash") || 2000, flashTarget = null, typed = "", awaiting = null;
  let score = { tasks: 0, acc: 0, method: 0, indep: 0, human: 0 };
  const $ = (s) => document.querySelector(s);
  const rand = () => Math.random();

  function log(ev, extra) { const o = Object.assign({ ev, t: Date.now(), mode, task: task ? `${task.start}${task.op}${task.n}` : null }, extra || {});
    try { const a = JSON.parse(localStorage.getItem(LKEY) || "[]"); a.push(o); localStorage.setItem(LKEY, JSON.stringify(a.slice(-8000))); } catch (e) {}
    if (DEBUG) { const l = $("#ab-log"); if (l) l.textContent = JSON.stringify(o) + "\n" + l.textContent; } }
  const seen = (() => { try { return new Set(JSON.parse(localStorage.getItem(SKEY) || "[]")); } catch (e) { return new Set(); } })();
  function markSeen(k) { seen.add(k); try { localStorage.setItem(SKEY, JSON.stringify([...seen].slice(-2000))); } catch (e) {} }
  let bgVoice = null; try { const pick = () => { bgVoice = (speechSynthesis.getVoices() || []).find(v => /^bg/i.test(v.lang)) || null; }; pick(); speechSynthesis.onvoiceschanged = pick; } catch (e) {}
  // глас: записан файл за изречението (config/abacus-audio.json), иначе синтез на устройството
  let AUD = {}, cur = null; fetch("config/abacus-audio.json?v=1").then(r => r.ok ? r.json() : []).then(a => { a.forEach(x => { AUD[x.t] = x.f; }); }).catch(() => {});
  function say(text, cls) { const s = $("#ab-say"); s.textContent = text || ""; s.className = "ab-say " + (cls || "info");
    if (!text || Q.get("voice") === "0") return;
    try { if (cur) { cur.pause(); cur = null; } speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    if (AUD[text]) { cur = new Audio("assets/audio/abacus/" + AUD[text]); cur.play().catch(() => {}); log("voice", { f: AUD[text] }); return; }
    try { if (bgVoice) { const u = new SpeechSynthesisUtterance(text); u.voice = bgVoice; u.lang = bgVoice.lang; u.rate = 0.95; speechSynthesis.speak(u); } } catch (e) {} }
  let gen = 0;   // сменя се при всяка смяна на режима – закъснели таймери и await от стария режим спират
  const wait = (ms) => { const g = gen; return new Promise((r, rej) => setTimeout(() => g === gen ? r() : rej("stale"), ms)); };
  const later = (fn, ms) => { const g = gen; setTimeout(() => { if (g === gen) fn(); }, ms); };
  const opTxt = (o) => (o.op === "+" ? "+ " : "− ") + o.n;
  const opSay = (o) => (o.op === "+" ? "плюс " : "минус ") + o.n;

  // ---- рисуване ----
  const beadPath = (cx, cy, w, h) => `M${cx - w / 2} ${cy} L${cx - w / 4} ${cy - h / 2} L${cx + w / 4} ${cy - h / 2} L${cx + w / 2} ${cy} L${cx + w / 4} ${cy + h / 2} L${cx - w / 4} ${cy + h / 2} Z`;
  const eY = (k, e) => k <= e ? BEAM + 32 + (k - 1) * 62 : H - 40 - (4 - k) * 62;
  const hY = (h) => h ? BEAM - 34 : 52;
  function draw() {
    const wTot = X0 * 2 + (RODS - 1) * W;
    let s = `<svg viewBox="0 0 ${wTot} ${H + 70}" role="img" aria-label="Соробан"><g id="ab-body"><rect x="8" y="8" width="${wTot - 16}" height="${H - 16}" rx="26" fill="#FBF3E4" stroke="var(--wood)" stroke-width="16"/>`;
    for (let i = 0; i < RODS; i++) { const x = X0 + E.col(i, RODS) * W; s += `<line x1="${x}" y1="20" x2="${x}" y2="${H - 20}" stroke="var(--rod)" stroke-width="8"/>`; }
    s += `<rect x="16" y="${BEAM - 6}" width="${wTot - 32}" height="14" fill="var(--wood-d)"/>`;
    for (let i = 0; i < RODS; i++) { const x = X0 + E.col(i, RODS) * W; s += `<circle cx="${x}" cy="${BEAM + 1}" r="5" fill="#FBF3E4"/>`; }
    for (let i = 0; i < RODS; i++) {
      const x = X0 + E.col(i, RODS) * W;
      s += `<g class="ab-bead" data-rod="${i}" data-bead="h"><path class="b" d="${beadPath(0, 0, 130, 56)}"/></g>`;
      for (let k = 1; k <= 4; k++) s += `<g class="ab-bead" data-rod="${i}" data-bead="e" data-k="${k}"><path class="b" d="${beadPath(0, 0, 130, 56)}"/></g>`;
    }
    s += `</g><text id="ab-hidden" x="${wTot / 2}" y="${H / 2 + 30}" text-anchor="middle" style="font:900 120px Nunito,sans-serif;fill:#D9C6A3;display:none">?</text>`;
    s += `<g id="ab-nums">${Array.from({ length: RODS }, (_, i) => `<text class="ab-num" x="${X0 + E.col(i, RODS) * W}" y="${H + 50}" text-anchor="middle">0</text>`).join("")}</g></svg>`;
    $("#ab-board").innerHTML = s;
    $("#ab-board").querySelectorAll(".ab-bead").forEach(g => g.addEventListener("pointerdown", ev => { ev.preventDefault(); tap(g); }));
    update(); applyView();
  }
  let pendingMove = null;   // онлайн занятие: всяка промяна на абакуса (с движението, ако е от детето) отива при учителя – js/live/child.js
  function update() {
    try { if (window.ABACUS_HOOK) setTimeout(((m) => () => window.ABACUS_HOOK(m))(pendingMove), 0); } catch (e) {} pendingMove = null;
    $("#ab-board").querySelectorAll(".ab-bead").forEach(g => {
      const i = +g.dataset.rod, r = st[i], x = X0 + E.col(i, RODS) * W, p = g.querySelector(".b");
      if (g.dataset.bead === "h") { g.style.transform = `translate(${x}px,${hY(r.h)}px)`; p.setAttribute("fill", r.h ? "var(--heaven-on)" : "var(--heaven)"); }
      else { const k = +g.dataset.k; g.style.transform = `translate(${x}px,${eY(k, r.e)}px)`; p.setAttribute("fill", k <= r.e ? "var(--bead-on)" : "var(--bead)"); }
    });
    $("#ab-nums").querySelectorAll("text").forEach((t, j) => { t.textContent = E.rodVal(st[j]); });   // надпис j стои под пръчка j
  }
  let hidden = false;
  function applyView() {   // видимост: избраната опора + скриване в режимите за памет/наум
    const body = $("#ab-body"); if (!body) return;
    body.style.opacity = hidden ? 0 : $("#ab-fade").value; body.style.pointerEvents = hidden ? "none" : "";
    $("#ab-hidden").style.display = hidden ? "" : "none";
    $("#ab-board").style.display = hidden && mode === "flash" ? "none" : "";   // при отговора – място за клавиатурата
    const numsOn = $("#ab-shownum").checked && !hidden && !["flash", "memory", "mental-simple", "mental-brothers"].includes(mode);
    $("#ab-nums").style.display = numsOn ? "" : "none";
  }
  const setHidden = (h) => { hidden = h; applyView(); };

  // ---- взаимодействие с топчетата ----
  function tap(g) {
    if (busy || hidden) return;
    const m = E.tapMove(st, +g.dataset.rod, g.dataset.bead, +g.dataset.k || 0), ns = E.apply(st, m); if (!ns) return;
    st = ns; moves.push(m); pendingMove = m; update(); log("move", { m, value: E.value(st) });
    if (mode === "free") { say(T.number(E.value(st)), "info"); return; }
    if (awaiting) return;   // памет/наум: чакаме „Готово“
    if (!task) return;
    const target = task.op === "+" ? task.start + task.n : task.start - task.n;
    if (E.value(st) === target) return finishStep();
    if (!E.consistent(planM, moves)) { hintLvl = Math.max(hintLvl, 1); helped++; say(E.hints(task)[0], "hint"); log("deviate"); }
  }
  function record(acc, method, extra) {   // три отделни измерения на всяка задача
    const indep = !helped && !human;
    score.tasks++; if (acc) score.acc++; if (acc && method) score.method++; if (acc && method && indep) score.indep++; stats();
    log("result", Object.assign({ acc, method, indep, helped, human }, extra || {}));
  }
  function finishStep() {
    const j = E.judge(task, moves); log("judge", j);
    if (j.code !== "ok") { say(E.FEEDBACK[j.code] || E.FEEDBACK.wrong_value, "hint"); if (!chain) record(j.correct, false, { code: j.code, rule: j.rule }); else chain.ok = false; return; }
    if (chain && chain.i < chain.steps.length - 1) { chain.i++; say(T.chainNext(chain.steps[chain.i].op, chain.steps[chain.i].n), "ok"); beginStep(); return; }
    if (chain) record(true, chain.ok !== false, { chain: chain.key }); else record(true, true, { rule: j.rule, oneByOne: j.oneByOne });
    say(j.oneByOne ? T.okTogether : T.ok, "ok");
    busy = true; later(() => { busy = false; next(); }, 1500);
  }
  function beginStep() {   // текущото действие (единична задача или стъпка от верига)
    const v = E.value(st), s = chain ? chain.steps[chain.i] : null;
    if (s) task = { start: v, op: s.op, n: s.n, rods: RODS };
    planM = E.plan(task.start, task.op, task.n, RODS).moves; moves = []; hintLvl = 0;
    if (chain) $("#ab-task").innerHTML = chain.start + " " + chain.steps.map((x, i) => `<span style="${i === chain.i ? "color:var(--bead-on)" : i < chain.i ? "color:#B9AE9C" : ""}">${opTxt(x)}</span>`).join(" ") + ' <span class="q">= ?</span>';
  }

  // ---- режими ----
  function pickSingle(rule) {
    if (!queue.length) queue = E.tasksFor(rule, 40);
    let i = queue.findIndex(t => !seen.has(`${t.start}${t.op}${t.n}`)); if (i < 0) i = 0;
    const t = queue.splice(i, 1)[0]; if (t) markSeen(`${t.start}${t.op}${t.n}`); return t;
  }
  function startSingle(rule) {
    const t = pickSingle(rule); if (!t) return say("Няма задачи за това правило.");
    chain = null; task = t; st = E.fromValue(t.start, RODS); helped = 0; human = 0; setHidden(false); update(); beginStep();
    $("#ab-task").innerHTML = `${t.start} ${t.op === "+" ? "+" : "−"} ${t.n} <span class="q">= ?</span>`;
    say(T.start(t.start, t.op, t.n)); log("task", { rule });
  }
  function startChain(brothers) {
    const len = 2 + (rand() < 0.5 ? 1 : 0);
    let c = null; for (let k = 0; k < 20 && !c; k++) { const x = E.chain(brothers ? ["Просто", "Братя"] : ["Просто"], len, rand, brothers ? "Братя" : null); if (x && (!seen.has(chainKey(x)) || k > 15)) c = x; }
    if (!c) return say("Няма вериги за това правило.");
    chain = Object.assign(c, { i: 0, key: chainKey(c) }); markSeen(chain.key);
    st = E.fromValue(c.start, RODS); helped = 0; human = 0; setHidden(false); update(); beginStep();
    say(T.chainStart(c.start, c.steps[0].op, c.steps[0].n)); log("chain", { key: chain.key });
  }
  const chainKey = (c) => c.start + c.steps.map(opTxt).join("").replace(/\s/g, "");
  async function startFlash() {
    chain = null; task = null; helped = 0; human = 0; awaiting = null; typed = ""; pad(true);
    const max = Math.pow(10, RODS) - 1; flashTarget = Math.floor(rand() * (max + 1));
    st = E.fromValue(flashTarget, RODS); update(); setHidden(false);
    $("#ab-task").textContent = "Какво число видя?"; say(T.look); busy = true; log("flash", { n: flashTarget, ms: flashMs });
    await wait(flashMs); setHidden(true); busy = false; say(T.whatNumber); showTyped();
  }
  function flashAnswer() {
    if (typed === "") return;
    const ok = +typed === flashTarget; record(ok, true, { flash: flashTarget, ms: flashMs, typed: +typed });
    flashMs = Math.round(Math.max(300, Math.min(4000, ok ? flashMs * 0.88 : flashMs * 1.15)));
    setHidden(false); say(ok ? T.ok : T.flashWrong(flashTarget), ok ? "ok" : "hint");
    busy = true; later(() => { busy = false; startFlash().catch(() => {}); }, ok ? 1300 : 2600);
  }
  async function startMemory() {
    chain = null; task = null; helped = 0; human = 0; pad(false);
    const max = Math.pow(10, RODS) - 1; flashTarget = Math.floor(rand() * (max + 1));
    st = E.fromValue(flashTarget, RODS); update(); setHidden(false); awaiting = null;
    $("#ab-task").textContent = "Запомни топчетата"; say(T.lookRemember); busy = true; log("memory", { n: flashTarget, ms: flashMs });
    await wait(flashMs); setHidden(true); await wait(700);
    st = E.make(RODS); moves = []; update(); setHidden(false); busy = false; awaiting = "memory";
    $("#ab-task").textContent = "Нареди ги отново"; say(T.rebuild);
  }
  async function startMental(brothers) {
    pad(false); helped = 0; human = 0; task = null;
    let c = null; for (let k = 0; k < 20 && !c; k++) { const x = E.chain(brothers ? ["Просто", "Братя"] : ["Просто"], 2 + (rand() < 0.5 ? 1 : 0), rand, brothers ? "Братя" : null); if (x && (!seen.has("m" + chainKey(x)) || k > 15)) c = x; }
    chain = null; flashTarget = c.end; markSeen("m" + chainKey(c)); awaiting = null;
    st = E.fromValue(c.start, RODS); update(); setHidden(false); busy = true; log("mental", { key: chainKey(c) });
    $("#ab-task").textContent = String(c.start); say(T.remember(c.start)); await wait(Math.max(1500, flashMs));
    setHidden(true);
    for (const x of c.steps) { $("#ab-task").textContent = opTxt(x); say(T.op(x.op, x.n)); await wait(2400); }
    $("#ab-task").textContent = "Нареди отговора"; st = E.make(RODS); moves = []; update(); setHidden(false); busy = false; awaiting = "mental";
    say(T.mentalBuild);
  }
  function done() {
    if (!awaiting) return; const kind = awaiting, ok = E.value(st) === flashTarget; awaiting = null;
    record(ok, true, { kind, target: flashTarget, got: E.value(st) });
    if (ok) say(T.ok, "ok");
    else { say(T.showWrong(flashTarget), "hint"); st = E.fromValue(flashTarget, RODS); update(); }
    busy = true; later(() => { busy = false; next(); }, ok ? 1500 : 3000);
  }
  function next() {
    pad(false); awaiting = null; flashTarget = null;
    if (mode === "simple") return startSingle("Просто"); if (mode === "brothers") return startSingle("Братя");
    if (mode === "chain-simple") return startChain(false); if (mode === "chain-brothers") return startChain(true);
    if (mode === "flash") return startFlash().catch(() => {}); if (mode === "memory") return startMemory().catch(() => {});
    if (mode === "mental-simple") return startMental(false).catch(() => {}); if (mode === "mental-brothers") return startMental(true).catch(() => {});
  }
  // ---- клавиатура за разпознаването ----
  function pad(on) { $("#ab-pad").hidden = !on; $("#ab-done").hidden = !(mode === "memory" || mode.startsWith("mental")); }
  function showTyped() { $("#ab-typed").textContent = typed === "" ? "…" : typed; }
  // ---- помощ ----
  function hint() { if (!task || mode === "free") return; const hs = E.hints(task); helped++; say(hs[Math.min(hintLvl, hs.length - 1)], "hint"); hintLvl++; log("hint", { lvl: hintLvl }); }
  function demo() {
    if (!task || busy || mode === "free") return; busy = true; helped++; log("demo");
    const start = task.start; st = E.fromValue(start, RODS); moves = []; update(); const steps = planM.slice();
    say(T.demo(steps), "hint");
    let i = 0; (function step() { if (i >= steps.length) { setTimeout(() => { st = E.fromValue(start, RODS); moves = []; update(); busy = false; say(T.now); }, 1200); return; }
      st = E.apply(st, steps[i]); update(); const g = [...document.querySelectorAll(`.ab-bead[data-rod="${steps[i].rod}"][data-bead="${steps[i].bead}"]`)]; g.forEach(x => x.classList.add("demo")); setTimeout(() => g.forEach(x => x.classList.remove("demo")), 700); i++; setTimeout(step, 1100); })();
  }
  function reset() {
    if (mode === "free") { st = E.make(RODS); moves = []; update(); say(T.number(0)); return; }
    if (awaiting) { st = E.make(RODS); moves = []; update(); return; }
    if (task) { st = E.fromValue(task.start, RODS); moves = []; update(); log("reset"); }
  }
  function humanHelp() { human++; score.human++; stats(); log("human_help"); const b = $("#ab-human"); b.classList.add("on"); setTimeout(() => b.classList.remove("on"), 400); }
  function stats() { $("#ab-stats").textContent = mode === "free" ? "" : `Задачи: ${score.tasks} · верни: ${score.acc} · с правилна техника: ${score.method} · сами (без подсказка и помощ): ${score.indep} · помощ от учител: ${score.human}`; }
  function setMode(m) {
    gen++; busy = false; mode = m; queue = []; chain = null; task = null; awaiting = null; score = { tasks: 0, acc: 0, method: 0, indep: 0, human: 0 }; $("#ab-mode").value = m; stats();
    const single = ["simple", "brothers", "chain-simple", "chain-brothers"].includes(m);
    ["#ab-hint", "#ab-demo"].forEach(s => $(s).disabled = !single);
    $("#ab-next").disabled = m === "free"; pad(false);
    if (m === "free") { $("#ab-task").textContent = "Покажи число"; st = E.make(RODS); moves = []; setHidden(false); update(); say(T.free); }
    else next();
    applyView(); log("mode", { m });
  }

  // ---- начало ----
  document.body.innerHTML = `<div class="ab-app">
    <div class="ab-top"><select id="ab-mode" aria-label="Режим">${MODES.map(m => `<option value="${m[0]}">${m[1]}</option>`).join("")}</select>
      <label class="ab-fade">Абакус <select id="ab-fade" aria-label="Видимост"><option value="1">видим</option><option value=".45">полупрозрачен</option><option value=".12">едва видим</option></select></label>
      <label class="ab-fade"><input type="checkbox" id="ab-shownum" checked> числата</label>
      <button class="ab-human" id="ab-human" title="За наблюдаващия учител">👩‍🏫 Помогнах</button></div>
    <div class="ab-task" id="ab-task"></div>
    <div class="ab-say info" id="ab-say" aria-live="polite"></div>
    <div class="ab-board" id="ab-board"></div>
    <div class="ab-pad" id="ab-pad" hidden><div class="ab-typed" id="ab-typed">…</div>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button class="ab-key" data-d="${d}">${d}</button>`).join("")}<button class="ab-key" data-d="back">⌫</button><button class="ab-key ok" data-d="ok">✓</button></div>
    <div class="ab-row"><button class="ab-btn" id="ab-reset">↺ Отначало</button><button class="ab-btn" id="ab-hint">💡 Подсказка</button><button class="ab-btn" id="ab-demo">▶ Покажи ми</button><button class="ab-btn primary" id="ab-done" hidden>✓ Готово</button><button class="ab-btn" id="ab-next">Следваща →</button></div>
    <div class="ab-stats" id="ab-stats"></div>${DEBUG ? '<div class="ab-log" id="ab-log"></div>' : ""}</div>`;
  draw();
  $("#ab-mode").addEventListener("change", e => setMode(e.target.value));
  $("#ab-fade").addEventListener("change", e => { applyView(); log("fade", { v: e.target.value }); });
  $("#ab-shownum").addEventListener("change", applyView);
  $("#ab-reset").addEventListener("click", reset); $("#ab-hint").addEventListener("click", hint); $("#ab-demo").addEventListener("click", demo);
  $("#ab-next").addEventListener("click", () => { if (busy) return; log("skip"); next(); });
  $("#ab-done").addEventListener("click", done); $("#ab-human").addEventListener("click", humanHelp);
  $("#ab-pad").addEventListener("click", e => { const d = e.target.dataset && e.target.dataset.d; if (d == null || busy) return;
    if (d === "back") typed = typed.slice(0, -1); else if (d === "ok") return flashAnswer(); else if (typed.length < RODS) typed += d; showTyped(); });
  const M = Q.get("mode"); setMode(MODES.some(m => m[0] === M) ? M : "free");
  window.ABACUS_UI = { state: () => st, task: () => task, chain: () => chain, say: () => $("#ab-say").textContent, setMode, score: () => score, target: () => flashTarget,
    tap: (rod, bead, k) => { const g = document.querySelector(`.ab-bead[data-rod="${rod}"][data-bead="${bead}"]${bead === "e" ? `[data-k="${k}"]` : ""}`); if (g) tap(g); },
    type: (s) => { typed = String(s); showTyped(); flashAnswer(); }, set: (v) => { st = E.fromValue(v, RODS); update(); }, done, humanHelp };
})();
