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
  fetch("config/abacus-audio-zori.json?v=3").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUDZ[x.t] = x.f; })).catch(() => {});
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

  function applyMotion() { const m = (P && P.motion) || (matchMedia("(prefers-reduced-motion: reduce)").matches ? "calm" : "full");
    document.documentElement.classList.toggle("o-calm", m === "calm"); document.documentElement.classList.toggle("o-still", m === "off"); }
  // ---- екран 1: кой наблюдава ----
  function screenProfiles() {
    gen++;
    app.className = "o-scr o-profiles"; voice("Кой наблюдава тази вечер?");
    app.innerHTML = `<div class="o-ptitle">Кой наблюдава тази вечер?</div>
      <div class="o-plist">${DEMO.map(d => { const p = DB[d.id] || d; const lit = Object.values(p.b || {}).filter(v => v >= 3).length;
        return `<button class="o-pcard" data-id="${d.id}"><img src="assets/img/world/avatars/${p.av}.webp" alt=""><b>${p.name}</b><span>★ ${lit} звезди</span></button>`; }).join("")}</div>
      <p class="o-note">Прототип · демо профили · <button class="o-link" id="o-reset">нулирай демото</button></p>`;
    app.querySelectorAll(".o-pcard").forEach(b => b.onclick = () => { P = prof(b.dataset.id); applyMotion(); screenHome(); });
    $("#o-reset").onclick = () => { DB = {}; save(); screenProfiles(); };
  }

  const starPath = (R) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; d += (i ? "L" : "M") + (rr * Math.cos(a)).toFixed(1) + " " + (rr * Math.sin(a)).toFixed(1); } return d + "Z"; };
  // ---- небето като SVG (използва се и в прозореца на обсерваторията, и в картата) ----
  // видими съзвездия: А винаги; Б – щом детето стигне до него; В – след „Двете ръце“ (по желание). Останалите – мъглявини „?“
  const visibleC = (c) => c === "A" || (c === "B" && P.cur >= 10) || (c === "C" && (P.b[17] || 0) >= 3);
  function skySVG(opts) {
    const o = opts || {}, b = P.b || {}, halo = P.halo || {}, rev = P.rev || {};
    let s = `<svg viewBox="${o.vb || "0 60 1440 520"}" class="o-sky" role="img" aria-label="Небето на ${P.name}">`;
    s += `<defs><radialGradient id="gl"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".45" stop-color="#F5C04A"/><stop offset="1" stop-color="#F5C04A" stop-opacity="0"/></radialGradient>
      <radialGradient id="mist"><stop offset="0" stop-color="#8E7BD8" stop-opacity=".45"/><stop offset="1" stop-color="#8E7BD8" stop-opacity="0"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="8"/></filter></defs>`;
    s += `<g class="o-field">`; for (let i = 0; i < 110; i++) { const x = (i * 337) % 1440, y = 40 + (i * 211) % 560, r = (i % 3) * .5 + .6; s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${.15 + (i % 5) * .07}" class="${i % 7 ? "" : "tw"}"/>`; } s += `</g>`;
    if (o.labels) { s += `<g class="o-astro">${[160, 300, 440, 580].map(r => `<circle cx="560" cy="330" r="${r}"/>`).join("")}${Array.from({ length: 12 }, (_, i) => `<line x1="560" y1="330" x2="${560 + 700 * Math.cos(i * Math.PI / 6)}" y2="${330 + 700 * Math.sin(i * Math.PI / 6)}"/>`).join("")}</g>`; }
    if (o.far) FAR.forEach((f, i) => { const known = i === 0 && P.cur >= 17;
      s += `<g class="o-far"><ellipse cx="${f[2]}" cy="${f[3]}" rx="70" ry="44" fill="url(#mist)"/><text x="${f[2]}" y="${f[3] + 8}" text-anchor="middle">${known ? f[0] : "?"}</text></g>`; });
    CONST.forEach(c => { if (visibleC(c.id)) return; const xs = c.stars.map(x => x[2]), ys = c.stars.map(x => x[3]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      s += `<g class="o-mist"><ellipse cx="${cx}" cy="${cy}" rx="${(Math.max(...xs) - Math.min(...xs)) / 2 + 60}" ry="${(Math.max(...ys) - Math.min(...ys)) / 2 + 50}" fill="url(#mist)" filter="url(#blur)"/>${o.labels ? `<text x="${cx}" y="${cy + 12}" text-anchor="middle">?</text>` : ""}</g>`; });
    Object.entries(LINES).forEach(([c, ls]) => { if (!visibleC(c)) return; ls.forEach(([a, z]) => { const A = STAR[a], Z = STAR[z], lit = (b[a] || 0) >= 3 && (b[z] || 0) >= 1;
      s += `<line x1="${A.x}" y1="${A.y}" x2="${Z.x}" y2="${Z.y}" class="o-ln${lit ? " lit" : ""}"/>`; }); });
    Object.values(STAR).forEach(st => { if (!visibleC(st.c)) return;
      const lv = b[st.n] || 0, isCur = st.n === P.cur, avail = st.n <= P.cur, r = (st.big ? 13 : 9) + lv * 2.5;
      // състояния: отключена (тъмна) · упражнява се (лв 1–2) · усвоена (лв 3) · проверена след време (двоен пръстен); ✦ – и наум
      s += `<g class="o-star${isCur ? " cur" : ""}${avail ? "" : " locked"}" data-n="${st.n}" transform="translate(${st.x} ${st.y})">`;
      if (rev[st.n]) s += `<circle r="${r + 12}" class="o-rev"/><circle r="${r + 18}" class="o-rev"/>`;
      if (lv > 0) s += `<circle r="${r * 2.6}" fill="url(#gl)" opacity="${.18 + lv * .17}"/>`;
      s += `<path d="${starPath(r * 1.35)}" class="o-core lv${lv}"/>`;
      if (halo[st.n]) s += `<path d="${starPath(6)}" transform="translate(${r + 10} ${-r - 8})" class="o-mind"/>`;
      if (isCur) s += `<circle r="${r + 8}" class="o-ring"/>`;
      if (o.labels && (isCur || o.focus === st.n)) s += `<text y="${r + 28}" text-anchor="middle" class="o-lab">${st.title}</text>`;
      s += `</g>`;
    });
    if (o.labels) CONST.forEach(c => { if (!visibleC(c.id)) return; const xs = c.stars.map(x => x[2]), ys = c.stars.map(x => x[3]);
      s += `<text x="${Math.min(...xs) - 10}" y="${Math.max(...ys) + 72}" class="o-cname">${c.name}</text>`; });
    return s + "</svg>";
  }

  // ---- екран 2: обсерваторията ----
  function screenHome() {
    gen++; M = null;
    const st = STAR[P.cur], lv = P.b[P.cur] || 0;
    app.className = "o-scr o-home";
    app.innerHTML = `<div class="o-bg"></div>
      <div class="o-window" id="o-win"><div class="o-proj">${skySVG({ vb: "40 80 460 460" })}</div><div class="o-glass"></div></div>
      <div class="o-top"><button class="o-me" id="o-me"><img src="assets/img/world/avatars/${P.av}.webp" alt=""><b>${P.name}</b><span>смени</span></button><div class="o-area">Аврора</div></div>
      <div class="o-stage">${zori("explain")}<button class="o-kidb" id="o-kid"><img class="o-kid" src="assets/img/world/avatars/${P.av}.webp" alt=""><span>${P.name} · ти</span></button></div>
      <div class="o-say">Здравей! Да започваме ли наблюдението?</div>
      <div class="o-cta"><button class="o-go" id="o-go">▶ Продължи мисията<small>Звезда: ${st.title} · ${"★".repeat(lv)}${"☆".repeat(3 - lv)}</small></button>
        <div class="o-big2"><button class="o-bigb" id="o-map"><svg viewBox="0 0 40 40"><path d="${starPath(14)}" transform="translate(20 21)" fill="#F5C04A"/></svg>Небето</button><button class="o-bigb" id="o-games"><svg viewBox="0 0 40 40"><rect x="10" y="6" width="20" height="28" rx="4" fill="none" stroke="#F5C04A" stroke-width="3"/><path d="M14 14h12M14 20h12M14 26h8" stroke="#F5C04A" stroke-width="3"/></svg>Игри</button></div></div>`;
    voice("Здравей! Да започваме ли наблюдението?");
    $("#o-go").onclick = () => startMission(P.cur);
    $("#o-map").onclick = () => screenMap(); $("#o-games").onclick = screenGames; $("#o-win").onclick = () => screenMap(); $("#o-me").onclick = screenAvatar; $("#o-kid").onclick = screenAvatar;
  }
  // детето избира своя герой (същите аватари като в „Моят свят“); профилите – от бутона долу
  function screenAvatar() {
    gen++; const ALL = ["a1", "a2", "a3", "a4", "a5", "a6", "n1", "n2", "n3", "n4"];
    app.className = "o-scr o-profiles";
    app.innerHTML = `<div class="o-ptitle">Избери своя герой</div><div class="o-plist av">${ALL.map(a => `<button class="o-pcard sm${a === P.av ? " on" : ""}" data-a="${a}"><img src="assets/img/world/avatars/${a}.webp" alt=""></button>`).join("")}</div>
      <div class="o-sbar"><button class="o-sec" id="o-who">Друг наблюдател</button><button class="o-go" id="o-ok">✓ Готово</button></div>`;
    app.querySelectorAll(".o-pcard").forEach(b => b.onclick = () => { P.av = b.dataset.a; save(); app.querySelectorAll(".o-pcard").forEach(x => x.classList.toggle("on", x === b)); });
    $("#o-ok").onclick = screenHome; $("#o-who").onclick = screenProfiles;
  }

  // ---- екран 3: звездната карта ----
  function screenMap(focus) {
    gen++;
    app.className = "o-scr o-map";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към обсерваторията</button><div class="o-grow"><div class="o-mt">Аврора</div><div class="o-ms">първата област от небето · модул „Просто“</div></div><button class="o-sec" id="o-mg">Игри ✦</button><button class="o-go sm" id="o-mc">▶ Продължи мисията</button></div>
      <div class="o-mapwrap">${skySVG({ labels: 1, far: 1, focus, vb: "40 60 1400 580" })}</div>
      <div class="o-card" id="o-card" hidden></div>
      <div class="o-legend"><span><i class="lk"></i>предстои</span><span><i class="lv1"></i>упражняваме</span><span><i class="lv3"></i>научено</span><span><i class="rv"></i>проверено след време</span><span><i class="mind">✦</i>и наум</span></div>`;
    $("#o-back").onclick = screenHome; $("#o-mg").onclick = screenGames; $("#o-mc").onclick = () => startMission(P.cur);
    app.querySelectorAll(".o-star").forEach(g => g.addEventListener("click", () => card(+g.dataset.n)));
    if (focus) card(focus);
    app.querySelectorAll(".o-star").forEach(g => g.addEventListener("click", () => { app.querySelectorAll(".o-lab.tmp").forEach(t => t.remove()); }));
  }
  function card(n) {
    const st = STAR[n], lv = P.b[n] || 0, el = $("#o-card"), locked = n > P.cur || (st.c === "C" && (P.b[17] || 0) < 3);
    const bars = ["Точност", "Начин", "Сам/а"].map((t, i) => `<div class="o-bar"><span>${t}</span><b class="${i < lv ? "on" : ""}"></b></div>`).join("");
    el.innerHTML = `<button class="o-x" aria-label="Затвори">✕</button><div class="o-ct">${st.title}</div>
      <div class="o-cs">${CONST.find(c => c.id === st.c).name}${st.big ? " · Звездна нощ" : ""}</div>
      ${locked ? `<p>Тази звезда още не се вижда. ${st.c === "C" ? "Отключва се след „Двете ръце“ – по желание." : "Ще я открием в следващите занятия."}</p>`
        : `<div class="o-bars">${bars}</div>${P.halo[n] ? '<p class="o-hl">✦ Смята я и наум</p>' : ""}${(P.rev || {})[n] ? '<p class="o-hl" style="color:#9FE3B8">◎ Проверена след време</p>' : ""}${n <= 9 ? `<button class="o-go sm" id="o-obs">Наблюдавай</button>` : '<p class="o-cs">Мисиите за „Двете ръце“ – в следващата версия на прототипа.</p>'}`}`;
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
    let onChange = null;
    host.querySelectorAll(".o-b").forEach(g => g.addEventListener("pointerdown", ev => { ev.preventDefault(); if (!on) return;
      const m = E.tapMove(st, +g.dataset.r, g.dataset.b, +g.dataset.k || 0), ns = E.apply(st, m); if (!ns) return; m.t = Math.round(performance.now()); st = ns; moves.push(m); upd(); if (onChange) onChange(m); }));
    upd();
    const svg = host.querySelector("svg"), NS = "http://www.w3.org/2000/svg";
    const moving = (m) => { const r = st[m.rod]; if (m.bead === "h") return [host.querySelector(`.o-b[data-r="${m.rod}"][data-b="h"]`)];
      const ks = []; if (m.d > 0) for (let k = r.e + 1; k <= r.e + m.d; k++) ks.push(k); else for (let k = r.e + m.d + 1; k <= r.e; k++) ks.push(k);
      return ks.map(k => host.querySelector(`.o-b[data-r="${m.rod}"][data-b="e"][data-k="${k}"]`)); };
    function mark(m) {   // светещи топчета + стрелка с посоката
      const r = st[m.rod], x = xOf(m.rod) + BW / 2 + 22; let y0, y1;
      if (m.bead === "h") { y0 = hY(r.h); y1 = hY(1 - r.h); } else { const ks = moving(m).map(g => +g.dataset.k), mid = (e) => ks.reduce((a, k) => a + eY(k, e), 0) / ks.length; y0 = mid(r.e); y1 = mid(r.e + m.d); }
      const dir = Math.sign(y1 - y0), a = document.createElementNS(NS, "g"); a.setAttribute("class", "o-arrow");
      a.innerHTML = `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1 - dir * 14}"/><path d="M${x - 14} ${y1 - dir * 18} L${x + 14} ${y1 - dir * 18} L${x} ${y1 + dir * 4} Z"/>`;
      if (m.finger) { const ty = Math.min(y0, y1) + Math.abs(y1 - y0) / 2, lb = document.createElementNS(NS, "g"); lb.setAttribute("class", "o-finger");
        lb.innerHTML = `<rect x="${x + 26}" y="${ty - 30}" width="${m.finger.length * 26 + 60}" height="60" rx="30"/><text x="${x + 56}" y="${ty + 12}">${m.finger} ${dir < 0 ? "↑" : "↓"}</text>`; a.appendChild(lb); }
      svg.appendChild(a); const els = moving(m); els.forEach(e => e.classList.add("go")); return () => { a.remove(); els.forEach(e => e.classList.remove("go")); };
    }
    function focus(rod) {   // рамка около една пръчка (подсказка „погледни тук“), без да показва движението
      const f = document.createElementNS(NS, "rect"); f.setAttribute("class", "o-focus");
      f.setAttribute("x", xOf(rod) - BW / 2 - 18); f.setAttribute("y", 24); f.setAttribute("width", BW + 36); f.setAttribute("height", H - 48); f.setAttribute("rx", 30);
      svg.appendChild(f); return () => f.remove();
    }
    async function demo(ms, together, slow) {   // показва движенията (по едно или наведнъж – щипка); slow – за „Зори показва“
      const groups = together ? [ms] : ms.map(m => [m]);
      for (const gr of groups) { const un = gr.map(mark); await wait(slow ? 1800 : 1000); gr.forEach(m => { st = E.apply(st, m) || st; }); upd(); await wait(slow ? 1400 : 700); un.forEach(f => f()); await wait(250); }
    }
    return { reset: () => { st = E.make(rods); moves = []; upd(); }, set: (v) => { st = E.fromValue(v, rods); moves = []; upd(); }, value: () => E.value(st), moves: () => moves.slice(), enable: (v) => { on = v; },
      onChange: (f) => { onChange = f; }, demo, focus, state: () => JSON.stringify(st), hint: (ms) => { const un = ms.map(mark); setTimeout(() => un.forEach(f => f()), 2600); } };
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
  const BASE_STAGES = ["Флашкарти", "Абакус", "Флашкарти", "Без телескоп", "Игра"]; let STAGES = BASE_STAGES.slice();
  let M = null;
  function shell(i, title, raw) {
    if (!raw && M && M.isNew && !M.free && i >= 0) i += 1;   // при нова звезда първият етап е „Нова звезда“
    app.className = "o-scr o-mis";
    app.innerHTML = `<div class="o-mtop"><button class="o-back" id="o-quit">✕ Изход</button><div class="o-pips">${STAGES.map((t, j) => `<b class="${j < i ? "d" : j === i ? "c" : ""}" title="${t}"></b>`).join("")}</div><div class="o-mname">${title}</div></div>
      <div class="o-mbody"><div class="o-mz">${zori("explain")}<div class="o-say"></div></div><div class="o-mwork" id="o-work"></div></div>`;
    $("#o-quit").onclick = () => { gen++; screenHome(); };
  }
  const NEWSTAR = {
    1: ["Броим само топчетата до гредата. Палецът вдига, показалецът сваля.", [[0, "+", 1], [1, "+", 1], [2, "-", 2]], [[0, "+", 2], [2, "-", 1], [1, "+", 1]]],
    2: ["Три: палецът вдига три топчета наведнъж.", [[0, "+", 3], [3, "-", 3]], [[0, "+", 3], [3, "-", 2], [1, "+", 2]]],
    3: ["Четири: всички земни топчета с едно движение.", [[0, "+", 4], [4, "-", 4]], [[0, "+", 4], [4, "-", 3], [1, "+", 3]]],
    4: ["Небесното топче е пет. Мести го с показалеца.", [[0, "+", 5], [5, "-", 5]], [[0, "+", 5], [5, "-", 5], [3, "-", 3]]],
    5: ["Шест е щипка: небесното и едно земно – заедно.", [[0, "+", 6], [6, "-", 6]], [[0, "+", 6], [6, "-", 6], [5, "+", 1]]],
    6: ["Седем: щипка с две земни топчета.", [[0, "+", 7], [7, "-", 7]], [[0, "+", 7], [7, "-", 7], [2, "+", 5]]],
    7: ["Осем: щипка с три земни топчета.", [[0, "+", 8], [8, "-", 8]], [[0, "+", 8], [8, "-", 8], [3, "+", 5]]],
    8: ["Девет: всички топчета на пръчката.", [[0, "+", 9], [9, "-", 9]], [[0, "+", 9], [9, "-", 9], [4, "+", 5]]]
  };
  async function stageNew(n) {
    const d = NEWSTAR[n]; shell(0, STAR[n].title, true);
    await talk("Нова звезда! " + d[0], "explain");
    const w = $("#o-work"); w.innerHTML = `<div class="o-num" id="o-num"></div><div class="o-abhost" id="o-abh"></div><div class="o-vid">▶ видео с ръцете – скоро</div>`;
    const ab = abacus($("#o-abh"), 1); ab.enable(false);
    say("Гледай!", "point");
    for (const [a, op, k] of d[1]) { ab.set(a); $("#o-num").textContent = `${a} ${op === "+" ? "+" : "−"} ${k}`; await wait(500); const p = E.plan(a, op, k, 1); await ab.demo(p.moves, k >= 6); await wait(500); }
    say("Сега ти!", "explain"); await wait(900);
    for (const [a, op, k] of d[2]) {
      const target = op === "+" ? a + k : a - k, p = E.plan(a, op, k, 1), task = { start: a, op, n: k, rods: 1 };
      ab.set(a); ab.enable(true); $("#o-num").textContent = `${a} ${op === "+" ? "+" : "−"} ${k}`;
      await talk(`Имаме ${a}. ${op === "+" ? "Добави" : "Махни"} ${k}.`, "explain");
      let tries = 0;
      while (true) {
        const res = await new Promise(r => { ab.onChange(() => { const mv = ab.moves(); if (ab.value() === target) return r("hit"); if (!E.consistent(p.moves, mv)) r("off"); }); });
        ab.onChange(null);
        if (res === "hit") { const j = E.judge(task, ab.moves()); if (j.code === "ok") { good(); await wait(1300); break; } }
        tries++; ab.enable(false);
        if (tries >= 3) { say("Гледай!", "point"); ab.set(a); await ab.demo(p.moves, k >= 6); await wait(600); break; }
        say("Почти! Виж откъде да започнеш.", "wait"); await wait(900); ab.set(a); ab.hint(k >= 6 ? p.moves : p.moves.slice(0, 1)); await wait(1200); ab.enable(true);
      }
      M.help += tries ? 1 : 0;
    }
    await talk("Браво! Сега – сам със звездата.", "joy");
  }
  async function startMission(n) {
    gen++; const g = gen;
    const ex = EX[n] || EX[1], par = PAR[n] || PAR[1], max = MAXN[n] || 9;
    M = { n, ex, par, max, flash: [0, 0], ab: [0, 0], meth: [0, 0], im: [0, 0], help: 0 };
    try {
      await telescopeIn();
      M.isNew = !(P.b[n] > 0) && !!NEWSTAR[n]; STAGES = M.isNew ? ["Нова звезда", ...BASE_STAGES] : BASE_STAGES.slice();
      if (M.isNew) await stageNew(n);
      else { shell(0, STAR[n].title); await talk("Тази вечер звездата ни още е бледа. Ще я направим ли по-ярка?", "explain"); }
      const fs = n <= 3 ? 3 : n <= 6 ? 2.5 : 2; await stageFlash(0, 5, fs); await stageAbacus(); await stageFlash(2, 3, fs - .5); await stageMental(); await missionGame(); await finish();
    } catch (e) { if (e !== "stale") throw e; }
  }
  // приключва при „Готово“ или автоматично, щом абакусът покаже верния резултат
  function untilDone(ab, target) {
    const b = $("#o-done"); if (b) b.hidden = false;
    return new Promise(res => { let fin = false; const end = () => { if (!fin) { fin = true; ab.onChange(null); res(); } };
      if (b) b.onclick = end; if (ab.value() === target) return setTimeout(end, 500 * FAST);
      ab.onChange(() => { if (ab.value() === target) setTimeout(end, 500 * FAST); }); });
  }
  function choices(right, max) { const s = new Set([right]); while (s.size < Math.min(3, max + 1)) s.add(Math.floor(Math.random() * (max + 1))); return shuffle([...s]); }
  async function ask(opts, right) {
    const w = $("#o-work"); const row = document.createElement("div"); row.className = "o-ch";
    row.innerHTML = opts.map(v => `<button data-v="${v}">${v}</button>`).join(""); w.appendChild(row);
    return new Promise(res => row.querySelectorAll("button").forEach(b => b.onclick = () => { row.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.v === right) x.classList.add("ok"); }); if (+b.dataset.v !== right) b.classList.add("no"); setTimeout(() => res(+b.dataset.v === right), 700 * FAST); }));
  }
  // Зори говори по моменти: подготовка (глас само в първия кръг, после само надпис), показване – тишина, след скриване – въпрос, вярно / грешно.
  const once = (k, text, pose) => { if (k === 0) say(text, pose); else { const b = $(".o-say"); if (b) b.textContent = text; const z = $(".o-zori"); if (z && pose) z.src = `assets/img/zori/z_${pose}.png`; } };
  const thank = (v) => v <= 99 ? `Точно така! Това беше ${v}!` : "Точно така!";
  const dimAb = (rods) => `<div class="o-flash r${rods} o-dim">${abImg(0, rods)}<span>?</span></div>`;   // изгасен абакус с дискретно „?“
  // един „звезден сигнал“: число на абакуса за sec секунди → изгасен абакус → „Кое число видя?“ (3 бутона) → вярно / повторно показване и нов опит
  async function signalRound(t, sec, k, rec) {
    const w = $("#o-work"), v = randVal(t); rec.n = v; rec.showMs = Math.round(sec * 1000);
    const show = async (again) => { once(k || again ? 1 : 0, "Погледни абакуса!", "point"); if (!again) await wait(900);
      w.innerHTML = `${again ? '<div class="o-again">↺ Същият сигнал – още веднъж</div>' : ""}<div class="o-flash r${t.rods} o-sig">${abImg(v, t.rods)}</div>`; await wait(sec * 1000); };
    await show(false);
    const opts = new Set([v]); let g = 0; while (opts.size < 3 && g++ < 99) opts.add(randVal(t)); const list = shuffle([...opts]), tried = new Set(); let first = true;
    while (true) {
      w.innerHTML = `${dimAb(t.rods)}<div class="o-ch big">${list.map(x => `<button data-v="${x}"${tried.has(x) ? ' class="tried" disabled' : ""}>${x}</button>`).join("")}</div>`;
      once(first && k === 0 ? 0 : 1, "Кое число видя?", "explain"); if (first && k > 0) voice("Кое число видя?");
      const t0 = performance.now(), pick = await new Promise(res => w.querySelectorAll(".o-ch button").forEach(b => b.onclick = () => res(+b.dataset.v)));
      if (first) { rec.choice = pick; rec.rtMs = Math.round(performance.now() - t0); }
      if (pick === v) { rec.correct = first; w.querySelector(`.o-ch button[data-v="${v}"]`).classList.add("ok"); say(thank(v), "joy"); const z = $(".o-zori"); if (z) { z.classList.remove("hop"); void z.offsetWidth; z.classList.add("hop"); } await wait(1300); return first; }
      if (!first) { w.innerHTML = `<div class="o-flash r${t.rods}">${abImg(v, t.rods)}</div><div class="o-cq">${v}</div>`; say("Ето кое число беше.", "explain"); await wait(1900); return false; }
      first = false; rec.retries = 1; tried.add(pick); await talk("Нека го видим още веднъж.", "explain"); await show(true);
    }
  }
  // адаптивно време на сигналите (правило за методиста): ≥ 8 от последните 10 верни от първия опит в ≥ 2 различни дни → една стъпка по-бързо;
  // под 60% → една стъпка по-бавно; по време на игра не се променя
  const SIG = [5, 4, 3, 2.5, 2, 1.5, 1.2, 1, .8, .6, .4];
  function sigSpeed(topic) { P.ad = P.ad || {}; const a = P.ad["flash:" + topic]; return a ? a.speed : 3; }
  function sigAdapt(topic, results) {
    P.ad = P.ad || {}; const key = "flash:" + topic, a = P.ad[key] || (P.ad[key] = { speed: 3, hist: [] }), day = new Date().toDateString();
    results.forEach(c => a.hist.push({ d: day, c })); a.hist = a.hist.slice(-10);
    const okN = a.hist.filter(h => h.c).length, days = new Set(a.hist.map(h => h.d)).size, i = SIG.indexOf(a.speed);
    if (a.hist.length >= 10 && okN >= 8 && days >= 2 && i < SIG.length - 1) { a.speed = SIG[i + 1]; a.hist = []; }
    else if (a.hist.length >= 5 && okN / a.hist.length < .6 && i > 0) { a.speed = SIG[i - 1]; a.hist = []; }
    save();
  }
  async function stageFlash(i, count, sec) {
    shell(i, STAR[M.n].title); await talk(i === 0 ? "Звездни сигнали!" : "Още звездни сигнали – малко по-бързо.", "point");
    const t = { rods: 1, stateMax: M.max };
    for (let k = 0; k < count; k++) { const rec = {}; const ok = await signalRound(t, sec, k, rec); M.flash[0] += ok ? 1 : 0; M.flash[1]++; }
  }
  async function stageAbacus() {
    shell(1, STAR[M.n].title); await talk("Абакус!", "explain"); let k = -1;
    const list = shuffle(M.ex).slice(0, 4);
    for (const nums of list) {
      const w = $("#o-work"); w.innerHTML = `<div class="o-num" id="o-num"></div><div class="o-abhost" id="o-abh"></div><div class="o-row"><button class="o-done" id="o-done" hidden>✓ Готово</button></div>`;
      const ab = abacus($("#o-abh"), 1); k++; once(k, "Смятай на абакуса!", "point"); await wait(k ? 600 : 1600);
      for (let i = 0; i < nums.length; i++) { const n = nums[i]; $("#o-num").textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); $("#o-num").className = "o-num" + (n < 0 && i ? " minus" : ""); await wait(M.par[0] * 1000 - 200); $("#o-num").textContent = ""; await wait(200); }
      const target = nums.reduce((a, b) => a + b, 0); $("#o-num").textContent = "= ?"; once(k, "Колко стана?", "explain"); if (k) voice("Колко стана?");
      await untilDone(ab, target);
      ab.enable(false); const got = ab.value(), j = E.judgeChain(nums, ab.moves(), 1);
      const right = got === target, method = right && j.steps.every(s => s.code === "ok");
      M.ab[0] += right ? 1 : 0; M.ab[1]++; M.meth[0] += method ? 1 : 0; M.meth[1]++;
      if (method) { good(thank(target)); }
      else if (right) say("Отговорът е верен! Следващия път – с правилните движения.", "explain");
      else { say("Почти! Ето колко стана.", "wait"); ab.set(target); }
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
    flash: { name: "Звездни сигнали", adult: "Флашкарти", sub: "кое число видя?", skill: "разпознаване на образа на числото (първо точно, после по-бързо)",
      opts: { topic: "тема", speed: [["auto", "авто"], 5, 4, 3, 2.5, 2, 1.5, 1, .8, .6], rounds: [5, 8, 12] } },
    fix: { name: "Поправи телескопа", sub: "с едно движение", skill: "четене на числото и правилното движение",
      opts: { topic: "тема", rounds: [3, 5, 8] } },
    memory: { name: "Нощна памет", sub: "виж и нареди", skill: "образа на числото – основа за въображаемия абакус",
      opts: { topic: "тема", speed: SPEEDS, rounds: [3, 5, 8] } },
    count: { name: "Звездно броене", sub: "колко звезди видя?", skill: "виждане на количество с един поглед; 6–10 като 5 и още",
      opts: { upto: [3, 5, 10], speed: [3, 2, 1.5, 1], rounds: [4, 6, 8] } }
  };
  const OPTNAME = { topic: "Тема", count: "Брой числа", speed: "Скорост (сек.)", rounds: "Кръгове", mode: "Начин", len: "Колко числа", upto: "До" };
  function defaults(id) {
    const n = Math.min(P.cur, 21), sp = (PAR[n] || PAR[9]);
    return { topic: TOPIC_OF[n] || "s9", count: 5, speed: id === "flash" ? "auto" : id === "memory" ? 2 : 2, rounds: GAMES[id].opts.rounds[1], mode: "ab", len: 2, upto: n < 3 ? 3 : n < 6 ? 5 : 10, ...(P.set && P.set[id] || {}) };
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
    app.innerHTML = `<div class="o-mtop"><button class="o-back" id="o-gx">✕ Изход</button><button class="o-back o-adult" id="o-gs"><i></i>⚙ <small>задръж</small></button>
      <div class="o-pips">${Array.from({ length: total }, (_, j) => `<b class="${j < round ? "d" : j === round ? "c" : ""}"></b>`).join("")}</div><div class="o-mname">${GAMES[id].name}</div></div>
      <div class="o-mbody"><div class="o-mz">${zori("explain")}<div class="o-say"></div></div><div class="o-mwork" id="o-work"></div></div>`;
    $("#o-gx").onclick = () => { gen++; screenGames(); }; holdBtn($("#o-gs"), () => { gen++; screenSettings(id); });
  }
  const inMission = () => !!M && !M.free;
  function pip(round) { const b = app.querySelectorAll(".o-game .o-pips b"); b.forEach((x, j) => { const st = x.classList.contains("star"); x.className = j < round ? "d" : j === round ? "c" : ""; if (st) x.classList.add("star"); }); }

  // ---- самите игри: връщат [верни, общо] ----
  async function playTrainer(c) {
    const t = topicFor(c.topic); let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const ex = E.simpleExample({ ...t, count: c.count }), nums = ex.nums, w = $("#o-work");
      const mind = c.mode === "mind";
      w.innerHTML = `<div class="o-num" id="o-num"></div>${mind ? `<div class="o-ghost">${abImg(0, t.rods)}</div>` : `<div class="o-abhost" id="o-abh"></div>`}<div class="o-row"><button class="o-done" id="o-done" hidden>✓ Готово</button></div>`;
      const ab = mind ? null : abacus($("#o-abh"), t.rods); once(k, mind ? "Смятай наум!" : "Смятай на абакуса!", "point"); await wait(k ? 700 : 1600);
      for (let i = 0; i < nums.length; i++) { const n = nums[i], el = $("#o-num"); el.textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); el.className = "o-num pop" + (n < 0 && i ? " minus" : ""); await wait(c.speed * 1000 - 200); el.textContent = ""; el.className = "o-num"; await wait(200); }
      const target = nums.reduce((a, b) => a + b, 0); $("#o-num").textContent = "= ?"; once(k, "Колко стана?", "explain"); if (k) voice("Колко стана?");
      let right;
      if (mind) { right = await ask(choices(target, Math.max(9, target + 3)), target); }
      else { await untilDone(ab, target); ab.enable(false); right = ab.value() === target; if (!right) ab.set(target); }
      $("#o-num").textContent = "= " + target; if (right) { ok++; pipStar(k); say(thank(target), "joy"); } else say("Почти! Ето колко стана.", "wait"); await wait(right ? 1300 : 2400);
    }
    return [ok, c.rounds];
  }
  async function playFlash(c) {
    const t = topicFor(c.topic), auto = c.speed === "auto", sec = auto ? sigSpeed(t.id) : +c.speed; let ok = 0; const res = [];
    P.log = P.log || {}; P.log.flash = P.log.flash || [];
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const rec = { t: Date.now(), topic: t.id, choice: null, correct: false, retries: 0, rtMs: null };
      const first = await signalRound(t, sec, k, rec); if (first) { ok++; pipStar(k); } res.push(first);
      P.log.flash.push(rec); if (P.log.flash.length > 300) P.log.flash.splice(0, P.log.flash.length - 300); save();
    }
    if (auto) sigAdapt(t.id, res);
    return [ok, c.rounds];
  }
  const TELE = (parts, total) => { const p = (i) => i < parts ? "on" : "";   // телескопът се сглобява: статив, тръба, окуляр, леща, светлина
    return `<svg viewBox="0 0 220 200" class="o-tele${parts >= total ? " done" : ""}"><g class="t-leg ${p(0)}"><path d="M110 120 L70 190 M110 120 L110 190 M110 120 L150 190"/></g>
      <g class="t-tube ${p(1)}"><rect x="40" y="88" width="120" height="30" rx="10" transform="rotate(-24 100 103)"/></g><g class="t-eye ${p(2)}"><rect x="22" y="112" width="28" height="18" rx="5" transform="rotate(-24 36 121)"/></g>
      <g class="t-lens ${p(3)}"><circle cx="166" cy="72" r="18"/></g><g class="t-beam ${p(4)}"><path d="M180 64 L216 20 L216 60 Z"/></g></svg>`; };
  // „Поправи телескопа“: на абакуса е число с едно сгрешено движение; детето го поправя с едно движение.
  // Проверяват се отделно: (1) крайното число и (2) броят и видът на движенията (спрямо единственото правилно движение).
  // 1-ва грешка → подсказка без решението (рамка около пръчката + „повече/по-малко“ или „с едно движение“);
  // 2-ра грешка → „Зори показва“: същият абакус и същият модел, бавно движение със стрелка и пръст; връщане в началото → „Сега опитай ти“.
  // Звездичка (самостоятелно) – само от първия опит без помощ. След показване следва сходна задача (същото движение), за да видим дали вече го може само.
  const NUMW = ["", "едно топче", "две топчета", "три топчета", "четирите топчета"];
  function fixSay(m) {
    if (m.bead === "h") return m.d > 0 ? "Показалецът сваля небесното топче до гредата." : "Показалецът вдига небесното топче от гредата.";
    const n = Math.abs(m.d), one = n === 1 ? "" : " – наведнъж";
    return m.d > 0 ? `Палецът вдига ${NUMW[n]} до гредата${one}.` : `Показалецът сваля ${NUMW[n]} от гредата${one}.`;
  }
  const fixFinger = (m) => m.bead === "e" && m.d > 0 ? "палец" : "показалец";
  function fixTask(t, like, avoid) {   // like = {bead, d} на правилното движение → сходна задача
    for (let g = 0; g < 300; g++) { const target = randVal(t), st0 = E.fromValue(target, t.rods), rod = Math.floor(Math.random() * t.rods), opts = [];
      for (let d = 1; d <= 4; d++) opts.push({ rod, bead: "e", d }, { rod, bead: "e", d: -d }); opts.push({ rod, bead: "h", d: 5 }, { rod, bead: "h", d: -5 });
      const okm = opts.filter(o => E.apply(st0, o) && (!like || (o.bead === like.bead && -o.d === like.d))); if (!okm.length || (like && target === avoid)) continue;
      const o = okm[Math.floor(Math.random() * okm.length)];
      return { target, wrong: E.value(E.apply(st0, o)), fix: { rod, bead: o.bead, d: -o.d } }; }
    return like ? fixTask(t) : { target: 0, wrong: 1, fix: { rod: 0, bead: "e", d: -1 } };
  }
  function fixJudge(ab, task) {   // отделно: числото и движенията
    const ms = ab.moves(), valueOk = ab.value() === task.target, f = task.fix;
    const movesOk = ms.length === 1 && ms[0].rod === f.rod && ms[0].bead === f.bead && ms[0].d === f.d;
    return { value: ab.value(), valueOk, moves: ms.map(m => ({ rod: m.rod, bead: m.bead, d: m.d })), movesOk };
  }
  // чака детето: „Провери“ е активно чак след първото движение; при верен резултат приключва само
  function fixAttempt(ab, task) {
    const b = $("#o-done"); b.disabled = true; b.hidden = false; ab.enable(true);
    return new Promise(res => { let fin = false; const end = () => { if (!fin) { fin = true; ab.onChange(null); ab.enable(false); b.disabled = true; res(fixJudge(ab, task)); } };
      b.onclick = end; ab.onChange(() => { b.disabled = false; if (ab.value() === task.target) setTimeout(end, 600 * FAST); }); });
  }
  async function playFix(c) {
    const t = topicFor(c.topic); let solo = 0, built = 0; const total = c.rounds, tele = () => TELE(Math.round(built * 5 / total), 5);
    P.log = P.log || {}; P.log.fix = P.log.fix || []; let like = null, prev = null;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const task = fixTask(t, like, prev && prev.target), rec = { t: Date.now(), topic: t.id, target: task.target, wrong: task.wrong, fix: task.fix, similar: !!like, tries: [], hints: [], shown: 0, repeated: null, solo: false };
      const w = $("#o-work"); w.innerHTML = `<div class="o-fix"><div class="o-fixhead"><div class="o-fixgoal">Направи <b class="o-num pop">${task.target}</b></div>
        <div class="o-telebox" title="Телескоп">${tele()}<span>${built}/${total}</span></div></div><div class="o-fixmsg" id="o-fixmsg"></div>
        <div class="o-abhost" id="o-abh"></div><div class="o-row"><button class="o-sec o-rew" id="o-rew" hidden>↺ Гледай пак</button><button class="o-done" id="o-done">✓ Провери</button></div></div>`;
      const ab = abacus($("#o-abh"), t.rods), msg = (x) => { $("#o-fixmsg").textContent = x; };
      ab.set(task.wrong); const start = ab.state();
      if (FAST_ON) window.OBS_T = { task, ab, rec };   // само за автоматичните проверки
      if (like) await talk("Още едно такова!", "point"); else once(k, "Поправи числото!", "point");
      // опит 1
      let r = await fixAttempt(ab, task); rec.tries.push(r);
      if (!(r.valueOk && r.movesOk)) {
        // подсказка без решението
        let unf = null;
        if (r.valueOk) { rec.hints.push("one-move"); await talk("Вярно! Сега опитай с едно движение.", "explain"); }
        else { rec.hints.push("rod"); ab.set(task.wrong); unf = ab.focus(task.fix.rod); await talk(task.target > task.wrong ? "Погледни тази пръчка. Трябва да стане повече." : "Погледни тази пръчка. Трябва да стане по-малко.", "point"); }
        ab.set(task.wrong); r = await fixAttempt(ab, task); rec.tries.push(r); if (unf) unf();
        if (!(r.valueOk && r.movesOk)) {
          // „Зори показва“ – същият абакус, същият модел; после обратно в началото
          const show = async () => { rec.shown++; msg("Зори показва"); $("#o-rew").hidden = true; $("#o-done").hidden = true; ab.enable(false); ab.set(task.wrong);
            say(rec.shown === 1 ? "Гледай!" : "Гледай още веднъж.", "point"); await wait(900);
            const m = { ...task.fix, finger: fixFinger(task.fix) }; say(fixSay(task.fix), "explain");
            $("#o-fixmsg").innerHTML = `Зори показва · <i>${m.finger} ${m.bead === "e" ? (m.d > 0 ? "↑" : "↓") : (m.d > 0 ? "↓" : "↑")}</i>`; await ab.demo([m], true, true); await wait(900);
            ab.set(task.wrong); if (ab.state() !== start) throw new Error("fix: началното състояние не е възстановено");
            msg("Сега опитай ти"); $("#o-rew").hidden = false; await talk("Сега опитай ти.", "point"); };
          let r2Resolve = null, busy = false;
          $("#o-rew").onclick = async () => { if (busy) return; busy = true; ab.onChange(null); try { await show(); } catch (e) { if (e !== "stale") throw e; return; } finally { busy = false; } if (r2Resolve) r2Resolve(); };
          busy = true; await show(); busy = false;
          for (;;) {   // повторение след показване (↺ „Гледай пак“ започва опита отначало)
            const p = fixAttempt(ab, task), again = new Promise(res => { r2Resolve = () => res("again"); }); const x = await Promise.race([p, again]);
            if (x === "again") continue; r = x; break;
          }
          rec.tries.push(r); rec.repeated = r.valueOk && r.movesOk; $("#o-rew").hidden = true; msg("");
        }
      }
      const okNow = r.valueOk && r.movesOk;
      rec.solo = rec.tries.length === 1 && okNow;
      if (prev && rec.similar) prev.nextSolo = rec.solo;
      if (okNow) built++;
      if (rec.solo) { solo++; pipStar(k); say("Точно така!", "joy"); }
      else if (okNow && !rec.shown) say("Браво! Справи се.", "joy");
      else if (okNow) say("Браво! Ти го направи.", "joy");
      else { say("Ще го упражним пак.", "wait"); ab.set(task.target); }
      $(".o-telebox").innerHTML = tele() + `<span>${built}/${total}</span>`;
      P.log.fix.push(rec); if (P.log.fix.length > 300) P.log.fix.splice(0, P.log.fix.length - 300); save();
      like = rec.shown ? { bead: task.fix.bead, d: task.fix.d } : null; prev = rec.shown ? rec : null;
      await wait(okNow ? 1400 : 2400);
    }
    if (built >= total * .6) { $("#o-work").innerHTML = `<div class="o-telebox big">${TELE(5, 5)}</div>`; say("Телескопът отново вижда звездите!", "joy"); burst(); await wait(2200); }
    return [solo, c.rounds];
  }
  async function playMemory(c) {
    const t = topicFor(c.topic); let ok = 0;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const v = randVal(t) || 1, w = $("#o-work");
      const show = async (again) => { once(k || again ? 1 : 0, "Погледни и запомни!", "point"); if (!again) await wait(900);
        w.innerHTML = `${again ? '<div class="o-again">↺ Същото число – още веднъж</div>' : ""}<div class="o-flash r${t.rods} o-sig">${abImg(v, t.rods)}</div>`; await wait(c.speed * 1000); };
      await show(false); let right = false;
      for (let tr = 0; tr < 2; tr++) {
        w.innerHTML = `<div class="o-num">?</div><div class="o-abhost" id="o-abh"></div><div class="o-row"><button class="o-done" id="o-done">✓ Готово</button></div>`;
        once(k || tr ? 1 : 0, "Нареди същото число.", "explain"); if (k && !tr) voice("Нареди същото число.");
        const ab = abacus($("#o-abh"), t.rods); await untilDone(ab, v); ab.enable(false); right = ab.value() === v;
        if (right) { if (!tr) { ok++; pipStar(k); } $(".o-num").textContent = v; say(thank(v), "joy"); await wait(1300); break; }
        if (tr) { $(".o-num").textContent = v; ab.set(v); say("Ето кое число беше.", "explain"); await wait(2000); break; }
        await talk("Нека го видим още веднъж.", "explain"); await show(true);
      }
    }
    return [ok, c.rounds];
  }
  // „Звездно броене“ v3: малки съзвездия с фиксирани позиции (без припокриване); 6–10 = „петица“ + остатък (връзката с небесното топче = 5).
  // Ход: „Гледай звездите!“ (~1 с) → звездите светват едновременно → угасват едновременно → „Колко звезди видя?“ + 3 бутона (без лимит на времето)
  // → вярно: звездичка светва в горната лента, кратка реакция на Зори, следваща задача; грешно: спокойно повторно наблюдение. Всяка задача се записва (P.log.count).
  const PAT = { 1: [[100, 100]], 2: [[62, 70], [138, 130]], 3: [[100, 48], [52, 140], [148, 140]], 4: [[58, 58], [142, 58], [58, 142], [142, 142]],
                5: [[100, 30], [38, 82], [162, 82], [64, 160], [136, 160]] };
  const LNK = { 2: [[0, 1]], 3: [[0, 1], [1, 2], [2, 0]], 4: [[0, 1], [1, 3], [3, 2], [2, 0]], 5: [[0, 1], [1, 3], [3, 4], [4, 2], [2, 0]] };
  function cluster(n, ox) { const p = PAT[n] || []; return (LNK[n] || []).map(([a, b]) => `<line x1="${ox + p[a][0]}" y1="${p[a][1]}" x2="${ox + p[b][0]}" y2="${p[b][1]}" class="o-clink"/>`).join("") +
    p.map(([x, y]) => `<g transform="translate(${ox + x} ${y})"><path class="o-cs" fill="url(#csg)" d="${starPath(26)}"/></g>`).join(""); }
  const CSG = `<defs><radialGradient id="csg" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".45" stop-color="#FFD36A"/><stop offset="1" stop-color="#F29A2E"/></radialGradient></defs>`;
  function countSVG(v) {
    if (v <= 5) return `<svg viewBox="-10 0 220 200" class="o-cnt">${CSG}${cluster(v, 0)}</svg>`;
    return `<svg viewBox="-10 0 500 200" class="o-cnt">${CSG}${cluster(5, 0)}${cluster(v - 5, 280)}</svg>`;
  }
  function telescopeIn() {
    const m = document.documentElement; if (m.classList.contains("o-calm") || m.classList.contains("o-still") || FAST_ON) return Promise.resolve();
    const o = document.createElement("div"); o.className = "o-zoom"; o.innerHTML = `<div class="o-lens"></div>`; document.body.appendChild(o);
    return new Promise(r => setTimeout(() => { o.remove(); r(); }, 1300));
  }
  function pipStar(k) { const b = app.querySelectorAll(".o-pips b")[k]; if (b) b.classList.add("star"); }
  async function playCount(c) {
    let ok = 0; P.log = P.log || {}; P.log.count = P.log.count || [];
    const wk = $("#o-work"); if (wk) wk.classList.add("o-skyfield"); if (!inMission()) await telescopeIn();
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const v = 1 + Math.floor(Math.random() * c.upto), w = $("#o-work"), showMs = Math.round(c.speed * 1000);
      const rec = { t: Date.now(), n: v, showMs, choice: null, correct: false, retries: 0, rtMs: null };
      const look = async (again) => {   // again = повторно наблюдение на СЪЩИТЕ звезди (след грешен отговор)
        if (!again) { w.innerHTML = `<div class="o-cq soft">Гледай звездите!</div>`; if (k === 0) say("Гледай звездите!", "point"); else { const sb = $(".o-say"); if (sb) sb.textContent = "Гледай звездите!"; } await wait(1000); }
        w.innerHTML = `${again ? '<div class="o-again">↺ Същите звезди – още веднъж</div>' : ""}<div class="o-cbox">${countSVG(v)}</div>`; await wait(showMs);
        const b = $(".o-cbox"); if (b) b.classList.add("out"); await wait(320); };
      await look();
      const near = [v - 2, v - 1, v + 1, v + 2].filter(x => x >= 1 && x <= Math.max(c.upto, 5)); const opts = shuffle([v, ...shuffle(near).slice(0, 2)]);
      let first = true; const tried = new Set();
      while (true) {
        w.innerHTML = `<div class="o-cq">Колко звезди видя?</div><div class="o-ch big">${opts.map(x => `<button data-v="${x}"${tried.has(x) ? ' class="tried" disabled' : ""}>${x}</button>`).join("")}</div>`;
        if (first) voice("Колко звезди видя?");
        const t0 = performance.now();
        const pick = await new Promise(res => w.querySelectorAll(".o-ch button").forEach(b => b.onclick = () => res(+b.dataset.v)));
        if (first) { rec.choice = pick; rec.rtMs = Math.round(performance.now() - t0); }
        if (pick === v) { rec.correct = first; if (first) { ok++; pipStar(k); } w.querySelector(`.o-ch button[data-v="${v}"]`).classList.add("ok");
          say("Браво!", "joy"); const z = $(".o-zori"); if (z) { z.classList.remove("hop"); void z.offsetWidth; z.classList.add("hop"); } await wait(1000); break; }
        if (rec.retries >= 1) { w.innerHTML = `<div class="o-cbox">${countSVG(v)}</div><div class="o-cq">${v}</div>`; say("Ето колко бяха.", "explain"); await wait(1800); break; }
        first = false; rec.retries++; tried.add(pick);
        w.querySelector(`.o-ch button[data-v="${pick}"]`).classList.add("tried"); w.querySelectorAll(".o-ch button").forEach(b => b.disabled = true);
        await talk("Да погледнем пак!", "explain"); await look(true);
      }
      P.log.count.push(rec); if (P.log.count.length > 300) P.log.count.splice(0, P.log.count.length - 300); save();
    }
    return [ok, c.rounds];
  }
  const PLAY = { trainer: playTrainer, flash: playFlash, fix: playFix, memory: playMemory, count: playCount };
  const INTRO = { trainer: "Тренажор!", flash: "Звездни сигнали!", fix: "Поправи телескопа!", memory: "Нощна памет!", count: "Звездно броене!" };

  // в мисията: последният етап – една от игрите, с параметрите на занятието
  async function missionGame() {   // (фонът „нощно небе“ за броенето се слага в playCount)
    const id = ["count", "fix", "memory"][Math.floor(Math.random() * 3)], c = { ...defaults(id), rounds: id === "count" ? 4 : id === "fix" ? 4 : 3, upto: M.max < 3 ? 3 : M.max < 6 ? 5 : 10 };
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
    app.querySelectorAll(".o-gcard").forEach(b => b.onclick = () => screenStart(b.dataset.g));
  }
  // старт на игра: голям „Старт“; „Настройки за възрастен“ се отварят само със задържане (1 сек.), както в ПУ и АЕ
  function holdBtn(el, fn) { let t = null; const go = (e) => { e.preventDefault(); el.classList.add("hold"); t = setTimeout(() => { el.classList.remove("hold"); fn(); }, 1000); }, stop = () => { clearTimeout(t); el.classList.remove("hold"); };
    el.addEventListener("pointerdown", go); el.addEventListener("pointerup", stop); el.addEventListener("pointerleave", stop); el.addEventListener("pointercancel", stop); }
  function screenStart(id) {
    gen++; const g = GAMES[id];
    app.className = "o-scr o-map o-gamesbg";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към игрите</button><div class="o-grow"><div class="o-mt">${g.name}</div><div class="o-ms">${g.sub}</div></div></div>
      <div class="o-set"><div class="o-gic big">${ICON[id]}</div><div class="o-startz">${zori("explain")}</div></div>
      <div class="o-sbar"><button class="o-sec o-adult" id="o-adult"><i></i>⚙ Настройки за възрастен <small>задръж</small></button><button class="o-go" id="o-start">▶ Старт</button></div>`;
    $("#o-back").onclick = screenGames; $("#o-start").onclick = () => runGame(id); holdBtn($("#o-adult"), () => screenSettings(id));
  }
  function screenSettings(id) {
    gen++; const g = GAMES[id], c = defaults(id);
    const chip = (k, v, label) => `<button class="o-chip${String(c[k]) === String(v) ? " on" : ""}" data-k="${k}" data-v="${v}">${label}</button>`;
    const row = (k) => { const o = g.opts[k]; let chips;
      if (o === "tema" || o === "тема") chips = TOP.map(t => chip(k, t.id, t.name)).join("");
      else chips = o.map(v => Array.isArray(v) ? chip(k, v[0], v[1]) : chip(k, v, String(v).replace(".", ","))).join("");
      return `<div class="o-srow"><div class="o-sk">${OPTNAME[k]}</div><div class="o-chips">${chips}</div></div>`; };
    app.className = "o-scr o-map o-gamesbg";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Назад</button><div class="o-grow"><div class="o-mt">${g.name}</div><div class="o-ms">Настройки за възрастен${g.adult ? " · " + g.adult : ""} · тренира: ${g.skill}</div></div></div>
      <div class="o-set"><div class="o-gic big">${ICON[id]}</div><div class="o-srows">${Object.keys(g.opts).map(row).join("")}<div class="o-srow"><div class="o-sk">Анимации</div><div class="o-chips">${[["full", "нормални"], ["calm", "намалени"], ["off", "без"]].map(m => `<button class="o-chip o-motion${(P.motion || "full") === m[0] ? " on" : ""}" data-m="${m[0]}">${m[1]}</button>`).join("")}</div></div></div></div>
      <div class="o-sbar"><button class="o-sec" id="o-home2">Към обсерваторията</button><button class="o-go" id="o-start">▶ Старт</button></div>`;
    app.querySelectorAll(".o-chip").forEach(b => b.onclick = () => { const k = b.dataset.k, v = b.dataset.v; c[k] = isNaN(+v) ? v : +v;
      app.querySelectorAll(`.o-chip[data-k="${k}"]`).forEach(x => x.classList.toggle("on", x === b)); P.set = P.set || {}; P.set[id] = { ...(P.set[id] || {}), [k]: c[k] }; save(); });
    $("#o-back").onclick = () => screenStart(id); $("#o-home2").onclick = screenHome; $("#o-start").onclick = () => runGame(id);
    app.querySelectorAll(".o-motion").forEach(b => b.onclick = () => { P.motion = b.dataset.m; save(); applyMotion(); app.querySelectorAll(".o-motion").forEach(x => x.classList.toggle("on", x === b)); });
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
    const today = new Date().toDateString(); P.done = P.done || {}; P.rev = P.rev || {};
    if (before >= 3 && earned >= 2 && P.done[n] && P.done[n] !== today) P.rev[n] = 1; if (after >= 3 && !P.done[n]) P.done[n] = today;
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
  if (Q.get("p")) { P = prof(Q.get("p")); applyMotion(); Q.get("m") ? startMission(+Q.get("m")) : Q.get("map") ? screenMap() : screenHome(); } else screenProfiles();
  window.OBS = { _countSVG: (v) => countSVG(v), screenHome, screenMap, startMission, screenGames, screenSettings, screenResult, runGame, profile: () => P,
    testFinish: (n, r) => { M = Object.assign({ n, ex: [], par: PAR[n], max: MAXN[n], flash: [5, 6], ab: [3, 4], meth: [3, 4], im: [2, 3], help: 0 }, r || {}); return finish(); } };   // само за проверки
})();
