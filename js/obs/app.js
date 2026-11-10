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
    cur = null; const f = AUDZ[text] || AUD[text]; if (f) { cur = new Audio("assets/audio/abacus/" + f); cur.play().catch(() => {}); }
  }
  let gen = 0;
  const FAST_ON = !!Q.get("fast"), FAST = FAST_ON ? 0.08 : 1;   // ?fast=1 – само за автоматичните проверки
  const wait = (ms) => { const g = gen; return new Promise((res, rej) => setTimeout(() => g === gen ? res() : rej("stale"), ms * FAST)); };
  const zori = (pose) => `<img class="o-zori" src="assets/img/zori/z_${pose}.png" alt="Зори">`;
  // изчаква записа да свърши (иначе следващата реплика го прекъсва); без запис – по дължината на текста
  function talk(text, pose) {
    say(text, pose); const g = gen, min = Math.max(1600, text.length * 75) * FAST;
    return new Promise((res, rej) => { const done = () => g === gen ? res() : rej("stale");
      const a = cur; if (a && !FAST_ON && Q.get("voice") !== "0") { let fin = false; const end = () => { if (!fin) { fin = true; setTimeout(done, 350); } };
        a.addEventListener("ended", end); a.addEventListener("error", end); setTimeout(end, 9000); } else setTimeout(done, min); });
  }
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

  const starPath = (R) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; d += (i ? "L" : "M") + (rr * Math.cos(a)).toFixed(1) + " " + (rr * Math.sin(a)).toFixed(1); } return d + "Z"; };
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
      s += `<path d="${starPath(r * 1.35)}" class="o-core lv${lv}"/>`;
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
      <div class="o-cta"><button class="o-go" id="o-go">▶ Продължи мисията<small>Звезда: ${st.title} · ${"★".repeat(lv)}${"☆".repeat(3 - lv)}</small></button><button class="o-sec" id="o-map">Небето ☾</button><button class="o-sec" id="o-games">Игри ✦</button></div>`;
    voice("Здравей! Да започваме ли наблюдението?");
    $("#o-go").onclick = () => startMission(P.cur);
    $("#o-map").onclick = screenMap; $("#o-games").onclick = screenGames; $("#o-win").onclick = screenMap; $("#o-me").onclick = screenProfiles;
  }

  // ---- екран 3: звездната карта ----
  function screenMap(focus) {
    gen++;
    app.className = "o-scr o-map";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към обсерваторията</button><div class="o-grow"><div class="o-mt">Аврора</div><div class="o-ms">първата област от небето · модул „Просто“</div></div><button class="o-sec" id="o-mg">Игри ✦</button><button class="o-go sm" id="o-mc">▶ Продължи мисията</button></div>
      <div class="o-mapwrap">${skySVG({ labels: 1, far: 1, vb: "40 80 1400 560" })}</div>
      <div class="o-card" id="o-card" hidden></div>
      <div class="o-legend"><span><i class="lv1"></i>бледа – в процес</span><span><i class="lv3"></i>ярка – научено</span><span><i class="halo"></i>ореол – и без телескоп</span></div>`;
    $("#o-back").onclick = screenHome; $("#o-mg").onclick = screenGames; $("#o-mc").onclick = () => startMission(P.cur);
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
  const STAGES = ["Флашкарти", "Абакус", "Флашкарти", "Без телескоп", "Игра"];
  let M = null;
  function shell(i, title) {
    app.className = "o-scr o-mis";
    app.innerHTML = `<div class="o-mtop"><button class="o-back" id="o-quit">✕ Изход</button><div class="o-pips">${STAGES.map((t, j) => `<b class="${j < i ? "d" : j === i ? "c" : ""}" title="${t}"></b>`).join("")}</div><div class="o-mname">${title}</div></div>
      <div class="o-mbody"><div class="o-mz">${zori("explain")}<div class="o-say"></div></div><div class="o-mwork" id="o-work"></div></div>`;
    $("#o-quit").onclick = () => { gen++; screenHome(); };
  }
  async function startMission(n) {
    gen++; const g = gen;
    const ex = EX[n] || EX[1], par = PAR[n] || PAR[1], max = MAXN[n] || 9;
    M = { n, ex, par, max, flash: [0, 0], ab: [0, 0], meth: [0, 0], im: [0, 0], help: 0 };
    try {
      shell(0, STAR[n].title); await talk("Тази вечер звездата ни още е бледа. Ще я направим ли по-ярка?", "explain");
      await stageFlash(0, 6, par[1]); await stageAbacus(); await stageFlash(2, 4, Math.max(.8, par[1] - .3)); await stageMental(); await missionGame(); await finish();
    } catch (e) { if (e !== "stale") throw e; }
  }
  function choices(right, max) { const s = new Set([right]); while (s.size < Math.min(3, max + 1)) s.add(Math.floor(Math.random() * (max + 1))); return shuffle([...s]); }
  async function ask(opts, right) {
    const w = $("#o-work"); const row = document.createElement("div"); row.className = "o-ch";
    row.innerHTML = opts.map(v => `<button data-v="${v}">${v}</button>`).join(""); w.appendChild(row);
    return new Promise(res => row.querySelectorAll("button").forEach(b => b.onclick = () => { row.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.v === right) x.classList.add("ok"); }); if (+b.dataset.v !== right) b.classList.add("no"); setTimeout(() => res(+b.dataset.v === right), 700 * FAST); }));
  }
  async function stageFlash(i, count, sec) {
    shell(i, STAR[M.n].title); await talk(i === 0 ? "Първо – флашкарти. Гледай внимателно и запомни числото!" : "Още флашкарти – малко по-бързо.", "point");
    for (let k = 0; k < count; k++) {
      const v = Math.floor(Math.random() * (M.max + 1)), w = $("#o-work");
      w.innerHTML = `<div class="o-flash">${abImg(v, 1)}</div>`; await wait(sec * 1000);
      w.innerHTML = `<div class="o-flash o-q">?</div>`; const ok = await ask(choices(v, M.max), v);
      M.flash[0] += ok ? 1 : 0; M.flash[1]++; if (ok) say("Браво! Точно така.", "joy"); await wait(500);
    }
  }
  async function stageAbacus() {
    shell(1, STAR[M.n].title); await talk("Сега – абакусът. Смятай, докато виждаш числата.", "explain");
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
    shell(3, STAR[M.n].title); await talk("Наблюдение без телескоп! Смятай наум.", "point");
    const list = shuffle(M.ex).slice(0, 3);
    for (const nums of list) {
      const w = $("#o-work"); w.innerHTML = `<div class="o-num" id="o-num"></div><div class="o-ghost">${abImg(0, 1)}</div>`; await wait(500);
      for (let i = 0; i < nums.length; i++) { const n = nums[i]; $("#o-num").textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); await wait(M.par[2] * 1000 - 200); $("#o-num").textContent = ""; await wait(200); }
      $("#o-num").textContent = "= ?"; const target = nums.reduce((a, b) => a + b, 0);
      const ok = await ask(choices(target, M.max), target); M.im[0] += ok ? 1 : 0; M.im[1]++;
      say(ok ? "Браво! Точно така." : "Почти! Виж как е правилно.", ok ? "joy" : "wait"); await wait(1200);
    }
  }
  // ======================= ИГРИ =======================
  // Пет наши игри; всяка тренира умение от МА. В мисията последният етап е една от тях (с настройките по занятието);
  // от обсерваторията – „Игри“: избор → Настройки → игра → резултат (Към игрите / Играй пак / Към обсерваторията), като в ПУ и АЕ.
  const TOP = E.TOPICS, TOPIC_OF = { 1: "s2", 2: "s3", 3: "s4", 4: "s5", 5: "s6", 6: "s7", 7: "s8", 8: "s9", 9: "s9", 10: "t10", 11: "t19", 12: "t19", 13: "d44", 14: "d55", 15: "d99", 16: "d99", 17: "d99", 18: "h444", 19: "h555", 20: "h999", 21: "h999" };
  const topicFor = (id) => TOP.find(t => t.id === id) || TOP[0];
  const SPEEDS = [3, 2.5, 2, 1.6, 1.3, 1, .8, .6];
  const ICON = {
    trainer: `<svg viewBox="0 0 100 100"><rect x="22" y="12" width="56" height="76" rx="10" fill="#1E2350" stroke="#B88A4E" stroke-width="5"/><line x1="50" y1="18" x2="50" y2="82" stroke="#8D6A3E" stroke-width="3"/><rect x="25" y="36" width="50" height="5" fill="#B88A4E"/><path class="ic-b1" d="M36 26l7-6h14l7 6-7 6H43z" fill="#F5C04A"/><path class="ic-b2" d="M36 50l7-6h14l7 6-7 6H43z" fill="#F2A23A"/><path d="M36 64l7-6h14l7 6-7 6H43z" fill="#5A5F8E"/><path d="M36 76l7-6h14l7 6-7 6H43z" fill="#5A5F8E"/></svg>`,
    flash: `<svg viewBox="0 0 100 100"><rect class="ic-card" x="20" y="16" width="44" height="64" rx="8" fill="#F7F1E3"/><rect class="ic-card2" x="36" y="22" width="44" height="64" rx="8" fill="#F5C04A"/><text x="58" y="66" text-anchor="middle" font-size="34" font-weight="900" fill="#2B2140" font-family="Nunito">7</text></svg>`,
    fix: `<svg viewBox="0 0 100 100"><g class="ic-tel"><rect x="18" y="38" width="54" height="18" rx="6" transform="rotate(-25 45 47)" fill="#C9A24A"/><rect x="64" y="22" width="14" height="22" rx="4" transform="rotate(-25 71 33)" fill="#B88A4E"/></g><path d="M40 60 L30 88 M50 60 L50 88 M60 60 L70 88" stroke="#8D6A3E" stroke-width="5" stroke-linecap="round"/><circle class="ic-tw" cx="82" cy="16" r="5" fill="#FFE9A8"/></svg>`,
    memory: `<svg viewBox="0 0 100 100"><path d="M62 18a32 32 0 1 0 20 52 26 26 0 1 1-20-52z" fill="#F5C04A"/><g class="ic-tw" fill="#FFE9A8"><circle cx="30" cy="30" r="4"/><circle cx="22" cy="58" r="3"/><circle cx="44" cy="78" r="3.5"/></g></svg>`,
    count: `<svg viewBox="0 0 100 100"><g fill="#F5C04A"><path class="ic-s1" d="M30 18l5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z"/><path class="ic-s2" d="M70 34l5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z"/><path class="ic-s3" d="M38 58l5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z"/></g></svg>`
  };
  const GAMES = {
    trainer: { name: "Тренажор", sub: "примери за смятане", skill: "смятане на абакуса и наум",
      opts: { topic: "тема", count: [3, 5, 7, 10], speed: SPEEDS, rounds: [3, 5, 8], mode: [["ab", "с абакус"], ["mind", "без телескоп"]] } },
    flash: { name: "Флашкарти", sub: "познай числото", skill: "образа на числото",
      opts: { topic: "тема", speed: SPEEDS, rounds: [5, 8, 12] } },
    fix: { name: "Поправи телескопа", sub: "с едно движение", skill: "четене на числото и правилното движение",
      opts: { topic: "тема", rounds: [3, 5, 8] } },
    memory: { name: "Нощна памет", sub: "запомни по ред", skill: "зрителна памет – основа за смятането наум",
      opts: { topic: "тема", len: [2, 3, 4], speed: SPEEDS, rounds: [3, 5, 8] } },
    count: { name: "Звездно броене", sub: "колко звезди светнаха?", skill: "бързо виждане на количество",
      opts: { upto: [5, 7, 9], speed: SPEEDS, rounds: [4, 6, 8] } }
  };
  const OPTNAME = { topic: "Тема", count: "Брой числа", speed: "Скорост (сек.)", rounds: "Кръгове", mode: "Начин", len: "Колко числа", upto: "До" };
  function defaults(id) {
    const n = Math.min(P.cur, 21), sp = (PAR[n] || PAR[9]);
    return { topic: TOPIC_OF[n] || "s9", count: 5, speed: id === "flash" ? 1.6 : id === "memory" ? 1.3 : 2, rounds: GAMES[id].opts.rounds[1], mode: "ab", len: 2, upto: n < 4 ? 5 : 9, ...(P.set && P.set[id] || {}) };
  }
  // случайно число, позволено от темата (цифрите ≤ stateMax; кръгли/11–19)
  function randVal(t) {
    for (let g = 0; g < 200; g++) { const max = Math.pow(10, t.rods) - 1, v = Math.floor(Math.random() * (max + 1));
      const d = String(v).padStart(t.rods, "0").split("").map(Number);
      if (d.some(x => x > t.stateMax)) continue; if (t.round === 1 && v % 10) continue; if (t.round === 2 && v % 100) continue; if (t.teen && (v < 10 || v > 19)) continue;
      if (t.rods > 1 && !t.round && !t.teen && v < Math.pow(10, t.rods - 1)) continue; return v; }
    return 0;
  }
  // ---- ефекти ----
  function burst() {   // звездички при верен отговор
    const host = $("#o-work") || app, b = document.createElement("div"); b.className = "o-burst";
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, d = 90 + Math.random() * 70, sp = document.createElement("i");
      sp.style.setProperty("--dx", Math.cos(a) * d + "px"); sp.style.setProperty("--dy", Math.sin(a) * d + "px"); sp.style.animationDelay = (Math.random() * .12) + "s"; b.appendChild(sp); }
    host.appendChild(b); setTimeout(() => b.remove(), 1100);
    const z = $(".o-zori"); if (z) { z.classList.remove("hop"); void z.offsetWidth; z.classList.add("hop"); }
  }
  const good = (t) => { burst(); say(t || "Браво! Точно така.", "joy"); };
  const bad = (t) => say(t || "Почти! Виж как е правилно.", "wait");

  // ---- обвивка на играта (свободна игра): Изход / Настройки, кръгове ----
  let G = null;
  function gameShell(id, round, total) {
    if (inMission()) { shell(4, STAR[M.n].title); return; }
    app.className = "o-scr o-mis o-game";
    app.innerHTML = `<div class="o-mtop"><button class="o-back" id="o-gx">✕ Изход</button><button class="o-back" id="o-gs">⚙ Настройки</button>
      <div class="o-pips">${Array.from({ length: total }, (_, j) => `<b class="${j < round ? "d" : j === round ? "c" : ""}"></b>`).join("")}</div><div class="o-mname">${GAMES[id].name}</div></div>
      <div class="o-mbody"><div class="o-mz">${zori("explain")}<div class="o-say"></div></div><div class="o-mwork" id="o-work"></div></div>`;
    $("#o-gx").onclick = () => { gen++; screenGames(); }; $("#o-gs").onclick = () => { gen++; screenSettings(id); };
  }
  const inMission = () => !!M && !M.free;
  function pip(round) { const b = app.querySelectorAll(".o-game .o-pips b"); b.forEach((x, j) => x.className = j < round ? "d" : j === round ? "c" : ""); }

  // ---- самите игри: връщат [верни, общо] ----
  async function playTrainer(c) {
    const t = topicFor(c.topic); let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const ex = E.simpleExample({ ...t, count: c.count }), nums = ex.nums, w = $("#o-work");
      const mind = c.mode === "mind";
      w.innerHTML = `<div class="o-num" id="o-num"></div>${mind ? `<div class="o-ghost">${abImg(0, t.rods)}</div>` : `<div class="o-abhost" id="o-abh"></div>`}<div class="o-row"><button class="o-done" id="o-done" hidden>✓ Готово</button></div>`;
      const ab = mind ? null : abacus($("#o-abh"), t.rods); await wait(700);
      for (let i = 0; i < nums.length; i++) { const n = nums[i], el = $("#o-num"); el.textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); el.className = "o-num pop" + (n < 0 && i ? " minus" : ""); await wait(c.speed * 1000 - 200); el.textContent = ""; el.className = "o-num"; await wait(200); }
      const target = nums.reduce((a, b) => a + b, 0); $("#o-num").textContent = "= ?";
      let right;
      if (mind) { right = await ask(choices(target, Math.max(9, target + 3)), target); }
      else { $("#o-done").hidden = false; await new Promise(res => { $("#o-done").onclick = res; }); ab.enable(false); right = ab.value() === target; if (!right) ab.set(target); }
      $("#o-num").textContent = "= " + target; if (right) { ok++; good(); } else bad(); await wait(right ? 1300 : 2400);
    }
    return [ok, c.rounds];
  }
  async function playFlash(c) {
    const t = topicFor(c.topic); let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const v = randVal(t), w = $("#o-work");
      w.innerHTML = `<div class="o-flash r${t.rods} pop">${abImg(v, t.rods)}</div>`; await wait(c.speed * 1000);
      w.innerHTML = `<div class="o-flash r${t.rods} o-q">?</div>`;
      const opts = new Set([v]); while (opts.size < 3) opts.add(randVal(t)); const r = await ask(shuffle([...opts]), v);
      if (r) { ok++; good(); } else bad(); await wait(600);
    }
    return [ok, c.rounds];
  }
  async function playFix(c) {
    const t = topicFor(c.topic); let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); let target = 0, wrong = 0;
      for (let g = 0; g < 80; g++) { target = randVal(t); const st0 = E.fromValue(target, t.rods), rod = Math.floor(Math.random() * t.rods), opts = [];
        for (let d = 1; d <= 4; d++) opts.push({ rod, bead: "e", d }, { rod, bead: "e", d: -d }); opts.push({ rod, bead: "h", d: 5 }, { rod, bead: "h", d: -5 });
        const okm = opts.filter(o => E.apply(st0, o)); if (okm.length) { wrong = E.value(E.apply(st0, okm[Math.floor(Math.random() * okm.length)])); break; } }
      const w = $("#o-work"); w.innerHTML = `<div class="o-num pop">${target}</div><div class="o-abhost" id="o-abh"></div><div class="o-row"><button class="o-done" id="o-done">✓ Готово</button></div>`;
      const ab = abacus($("#o-abh"), t.rods); ab.set(wrong);
      await new Promise(res => { $("#o-done").onclick = res; }); ab.enable(false);
      const right = ab.value() === target, one = ab.moves().length === 1;
      if (right && one) { ok++; good(); } else if (right) say("Вярно! А можеш ли с едно движение?", "explain"); else { bad(); ab.set(target); }
      await wait(right ? 1300 : 2400);
    }
    return [ok, c.rounds];
  }
  async function playMemory(c) {
    const t = topicFor(c.topic); let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const seq = []; let g = 0; while (seq.length < c.len && g++ < 99) { const v = randVal(t); if (seq[seq.length - 1] !== v) seq.push(v); }
      const w = $("#o-work");
      for (const v of seq) { w.innerHTML = `<div class="o-flash r${t.rods} pop">${abImg(v, t.rods)}</div>`; await wait(c.speed * 1000); w.innerHTML = `<div class="o-flash r${t.rods}"></div>`; await wait(350); }
      say("Кои числа видя? Подреди ги по ред.", "point");
      const pool = new Set(seq); let gg = 0; while (pool.size < Math.max(4, seq.length + 2) && gg++ < 99) pool.add(randVal(t));
      w.innerHTML = `<div class="o-seq">${seq.map(() => "<b>?</b>").join("")}</div><div class="o-ch">${shuffle([...pool]).map(v => `<button data-v="${v}">${v}</button>`).join("")}</div>`;
      const got = await new Promise(res => { const pick = []; w.querySelectorAll(".o-ch button").forEach(b => b.onclick = () => { pick.push(+b.dataset.v); const sl = w.querySelectorAll(".o-seq b"); sl[pick.length - 1].textContent = b.dataset.v; sl[pick.length - 1].classList.add("pop"); if (pick.length === seq.length) { w.querySelectorAll(".o-ch button").forEach(x => x.disabled = true); setTimeout(() => res(pick), 400 * FAST); } }); });
      const right = got.every((v, i) => v === seq[i]);
      w.querySelectorAll(".o-seq b").forEach((b, i) => { b.className = got[i] === seq[i] ? "ok" : "no"; b.textContent = seq[i]; });
      if (right) { ok++; good(); } else bad(); await wait(right ? 1300 : 2200);
    }
    return [ok, c.rounds];
  }
  async function playCount(c) {
    let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const v = 1 + Math.floor(Math.random() * c.upto), w = $("#o-work");
      const cells = shuffle(Array.from({ length: 15 }, (_, i) => i)).slice(0, v);
      w.innerHTML = `<svg viewBox="0 0 500 300" class="o-cnt">${cells.map((i, j) => { const x = 60 + (i % 5) * 95 + ((i * 17) % 23) - 11, y = 55 + Math.floor(i / 5) * 95 + ((i * 11) % 19) - 9;
        return `<g transform="translate(${x} ${y})"><path class="o-cs" style="animation-delay:${j * .05}s" d="${starPath(26)}"/></g>`; }).join("")}</svg>`;
      await wait(c.speed * 1000);
      w.innerHTML = `<div class="o-flash o-q">?</div>`; const opts = new Set([v]); while (opts.size < 3) opts.add(1 + Math.floor(Math.random() * c.upto));
      const r = await ask(shuffle([...opts]), v); if (r) { ok++; good(); } else bad(); await wait(600);
    }
    return [ok, c.rounds];
  }
  const PLAY = { trainer: playTrainer, flash: playFlash, fix: playFix, memory: playMemory, count: playCount };
  const INTRO = { trainer: "Тренажор! Смятай, докато виждаш числата.", flash: "Първо – флашкарти. Гледай внимателно и запомни числото!", fix: "Поправи телескопа! Направи числото с едно движение.", memory: "Нощна памет: запомни звездите по ред.", count: "Звездно броене: колко звезди светнаха?" };

  // в мисията: последният етап – една от игрите, с параметрите на занятието
  async function missionGame() {
    const id = ["count", "fix", "memory"][Math.floor(Math.random() * 3)], c = { ...defaults(id), rounds: id === "count" ? 4 : id === "fix" ? 4 : 3, upto: Math.min(9, M.max + 2) };
    shell(4, STAR[M.n].title); await talk(INTRO[id], "explain"); return PLAY[id](c);
  }

  // ---- екрани: Игри → Настройки → игра → резултат ----
  function navBar(extra) { return `<div class="o-maptop"><button class="o-back" id="o-back">← Към обсерваторията</button>${extra || ""}</div>`; }
  function screenGames() {
    gen++; M = null;
    app.className = "o-scr o-map o-gamesbg";
    app.innerHTML = navBar(`<div><div class="o-mt">Игри</div><div class="o-ms">избери игра – после „Настройки“ или „Старт“</div></div>`) +
      `<div class="o-glist">${Object.entries(GAMES).map(([id, g], i) => `<button class="o-gcard" data-g="${id}" style="animation-delay:${i * .07}s"><div class="o-gic">${ICON[id]}</div><b>${g.name}</b><span>${g.sub}</span></button>`).join("")}</div>`;
    $("#o-back").onclick = screenHome;
    app.querySelectorAll(".o-gcard").forEach(b => b.onclick = () => screenSettings(b.dataset.g));
  }
  function screenSettings(id) {
    gen++; const g = GAMES[id], c = defaults(id);
    const chip = (k, v, label) => `<button class="o-chip${String(c[k]) === String(v) ? " on" : ""}" data-k="${k}" data-v="${v}">${label}</button>`;
    const row = (k) => { const o = g.opts[k]; let chips;
      if (o === "tema" || o === "тема") chips = TOP.map(t => chip(k, t.id, t.name)).join("");
      else chips = o.map(v => Array.isArray(v) ? chip(k, v[0], v[1]) : chip(k, v, String(v).replace(".", ","))).join("");
      return `<div class="o-srow"><div class="o-sk">${OPTNAME[k]}</div><div class="o-chips">${chips}</div></div>`; };
    app.className = "o-scr o-map o-gamesbg";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към игрите</button><div><div class="o-mt">${g.name}</div><div class="o-ms">Настройки · тренира: ${g.skill}</div></div></div>
      <div class="o-set"><div class="o-gic big">${ICON[id]}</div><div class="o-srows">${Object.keys(g.opts).map(row).join("")}</div></div>
      <div class="o-sbar"><button class="o-sec" id="o-home2">Към обсерваторията</button><button class="o-go" id="o-start">▶ Старт</button></div>`;
    app.querySelectorAll(".o-chip").forEach(b => b.onclick = () => { const k = b.dataset.k, v = b.dataset.v; c[k] = isNaN(+v) ? v : +v;
      app.querySelectorAll(`.o-chip[data-k="${k}"]`).forEach(x => x.classList.toggle("on", x === b)); P.set = P.set || {}; P.set[id] = { ...(P.set[id] || {}), [k]: c[k] }; save(); });
    $("#o-back").onclick = screenGames; $("#o-home2").onclick = screenHome; $("#o-start").onclick = () => runGame(id);
  }
  async function runGame(id) {
    gen++; const c = defaults(id); M = { free: true, n: Math.min(P.cur, 9), max: 9 };
    try {
      gameShell(id, 0, c.rounds); await talk(INTRO[id], "explain");
      const [ok, tot] = await PLAY[id](c); screenResult(id, ok, tot);
    } catch (e) { if (e !== "stale") throw e; }
  }
  function screenResult(id, ok, tot) {
    gen++; const r = tot ? ok / tot : 0, stars = r >= .9 ? 3 : r >= .6 ? 2 : r > 0 ? 1 : 0;
    app.className = "o-scr o-end";
    app.innerHTML = `<div class="o-endbox">${zori(stars >= 2 ? "joy" : "explain")}<div class="o-say"></div>
      <div class="o-gres">${GAMES[id].name}: <b>${ok} от ${tot}</b></div>
      <div class="o-stars big">${[0, 1, 2].map(i => `<span class="${i < stars ? "on" : ""}" style="animation-delay:${.15 + i * .2}s">★</span>`).join("")}</div>
      <div class="o-sbar"><button class="o-sec" id="o-rg">Към игрите</button><button class="o-go" id="o-again">↻ Играй пак</button><button class="o-sec" id="o-rh">Към обсерваторията</button></div></div>`;
    say(stars >= 2 ? "Браво! Точно така." : "Край на играта. Звездите ще ни чакат утре!", stars >= 2 ? "joy" : "explain");
    if (stars >= 2) setTimeout(burst, 300);
    $("#o-rg").onclick = screenGames; $("#o-again").onclick = () => runGame(id); $("#o-rh").onclick = screenHome;
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
      <div class="o-sbar"><button class="o-sec" id="o-tomap">Към картата</button><button class="o-go" id="o-home">Към обсерваторията</button></div></div>`;
    say(after > before ? "Небето е подредено за тази вечер. Звездата стана по-ярка!" : "Небето е подредено за тази вечер. Утре ще го наблюдаваме пак.", "joy");
    const g = app.querySelector(`.o-star[data-n="${n}"]`); if (g) g.classList.add("pulse");
    $("#o-home").onclick = screenHome; $("#o-tomap").onclick = () => screenMap(n);
  }

  // ---- старт ----
  if (Q.get("p")) { P = prof(Q.get("p")); Q.get("m") ? startMission(+Q.get("m")) : Q.get("map") ? screenMap() : screenHome(); } else screenProfiles();
  window.OBS = { screenHome, screenMap, startMission, screenGames, screenSettings, screenResult, runGame, profile: () => P,
    testFinish: (n, r) => { M = Object.assign({ n, ex: [], par: PAR[n], max: MAXN[n], flash: [5, 6], ab: [3, 4], meth: [3, 4], im: [2, 3], help: 0 }, r || {}); return finish(); } };   // само за проверки
})();
