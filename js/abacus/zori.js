/* Зори показва движенията върху ТОЧЕН соробан (zori-demo.html).
   Математиката и последователността на движенията идват само от двигателя (engine.js → plan/judge); абакусът се рисува от кода;
   Зори е картинка; движението се показва със светещи топчета и стрелка (посока и брой). Нищо математическо не се генерира от AI.
   Техниката на пръстите (палец вдига, показалец сваля, щипка, двете ръце едновременно) е същата и на дигиталния абакус – показва я учителят, а за AI тутора – видеа с истински ръце.
   Четири урока: 1 палецът вдига, 2 показалецът сваля, 3 двете ръце (двуцифрено), 4 брат и поправка на грешен опит. След всяка демонстрация детето опитва само. */
(function () {
  const E = window.ABACUS_ENGINE, Q = new URLSearchParams(location.search);
  const RODS = 2, W = 220, X0 = 150, H = 640, BEAM = 210;
  const eY = (k, e) => k <= e ? BEAM + 36 + (k - 1) * 66 : H - 44 - (4 - k) * 66;
  const hY = (h) => h ? BEAM - 38 : 60;
  const BW = 150, BH = 60;                                   // размер на топчето
  const xOf = (rod) => X0 + E.col(rod, RODS) * W;
  // ръцете: къде е върхът на пръста в картинката (px от горе-ляво при височина 400)
  const POSE = { explain: "z_explain", point: "z_point", wait: "z_wait", joy: "z_joy" };

  const $ = (s) => document.querySelector(s);
  document.body.innerHTML = `<div class="zd-app">
    <header class="zd-top"><div class="zd-title">Зори показва</div>
      <nav class="zd-lessons">${["1 · Палецът вдига", "2 · Показалецът сваля", "3 · Двете ръце", "4 · Брат и поправка"].map((t, i) => `<button data-l="${i + 1}">${t}</button>`).join("")}</nav></header>
    <main class="zd-stage">
      <div class="zd-zori"><img id="zd-pose" src="assets/img/zori/z_explain.png" alt="Зори"><div class="zd-bubble" id="zd-say">Избери урок.</div></div>
      <div class="zd-board" id="zd-board"></div>
    </main>
    <div class="zd-row"><div class="zd-task" id="zd-task"></div><button id="zd-demo">▶ Покажи ми</button><button id="zd-again">↺ Отначало</button></div>
    <div class="zd-fx" id="zd-fx"></div></div>`;

  // ---- соробанът ----
  let st = E.make(RODS);
  const beadPath = (w, h) => `M${-w / 2} 0 L${-w / 4} ${-h / 2} L${w / 4} ${-h / 2} L${w / 2} 0 L${w / 4} ${h / 2} L${-w / 4} ${h / 2} Z`;
  function draw() {
    const wTot = X0 * 2 + (RODS - 1) * W;
    let s = `<svg viewBox="0 0 ${wTot + 70} ${H + 60}" id="zd-svg"><rect x="10" y="10" width="${wTot - 20}" height="${H - 20}" rx="28" fill="#1E2350" stroke="#B88A4E" stroke-width="18"/>`;
    for (let i = 0; i < RODS; i++) s += `<line x1="${xOf(i)}" y1="24" x2="${xOf(i)}" y2="${H - 24}" stroke="#8D6A3E" stroke-width="9"/>`;
    s += `<rect x="20" y="${BEAM - 7}" width="${wTot - 40}" height="16" fill="#B88A4E"/>`;
    for (let i = 0; i < RODS; i++) {
      s += `<g class="zd-bead" data-rod="${i}" data-b="h"><path d="${beadPath(BW, BH)}"/></g>`;
      for (let k = 1; k <= 4; k++) s += `<g class="zd-bead" data-rod="${i}" data-b="e" data-k="${k}"><path d="${beadPath(BW, BH)}"/></g>`;
      s += `<text class="zd-num" x="${xOf(i)}" y="${H + 46}" text-anchor="middle" data-rod="${i}">0</text>`;
    }
    $("#zd-board").innerHTML = s + "</svg>";
    $("#zd-board").querySelectorAll(".zd-bead").forEach(g => g.addEventListener("pointerdown", (ev) => { ev.preventDefault(); childTap(g); }));
    update();
  }
  function update() {
    $("#zd-board").querySelectorAll(".zd-bead").forEach(g => {
      const i = +g.dataset.rod, r = st[i], p = g.querySelector("path");
      if (g.dataset.b === "h") { g.style.transform = `translate(${xOf(i)}px,${hY(r.h)}px)`; p.setAttribute("class", r.h ? "on h" : "off"); }
      else { const k = +g.dataset.k; g.style.transform = `translate(${xOf(i)}px,${eY(k, r.e)}px)`; p.setAttribute("class", k <= r.e ? "on" : "off"); }
    });
    $("#zd-board").querySelectorAll(".zd-num").forEach(t => { t.textContent = E.rodVal(st[+t.dataset.rod]); });
  }
  // точка от координатите на абакуса (viewBox) → пиксели в страницата
  function pt(x, y) {
    const svg = $("#zd-svg"), m = svg.getScreenCTM(), p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(m);
    return { x: q.x + scrollX, y: q.y + scrollY, s: m.a };
  }

  // ---- глас и поза ----
  let AUD = {}; fetch("config/abacus-audio.json?v=2").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUD[x.t] = x.f; })).catch(() => {});
  let bgVoice = null; try { const pick = () => { bgVoice = (speechSynthesis.getVoices() || []).find(v => /^bg/i.test(v.lang)) || null; }; pick(); speechSynthesis.onvoiceschanged = pick; } catch (e) {}
  let cur = null;
  function say(text, pose) {
    $("#zd-say").textContent = text; if (pose) $("#zd-pose").src = `assets/img/zori/${POSE[pose]}.png`;
    if (Q.get("voice") === "0") return;
    try { if (cur) cur.pause(); speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    if (AUD[text]) { cur = new Audio("assets/audio/abacus/" + AUD[text]); cur.play().catch(() => {}); return; }
    try { if (bgVoice) { const u = new SpeechSynthesisUtterance(text); u.voice = bgVoice; u.lang = bgVoice.lang; u.rate = .95; speechSynthesis.speak(u); } } catch (e) {}
  }
  let gen = 0;
  const wait = (ms) => { const g = gen; return new Promise((res, rej) => setTimeout(() => g === gen ? res() : rej("stale"), ms)); };

  // ---- показване на движението: кои топчета (светят) и накъде (стрелка с броя). Без нарисувана ръка –
  //      техниката на пръстите (палец, показалец, щипка, двете ръце) ще се показва с видеа с истински ръце (за AI тутора) и от учителя ----
  function movingBeads(m) {
    const r = st[m.rod];
    if (m.bead === "h") return [{ b: "h", k: 0 }];
    const ks = []; if (m.d > 0) for (let k = r.e + 1; k <= r.e + m.d; k++) ks.push(k); else for (let k = r.e + m.d + 1; k <= r.e; k++) ks.push(k);
    return ks.map(k => ({ b: "e", k }));
  }
  function arrow(m) {
    const r = st[m.rod], x = xOf(m.rod) + BW / 2 + 26, ks = movingBeads(m);
    let y0, y1;
    if (m.bead === "h") { y0 = hY(r.h); y1 = hY(1 - r.h); }
    else { const mid = (e) => ks.reduce((a, o) => a + eY(o.k, e), 0) / ks.length; y0 = mid(r.e); y1 = mid(r.e + m.d); }
    const dir = Math.sign(y1 - y0), tip = y1 + dir * 6, g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "zd-arrow");
    g.innerHTML = `<line x1="${x}" y1="${y0}" x2="${x}" y2="${tip - dir * 18}" /><path d="M${x - 16} ${tip - dir * 22} L${x + 16} ${tip - dir * 22} L${x} ${tip} Z"/>` +
      `<text x="${x + 22}" y="${(y0 + y1) / 2 + 12}">${m.d > 0 ? "+" : "−"}${Math.abs(m.d)}</text>`;
    $("#zd-svg").appendChild(g); return g;
  }
  const beadEl = (rod, o) => $(`#zd-board .zd-bead[data-rod="${rod}"][data-b="${o.b}"]` + (o.b === "e" ? `[data-k="${o.k}"]` : ""));
  // едно или няколко едновременни движения (двете ръце): топчетата светват, стрелка показва посоката, после се местят
  async function perform(ms, ghost) {
    const marks = ms.map(m => { const els = movingBeads(m).map(o => beadEl(m.rod, o)); els.forEach(e => e.classList.add(ghost ? "try" : "go")); return { m, els, a: arrow(m) }; });
    await wait(900);
    marks.forEach(x => { st = E.apply(st, x.m) || st; }); update();
    await wait(650); marks.forEach(x => { x.a.remove(); x.els.forEach(e => e.classList.remove("go", "try")); }); await wait(150);
  }
  // светлинката: тръгва от върха на главата на Зори и посочва топче
  async function spark(m) {
    const img = $("#zd-pose").getBoundingClientRect(), from = { x: img.left + img.width * 0.55 + scrollX, y: img.top + img.height * 0.02 + scrollY };
    const x = xOf(m.rod), r = st[m.rod], y = m.bead === "h" ? hY(r.h) : eY(m.d > 0 ? r.e + 1 : r.e, r.e), to = pt(x, y);
    const s = document.createElement("div"); s.className = "zd-spark"; s.style.transform = `translate(${from.x}px,${from.y}px)`; $("#zd-fx").appendChild(s);
    await wait(40); s.style.transform = `translate(${to.x}px,${to.y}px)`; await wait(900); s.classList.add("pulse"); await wait(1100); s.remove();
  }

  // ---- уроците ----
  const NUM = (n) => String(n);
  const L = {
    1: { start: 0, demo: [[{ rod: 0, bead: "e", d: 3 }]], text: ["Палецът вдига долните топчета.", "Гледай: плюс три."], tryTask: { start: 1, op: "+", n: 2 } },
    2: { start: 4, demo: [[{ rod: 0, bead: "e", d: -3 }]], text: ["Показалецът сваля долните топчета.", "Гледай: минус три."], tryTask: { start: 3, op: "-", n: 2 } },
    3: { start: 0, demo: [[{ rod: 1, bead: "e", d: 2 }, { rod: 0, bead: "e", d: 2 }]], text: ["Двете ръце работят заедно: лявата смята десетиците, дясната – единиците.", "Гледай: плюс двадесет и две."], tryTask: { start: 0, op: "+", n: 11 } },
    4: { start: 3, wrong: { rod: 0, bead: "e", d: 1 }, text: ["Имаме три. Добави четири."], tryTask: { start: 2, op: "+", n: 3 } }
  };
  let lesson = 0, task = null, tries = [];
  function setTask(t) { task = t; tries = []; st = E.fromValue(t.start, RODS); update(); $("#zd-task").textContent = `${t.start} ${t.op === "+" ? "+" : "−"} ${t.n} = ?`; }
  async function run(n) {
    gen++; lesson = n; const l = L[n]; document.querySelectorAll(".zd-lessons button").forEach(b => b.classList.toggle("on", +b.dataset.l === n));
    try {
      st = E.fromValue(l.start, RODS); update(); task = null; $("#zd-task").textContent = "";
      if (n === 4) return await runBrother(l);
      say(l.text[0], "explain"); await wait(2600);
      say(l.text[1], "point"); await wait(1400);
      for (const step of l.demo) await perform(step);
      await wait(500); await childTurn(l.tryTask);
    } catch (e) { if (e !== "stale") throw e; }
  }
  // урок 4: „детето“ опитва грешно (+1 и не стига), Зори спира, светлинката сочи небесното топче, после показва брата
  async function runBrother(l) {
    say(l.text[0], "explain"); $("#zd-task").textContent = "3 + 4 = ?"; await wait(1800);
    await perform([l.wrong], true);
    say("Почакай! Долу няма достатъчно топчета.", "wait"); await wait(2400);
    st = E.fromValue(3, RODS); update(); await wait(300);
    const p = E.plan(3, "+", 4, RODS);
    say("Помогни си с брат: плюс четири е плюс пет, минус едно.", "point"); await spark(p.moves[0]);
    for (const m of p.moves) await perform([m]);
    say("Браво! Три и четири прави седем.", "joy"); await wait(2200);
    await childTurn(l.tryTask);
  }
  async function childTurn(t) { setTask(t); say(`Сега ти! Имаме ${t.start}. ${t.op === "+" ? "Добави" : "Махни"} ${NUM(t.n)}.`, "explain"); }
  async function childTap(g) {
    if (!task) return;
    const m = E.tapMove(st, +g.dataset.rod, g.dataset.b, +g.dataset.k || 0), ns = E.apply(st, m); if (!ns) return;
    st = ns; tries.push(m); update();
    const target = task.op === "+" ? task.start + task.n : task.start - task.n, v = E.value(st);
    const p = E.plan(task.start, task.op, task.n, RODS);
    if (v === target) {
      const j = E.judge(Object.assign({ rods: RODS }, task), tries);
      if (j.code === "ok") { say("Браво! Точно така.", "joy"); task = null; return; }
      return correct(j.code);
    }
    // грешна посока още при първото движение: Зори спира веднага и сочи правилното топче
    if (!E.consistent(p.moves, tries)) return correct("wrong_value");
  }
  async function correct(code) {
    gen++; const t = task; say(E.FEEDBACK[code] || "Почти! Нека опитаме пак.", "wait");
    try { await wait(2200); st = E.fromValue(t.start, RODS); tries = []; update(); const p = E.plan(t.start, t.op, t.n, RODS); $("#zd-pose").src = "assets/img/zori/z_point.png"; await spark(p.moves[0]); say("Опитай пак – започни оттук.", "explain"); }
    catch (e) { if (e !== "stale") throw e; }
  }
  async function demoCurrent() {
    if (!task) return run(lesson || 1); gen++; const t = task; task = null;
    try { st = E.fromValue(t.start, RODS); update(); const p = E.plan(t.start, t.op, t.n, RODS); say("Гледай!", "point"); await wait(700);
      for (const m of p.moves) await perform([m]); await wait(600); setTask(t); say("Сега ти!", "explain"); }
    catch (e) { if (e !== "stale") throw e; }
  }
  draw();
  document.querySelectorAll(".zd-lessons button").forEach(b => b.addEventListener("click", () => run(+b.dataset.l)));
  $("#zd-demo").addEventListener("click", demoCurrent);
  $("#zd-again").addEventListener("click", () => run(lesson || 1));
  window.ZORI_DEMO = { run, state: () => st, task: () => task, tap: (rod, b, k) => childTap({ dataset: { rod, b, k } }) };
  if (Q.get("l")) run(+Q.get("l"));
})();
