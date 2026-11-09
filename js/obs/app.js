/* Звездна обсерватория – прототип на отделното приложение за ментална аритметика (observatory.html).
   Екрани: профил → обсерватория → звездна карта (област „Аврора“ = модул „Просто“) → мисия (5 етапа) → откритие.
   Математиката: engine.js (примерите от конспектите – examples.js; проверка на движенията – judgeChain). Зори – картинки и запис на гласа.
   Напредъкът на прототипа се пази в localStorage (по профил); яркост на звездата 0–3 + ореол („без телескоп“). */
(function () {
  const E = window.ABACUS_ENGINE, EX = window.OBS_EXAMPLES || {}, Q = new URLSearchParams(location.search);
  const $ = (s, r) => (r || document).querySelector(s);
  const app = document.getElementById("obs");

  // ---- небето: област „Аврора“ (модул „Просто“) – 3 съзвездия, 21 звезди (= занятията) ----
  const CONST = [
    { id: "A", name: "Първи светлини", sub: "числата 0–9", stars: [
      [1, "0, 1, 2", 110, 430], [2, "Числото 3", 170, 360], [3, "Числото 4", 245, 400], [4, "Числото 5", 300, 320], [5, "Щипката · 6", 380, 350],
      [6, "Числото 7", 430, 270], [7, "Числото 8", 360, 210], [8, "Числото 9", 280, 230], [9, "Звездна нощ", 210, 160, 1]] },
    { id: "B", name: "Двете ръце", sub: "до 99", stars: [
      [10, "Кръгли десетици", 560, 420], [11, "11–19", 620, 360], [12, "Огледални", 690, 395], [13, "До 44", 735, 320],
      [14, "До 55", 690, 250], [15, "Двойна щипка", 760, 190], [16, "До 99", 840, 240], [17, "Звездна нощ", 880, 150, 1]] },
    { id: "C", name: "Далечни звезди", sub: "до 999 · по желание", stars: [
      [18, "Стотиците", 860, 470], [19, "До 555", 920, 410], [20, "До 999", 960, 340], [21, "Звездна нощ", 975, 270, 1]] }
  ];
  const STAR = {}; CONST.forEach(c => c.stars.forEach(s => { STAR[s[0]] = { n: s[0], title: s[1], x: s[2], y: s[3], big: !!s[4], c: c.id }; }));
  const LINES = { A: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]], B: [[10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17]], C: [[18, 19], [19, 20], [20, 21]] };
  const FAR = [["Орион", "Братя", 1140, 120], ["Плеяди", "Приятели", 1250, 330], ["Вега", "Преход", 1200, 560], ["Андромеда", "Приятели и братя", 1340, 450], ["Поларис", "наум", 1360, 110]];
  // параметри на мисията по занятие (от картата на модула): скорост на абакуса, на флашкартите, на въображаемия
  const PAR = { 1: [2.5, 1.8, 2.5], 2: [2.0, 1.8, 2.5], 3: [2.0, 1.6, 2.0], 4: [2.0, 1.6, 2.0], 5: [2.2, 1.5, 2.0], 6: [2.0, 1.4, 2.0], 7: [2.0, 1.4, 2.0], 8: [2.0, 1.2, 2.0], 9: [1.8, 1.2, 2.0] };
  const MAXN = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 9 };

  // ---- профили (демо) ----
  const AV = ["a1", "a4", "n1", "a2", "n3", "a6"];
  const DEMO = [
    { id: "lora", name: "Лора", av: "a1", age: 5, cur: 7, b: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, halo: { 1: 1, 2: 1, 3: 1 } },
    { id: "ivo", name: "Иво", av: "a4", age: 6, cur: 2, b: { 1: 2 }, halo: {} },
    { id: "nia", name: "Ния", av: "n1", age: 5, cur: 1, b: {}, halo: {} }
  ];
  const KEY = "obs.proto.v2";
  let DB = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };
  const prof = (id) => { if (!DB[id]) { const d = DEMO.find(x => x.id === id); DB[id] = JSON.parse(JSON.stringify(d)); save(); } return DB[id]; };
  let P = null;

  // ---- глас: Зори (zr_*), иначе разказвачът (Калина) ----
  let AUDZ = {}, AUD = {}, cur = null;
  fetch("config/abacus-audio-zori.json?v=2").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUDZ[x.t] = x.f; })).catch(() => {});
  fetch("config/abacus-audio.json?v=3").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUD[x.t] = x.f; })).catch(() => {});
  function voice(text) {
    if (Q.get("voice") === "0") return;
    try { if (cur) cur.pause(); } catch (e) {}
    const f = AUDZ[text] || AUD[text]; if (f) { cur = new Audio("assets/audio/abacus/" + f); cur.play().catch(() => {}); }
  }
  let gen = 0;
  const FAST = Q.get("fast") ? 0.08 : 1;   // ?fast=1 – само за автоматичните проверки
  const wait = (ms) => { const g = gen; return new Promise((res, rej) => setTimeout(() => g === gen ? res() : rej("stale"), ms * FAST)); };
  const zori = (pose) => `<img class="o-zori" src="assets/img/zori/z_${pose}.png" alt="Зори">`;
  function say(text, pose) { const b = $(".o-say"); if (b) b.textContent = text; const z = $(".o-zori"); if (z && pose) z.src = `assets/img/zori/z_${pose}.png`; voice(text); }

  // ---- екран 1: кой наблюдава ----
  function screenProfiles() {
    gen++;
    app.className = "o-scr o-profiles"; voice("Кой наблюдава тази вечер?");
    app.innerHTML = `<div class="o-ptitle">Кой наблюдава тази вечер?</div>
      <div class="o-plist">${DEMO.map(d => { const p = DB[d.id] || d; const lit = Object.values(p.b || {}).filter(v => v >= 3).length;
        return `<button class="o-pcard" data-id="${d.id}"><img src="assets/img/world/avatars/${p.av}.webp" alt=""><b>${p.name}</b><span>★ ${lit} звезди</span></button>`; }).join("")}</div>
      <p class="o-note">Прототип · демо профили · <button class="o-link" id="o-reset">нулирай демото</button></p>`;
    app.querySelectorAll(".o-pcard").forEach(b => b.onclick = () => { P = prof(b.dataset.id); screenHome(); });
    $("#o-reset").onclick = () => { DB = {}; save(); screenProfiles(); };
  }

  // ---- небето като SVG (използва се и в прозореца на обсерваторията, и в картата) ----
  function skySVG(opts) {
    const o = opts || {}, b = P.b || {}, halo = P.halo || {};
    const open = (n) => n <= P.cur + 0 && (STAR[n].c !== "C" || (b[17] || 0) >= 3);
    let s = `<svg viewBox="${o.vb || "0 60 1440 520"}" class="o-sky" role="img" aria-label="Небето на ${P.name}">`;
    s += `<defs><radialGradient id="gl"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".45" stop-color="#F5C04A"/><stop offset="1" stop-color="#F5C04A" stop-opacity="0"/></radialGradient></defs>`;
    for (let i = 0; i < 90; i++) { const x = (i * 337) % 1440, y = 60 + (i * 211) % 520, r = (i % 3) * .5 + .6; s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${.15 + (i % 5) * .07}"/>`; }
    if (o.far) FAR.forEach(f => { s += `<g class="o-far"><circle cx="${f[2]}" cy="${f[3]}" r="5" fill="#7F86B8"/><text x="${f[2]}" y="${f[3] + 28}" text-anchor="middle">${f[0]}</text><text x="${f[2]}" y="${f[3] + 46}" text-anchor="middle" class="o-farsub">${f[1]}</text></g>`; });
    Object.entries(LINES).forEach(([c, ls]) => ls.forEach(([a, z]) => { const A = STAR[a], Z = STAR[z], lit = (b[a] || 0) >= 1 && (b[z] || 0) >= 1;
      s += `<line x1="${A.x}" y1="${A.y}" x2="${Z.x}" y2="${Z.y}" class="o-ln${lit ? " lit" : ""}"/>`; }));
    Object.values(STAR).forEach(st => {
      const lv = b[st.n] || 0, isCur = st.n === P.cur, avail = open(st.n), r = (st.big ? 13 : 9) + lv * 2.5;
      s += `<g class="o-star${isCur ? " cur" : ""}${avail ? "" : " locked"}" data-n="${st.n}" transform="translate(${st.x} ${st.y})">`;
      if (halo[st.n]) s += `<circle r="${r + 14}" class="o-halo"/>`;
      if (lv > 0) s += `<circle r="${r * 2.6}" fill="url(#gl)" opacity="${.18 + lv * .17}"/>`;
      s += `<circle r="${r}" class="o-core lv${lv}"/>`;
      if (isCur) s += `<circle r="${r + 8}" class="o-ring"/>`;
      if (o.labels) s += `<text y="${r + 24}" text-anchor="middle" class="o-lab">${st.title}</text>`;
      s += `</g>`;
    });
    if (o.labels) CONST.forEach(c => { const xs = c.stars.map(x => x[2]), ys = c.stars.map(x => x[3]);
      s += `<text x="${Math.min(...xs) - 10}" y="${Math.max(...ys) + 70}" class="o-cname">${c.name}</text><text x="${Math.min(...xs) - 10}" y="${Math.max(...ys) + 92}" class="o-csub">${c.sub}</text>`; });
    return s + "</svg>";
  }

  // ---- екран 2: обсерваторията ----
  function screenHome() {
    gen++;
    const st = STAR[P.cur], lv = P.b[P.cur] || 0;
    app.className = "o-scr o-home";
    app.innerHTML = `<div class="o-bg"></div>
      <div class="o-window" id="o-win">${skySVG({ vb: "40 80 460 460" })}</div>
      <div class="o-top"><button class="o-me" id="o-me"><img src="assets/img/world/avatars/${P.av}.webp" alt=""><b>${P.name}</b></button><div class="o-area">Аврора</div></div>
      <div class="o-stage">${zori("explain")}<img class="o-kid" src="assets/img/world/avatars/${P.av}.webp" alt=""></div>
      <div class="o-say">Здравей! Да започваме ли наблюдението?</div>
      <div class="o-cta"><button class="o-go" id="o-go">▶ Продължи мисията<small>Звезда: ${st.title} · ${"★".repeat(lv)}${"☆".repeat(3 - lv)}</small></button><button class="o-sec" id="o-map">Небето ☾</button></div>`;
    voice("Здравей! Да започваме ли наблюдението?");
    $("#o-go").onclick = () => startMission(P.cur);
    $("#o-map").onclick = screenMap; $("#o-win").onclick = screenMap; $("#o-me").onclick = screenProfiles;
  }

  // ---- екран 3: звездната карта ----
  function screenMap(focus) {
    gen++;
    app.className = "o-scr o-map";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Обсерватория</button><div><div class="o-mt">Аврора</div><div class="o-ms">първата област от небето · модул „Просто“</div></div></div>
      <div class="o-mapwrap">${skySVG({ labels: 1, far: 1, vb: "40 80 1400 560" })}</div>
      <div class="o-card" id="o-card" hidden></div>
      <div class="o-legend"><span><i class="lv1"></i>бледа – в процес</span><span><i class="lv3"></i>ярка – научено</span><span><i class="halo"></i>ореол – и без телескоп</span></div>`;
    $("#o-back").onclick = screenHome;
    app.querySelectorAll(".o-star").forEach(g => g.addEventListener("click", () => card(+g.dataset.n)));
    if (focus) card(focus);
  }
  function card(n) {
    const st = STAR[n], lv = P.b[n] || 0, el = $("#o-card"), locked = n > P.cur || (st.c === "C" && (P.b[17] || 0) < 3);
    const bars = ["Точност", "Начин", "Сам/а"].map((t, i) => `<div class="o-bar"><span>${t}</span><b class="${i < lv ? "on" : ""}"></b></div>`).join("");
    el.innerHTML = `<button class="o-x" aria-label="Затвори">✕</button><div class="o-ct">${st.title}</div>
      <div class="o-cs">${CONST.find(c => c.id === st.c).name}${st.big ? " · Звездна нощ" : ""}</div>
      ${locked ? `<p>Тази звезда още не се вижда. ${st.c === "C" ? "Отключва се след „Двете ръце“ – по желание." : "Ще я открием в следващите занятия."}</p>`
        : `<div class="o-bars">${bars}</div>${P.halo[n] ? '<p class="o-hl">✦ Вижда се и без телескоп</p>' : ""}${n <= 9 ? `<button class="o-go sm" id="o-obs">Наблюдавай</button>` : '<p class="o-cs">Мисиите за „Двете ръце“ – в следващата версия на прототипа.</p>'}`}`;
    el.hidden = false; el.querySelector(".o-x").onclick = () => { el.hidden = true; };
    const ob = $("#o-obs"); if (ob) ob.onclick = () => startMission(n);
  }

  // ---- абакус (точен, от кода) ----
  function abacus(host, rods, opts) {
    const W = 200, X0 = 140, H = 560, BEAM = 190, BW = 140, BH = 54;
    const eY = (k, e) => k <= e ? BEAM + 34 + (k - 1) * 60 : H - 40 - (4 - k) * 60, hY = (h) => h ? BEAM - 36 : 56;
    const xOf = (r) => X0 + (rods - 1 - r) * W, path = `M${-BW / 2} 0 L${-BW / 4} ${-BH / 2} L${BW / 4} ${-BH / 2} L${BW / 2} 0 L${BW / 4} ${BH / 2} L${-BW / 4} ${BH / 2} Z`;
    let st = E.make(rods), moves = [], on = true;
    const wTot = X0 * 2 + (rods - 1) * W;
    let s = `<svg viewBox="0 0 ${wTot} ${H}" class="o-ab"><rect x="9" y="9" width="${wTot - 18}" height="${H - 18}" rx="26" fill="#1E2350" stroke="#B88A4E" stroke-width="16"/>`;
    for (let i = 0; i < rods; i++) s += `<line x1="${xOf(i)}" y1="22" x2="${xOf(i)}" y2="${H - 22}" stroke="#8D6A3E" stroke-width="8"/>`;
    s += `<rect x="18" y="${BEAM - 7}" width="${wTot - 36}" height="15" fill="#B88A4E"/>`;
    for (let i = 0; i < rods; i++) { s += `<g class="o-b" data-r="${i}" data-b="h"><path d="${path}"/></g>`; for (let k = 1; k <= 4; k++) s += `<g class="o-b" data-r="${i}" data-b="e" data-k="${k}"><path d="${path}"/></g>`; }
    host.innerHTML = s + "</svg>";
    const upd = () => host.querySelectorAll(".o-b").forEach(g => { const i = +g.dataset.r, r = st[i], p = g.firstChild;
      if (g.dataset.b === "h") { g.style.transform = `translate(${xOf(i)}px,${hY(r.h)}px)`; p.setAttribute("class", r.h ? "on h" : ""); }
      else { const k = +g.dataset.k; g.style.transform = `translate(${xOf(i)}px,${eY(k, r.e)}px)`; p.setAttribute("class", k <= r.e ? "on" : ""); } });
    host.querySelectorAll(".o-b").forEach(g => g.addEventListener("pointerdown", ev => { ev.preventDefault(); if (!on) return;
      const m = E.tapMove(st, +g.dataset.r, g.dataset.b, +g.dataset.k || 0), ns = E.apply(st, m); if (!ns) return; m.t = Math.round(performance.now()); st = ns; moves.push(m); upd(); }));
    upd();
    return { reset: () => { st = E.make(rods); moves = []; upd(); }, set: (v) => { st = E.fromValue(v, rods); upd(); }, value: () => E.value(st), moves: () => moves.slice(), enable: (v) => { on = v; } };
  }
  // статична картинка на число (за флашкартите)
  function abImg(v, rods) {
    const W = 200, X0 = 140, H = 560, BEAM = 190, BW = 140, BH = 54, st = E.fromValue(v, rods);
    const eY = (k, e) => k <= e ? BEAM + 34 + (k - 1) * 60 : H - 40 - (4 - k) * 60, hY = (h) => h ? BEAM - 36 : 56, xOf = (r) => X0 + (rods - 1 - r) * W, wTot = X0 * 2 + (rods - 1) * W;
    const bead = (x, y, c) => `<path transform="translate(${x} ${y})" d="M${-BW / 2} 0 L${-BW / 4} ${-BH / 2} L${BW / 4} ${-BH / 2} L${BW / 2} 0 L${BW / 4} ${BH / 2} L${-BW / 4} ${BH / 2} Z" class="${c}"/>`;
    let s = `<svg viewBox="0 0 ${wTot} ${H}" class="o-ab"><rect x="9" y="9" width="${wTot - 18}" height="${H - 18}" rx="26" fill="#1E2350" stroke="#B88A4E" stroke-width="16"/>`;
    for (let i = 0; i < rods; i++) s += `<line x1="${xOf(i)}" y1="22" x2="${xOf(i)}" y2="${H - 22}" stroke="#8D6A3E" stroke-width="8"/>`;
    s += `<rect x="18" y="${BEAM - 7}" width="${wTot - 36}" height="15" fill="#B88A4E"/>`;
    for (let i = 0; i < rods; i++) { const r = st[i]; s += bead(xOf(i), hY(r.h), r.h ? "on h" : ""); for (let k = 1; k <= 4; k++) s += bead(xOf(i), eY(k, r.e), k <= r.e ? "on" : ""); }
    return s + "</svg>";
  }

  // ---- мисията ----
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const STAGES = ["Флашкарти", "Абакус", "Флашкарти", "Без телескоп", "Звездно броене"];
  let M = null;
  function shell(i, title) {
    app.className = "o-scr o-mis";
    app.innerHTML = `<div class="o-mtop"><button class="o-back" id="o-quit">✕</button><div class="o-pips">${STAGES.map((t, j) => `<b class="${j < i ? "d" : j === i ? "c" : ""}" title="${t}"></b>`).join("")}</div><div class="o-mname">${title}</div></div>
      <div class="o-mbody"><div class="o-mz">${zori("explain")}<div class="o-say"></div></div><div class="o-mwork" id="o-work"></div></div>`;
    $("#o-quit").onclick = () => { gen++; screenHome(); };
  }
  async function startMission(n) {
    gen++; const g = gen;
    const ex = EX[n] || EX[1], par = PAR[n] || PAR[1], max = MAXN[n] || 9;
    M = { n, ex, par, max, flash: [0, 0], ab: [0, 0], meth: [0, 0], im: [0, 0], help: 0 };
    try {
      shell(0, STAR[n].title); say("Тази вечер звездата ни още е бледа. Ще я направим ли по-ярка?", "explain"); await wait(3200);
      await stageFlash(0, 6, par[1]); await stageAbacus(); await stageFlash(2, 4, Math.max(.8, par[1] - .3)); await stageMental(); await stageCount(); await finish();
    } catch (e) { if (e !== "stale") throw e; }
  }
  function choices(right, max) { const s = new Set([right]); while (s.size < Math.min(3, max + 1)) s.add(Math.floor(Math.random() * (max + 1))); return shuffle([...s]); }
  async function ask(opts, right) {
    const w = $("#o-work"); const row = document.createElement("div"); row.className = "o-ch";
    row.innerHTML = opts.map(v => `<button data-v="${v}">${v}</button>`).join(""); w.appendChild(row);
    return new Promise(res => row.querySelectorAll("button").forEach(b => b.onclick = () => { row.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.v === right) x.classList.add("ok"); }); if (+b.dataset.v !== right) b.classList.add("no"); setTimeout(() => res(+b.dataset.v === right), 700 * FAST); }));
  }
  async function stageFlash(i, count, sec) {
    shell(i, STAR[M.n].title); say(i === 0 ? "Първо – флашкарти. Гледай внимателно и запомни числото!" : "Още флашкарти – малко по-бързо.", "point"); await wait(2600);
    for (let k = 0; k < count; k++) {
      const v = Math.floor(Math.random() * (M.max + 1)), w = $("#o-work");
      w.innerHTML = `<div class="o-flash">${abImg(v, 1)}</div>`; await wait(sec * 1000);
      w.innerHTML = `<div class="o-flash o-q">?</div>`; const ok = await ask(choices(v, M.max), v);
      M.flash[0] += ok ? 1 : 0; M.flash[1]++; if (ok) say("Браво! Точно така.", "joy"); await wait(500);
    }
  }
  async function stageAbacus() {
    shell(1, STAR[M.n].title); say("Сега – абакусът. Смятай, докато виждаш числата.", "explain"); await wait(2800);
    const list = shuffle(M.ex).slice(0, 4);
    for (const nums of list) {
      const w = $("#o-work"); w.innerHTML = `<div class="o-num" id="o-num"></div><div class="o-abhost" id="o-abh"></div><div class="o-row"><button class="o-done" id="o-done" hidden>✓ Готово</button></div>`;
      const ab = abacus($("#o-abh"), 1); await wait(600);
      for (let i = 0; i < nums.length; i++) { const n = nums[i]; $("#o-num").textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); $("#o-num").className = "o-num" + (n < 0 && i ? " minus" : ""); await wait(M.par[0] * 1000 - 200); $("#o-num").textContent = ""; await wait(200); }
      $("#o-num").textContent = "= ?"; $("#o-done").hidden = false;
      await new Promise(res => { $("#o-done").onclick = res; });
      ab.enable(false); const target = nums.reduce((a, b) => a + b, 0), got = ab.value(), j = E.judgeChain(nums, ab.moves(), 1);
      const right = got === target, method = right && j.steps.every(s => s.code === "ok");
      M.ab[0] += right ? 1 : 0; M.ab[1]++; M.meth[0] += method ? 1 : 0; M.meth[1]++;
      if (method) say("Браво! Точно така.", "joy");
      else if (right) say("Отговорът е верен! Следващия път – с правилните движения.", "explain");
      else { say("Почти! Виж как е правилно.", "wait"); ab.set(target); }
      $("#o-num").textContent = "= " + target; await wait(right ? 1400 : 2600);
    }
  }
  async function stageMental() {
    shell(3, STAR[M.n].title); say("Наблюдение без телескоп! Смятай наум.", "point"); await wait(2600);
    const list = shuffle(M.ex).slice(0, 3);
    for (const nums of list) {
      const w = $("#o-work"); w.innerHTML = `<div class="o-num" id="o-num"></div><div class="o-ghost">${abImg(0, 1)}</div>`; await wait(500);
      for (let i = 0; i < nums.length; i++) { const n = nums[i]; $("#o-num").textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); await wait(M.par[2] * 1000 - 200); $("#o-num").textContent = ""; await wait(200); }
      $("#o-num").textContent = "= ?"; const target = nums.reduce((a, b) => a + b, 0);
      const ok = await ask(choices(target, M.max), target); M.im[0] += ok ? 1 : 0; M.im[1]++;
      say(ok ? "Браво! Точно така." : "Почти! Виж как е правилно.", ok ? "joy" : "wait"); await wait(1200);
    }
  }
  async function stageCount() {
    shell(4, STAR[M.n].title); say("Звездно броене: колко звезди светнаха?", "explain"); await wait(2400);
    for (let k = 0; k < 4; k++) {
      const v = 1 + Math.floor(Math.random() * Math.min(9, M.max + 2)), w = $("#o-work");
      const pts = shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, v).map(i => [60 + (i % 4) * 90 + (i * 13) % 30, 50 + Math.floor(i / 4) * 90 + (i * 7) % 25]);
      w.innerHTML = `<svg viewBox="0 0 420 300" class="o-cnt">${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="#F5C04A"/>`).join("")}</svg>`; await wait(1300);
      w.innerHTML = `<div class="o-flash o-q">?</div>`; await ask(choices(v, 9), v);
    }
  }
  async function finish() {
    const r = (a) => a[1] ? a[0] / a[1] : 0, n = M.n;
    const earned = (r(M.ab) >= .75 ? 1 : 0) + (r(M.meth) >= .75 ? 1 : 0) + (r(M.flash) >= .8 ? 1 : 0);
    const before = P.b[n] || 0, after = Math.min(3, before + (earned >= 2 ? 1 : 0));   // най-много +1 яркост на мисия (усвояването иска няколко различни дни)
    P.b[n] = after; if (r(M.im) >= .67 && after >= 3) P.halo[n] = 1;
    if (after >= 3 && n === P.cur && n < 9) P.cur = n + 1; save();
    gen++; app.className = "o-scr o-end";
    app.innerHTML = `<div class="o-endsky">${skySVG({ vb: `${STAR[n].x - 300} ${STAR[n].y - 70} 600 360` })}</div>
      <div class="o-endbox">${zori("joy")}<div class="o-say"></div>
      <div class="o-res"><div><b>${M.flash[0]}/${M.flash[1]}</b>флашкарти</div><div><b>${M.ab[0]}/${M.ab[1]}</b>абакус</div><div><b>${M.meth[0]}/${M.meth[1]}</b>правилни движения</div><div><b>${M.im[0]}/${M.im[1]}</b>без телескоп</div></div>
      <div class="o-stars">${"★".repeat(after)}${"☆".repeat(3 - after)}</div>
      <button class="o-go" id="o-home">Към обсерваторията</button></div>`;
    say(after > before ? "Небето е подредено за тази вечер. Звездата стана по-ярка!" : "Небето е подредено за тази вечер. Утре ще я наблюдаваме пак.", "joy");
    const g = app.querySelector(`.o-star[data-n="${n}"]`); if (g) g.classList.add("pulse");
    $("#o-home").onclick = screenHome;
  }

  // ---- старт ----
  if (Q.get("p")) { P = prof(Q.get("p")); Q.get("m") ? startMission(+Q.get("m")) : Q.get("map") ? screenMap() : screenHome(); } else screenProfiles();
  window.OBS = { screenHome, screenMap, startMission, profile: () => P,
    testFinish: (n, r) => { M = Object.assign({ n, ex: [], par: PAR[n], max: MAXN[n], flash: [5, 6], ab: [3, 4], meth: [3, 4], im: [2, 3], help: 0 }, r || {}); return finish(); } };   // само за проверки
})();
