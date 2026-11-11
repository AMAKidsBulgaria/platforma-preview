/* Звездна обсерватория – прототип на отделното приложение за ментална аритметика (observatory.html).
   Екрани: профил → обсерватория → звездна карта (област „Аврора“ = модул „Просто“) → мисия (5 етапа) → откритие.
   Математиката: engine.js (примерите от конспектите – examples.js; проверка на движенията – judgeChain). Зори – картинки и запис на гласа.
   Напредъкът на прототипа се пази в localStorage (по профил); яркост на звездата 0–3 + ореол („без телескоп“). */
(function () {
  const E = window.ABACUS_ENGINE, EX = window.OBS_EXAMPLES || {}, Q = new URLSearchParams(location.search);
  const $ = (s, r) => (r || document).querySelector(s);
  const app = document.getElementById("obs");

  // ---- небето: област „Аврора“ (модул „Просто“) – 3 съзвездия, 21 звезди (= занятията) ----
  const CONST5 = [
    { id: "A", name: "Първи светлини", sub: "числата 0–9", stars: [
      [1, "0, 1, 2", 110, 430], [2, "Числото 3", 170, 360], [3, "Числото 4", 245, 400], [4, "Числото 5", 300, 320], [5, "Щипката · 6", 380, 350],
      [6, "Числото 7", 430, 270], [7, "Числото 8", 360, 210], [8, "Числото 9", 280, 230], [9, "Звездна нощ", 210, 160, 1]] },
    { id: "B", name: "Двете ръце", sub: "до 99", stars: [
      [10, "Кръгли десетици", 560, 420], [11, "11–19", 620, 360], [12, "Огледални", 690, 395], [13, "До 44", 735, 320],
      [14, "До 55", 690, 250], [15, "Двойна щипка", 760, 190], [16, "До 99", 840, 240], [17, "Звездна нощ", 880, 150, 1]] },
    { id: "C", name: "Далечни звезди", sub: "до 999 · по желание", stars: [
      [18, "Стотиците", 860, 470], [19, "До 555", 920, 410], [20, "До 999", 960, 340], [21, "Звездна нощ", 975, 270, 1]] }
  ];
  const LINES5 = { A: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]], B: [[10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17]], C: [[18, 19], [19, 20], [20, 21]] };
  // по-големите (7–9 и 10+, 11.11.2026): същото небе, 13 звезди = 13-те занятия на старшата програма (новото число и новият разряд заедно)
  const CONST7 = [
    { id: "A", name: "Първи светлини", sub: "0–9 и двуцифрени", stars: [
      [1, "0–4", 110, 430], [2, "Числото 5", 170, 360], [3, "Десетиците", 245, 400], [4, "6 · до 66", 300, 320], [5, "7 · до 77", 380, 350],
      [6, "8 · до 88", 430, 270], [7, "9 · до 99", 360, 210], [8, "Звездна нощ", 280, 230, 1]] },
    { id: "B", name: "Далечни звезди", sub: "до 999", stars: [
      [9, "Стотиците", 560, 420], [10, "До 999", 640, 360], [11, "Затвърждаване", 720, 395], [12, "Подготовка", 790, 320], [13, "Контролна", 860, 250, 1]] }];
  const LINES7 = { A: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]], B: [[9, 10], [10, 11], [11, 12], [12, 13]] };
  let CONST = CONST5, LINES = LINES5, STAR = {};
  const buildStars = () => { STAR = {}; CONST.forEach(c => c.stars.forEach(s => { STAR[s[0]] = { n: s[0], title: s[1], x: s[2], y: s[3], big: !!s[4], c: c.id }; })); };
  buildStars();
  const FAR = [["Орион", "Братя", 1140, 120], ["Плеяди", "Приятели", 1250, 330], ["Вега", "Преход", 1200, 560], ["Андромеда", "Приятели и братя", 1340, 450], ["Поларис", "наум", 1360, 110]];
  // параметри на мисията по занятие (от картата на модула): скорост на абакуса, на флашкартите, на въображаемия
  const PAR = { 1: [2.5, 1.8, 2.5], 2: [2.0, 1.8, 2.5], 3: [2.0, 1.6, 2.0], 4: [2.0, 1.6, 2.0], 5: [2.2, 1.5, 2.0], 6: [2.0, 1.4, 2.0], 7: [2.0, 1.4, 2.0], 8: [2.0, 1.2, 2.0], 9: [1.8, 1.2, 2.0] };
  const MAXN = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 9 };

  // ---- профили (демо) ----
  const AV = ["a1", "a4", "n1", "a2", "n3", "a6"];
  const DEMO = [
    { id: "lora", name: "Лора", av: "a1", age: 5, cur: 7, classAt: 7, hwTo: 6, format: "center", b: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, halo: { 1: 1, 2: 1, 3: 1 } },
    { id: "ivo", name: "Иво", av: "a4", age: 6, cur: 2, classAt: 2, hwTo: 1, format: "online", b: { 1: 2 }, halo: {} },
    { id: "nia", name: "Ния", av: "n1", age: 5, cur: 1, classAt: 1, format: "ai", b: {}, halo: {} },
    { id: "mira", name: "Мира", av: "n3", age: 8, group: "7", cur: 4, classAt: 4, hwTo: 3, format: "center", b: { 1: 3, 2: 3, 3: 2 }, halo: {} },
    { id: "kalin", name: "Калин", av: "a6", age: 11, group: "10", cur: 2, classAt: 2, hwTo: 1, format: "online", b: { 1: 3 }, halo: {} }
  ];
  // тест с деца (11.2026): 6 профила без истински имена; всяко дете започва от занятието си („За учителя“ → „Проведи занятие“)
  const TEST = [1, 2, 3, 4, 5, 6].map(i => ({ id: "t" + i, name: "Дете " + i, av: AV[i - 1], age: 5, cur: 1, classAt: 1, format: "center", b: {}, halo: {} }));
  const ALLP = DEMO.concat(TEST);
  let TESTMODE = (() => { try { return localStorage.getItem("obs.test") === "1"; } catch (e) { return false; } })();
  const KEY = "obs.proto.v3";
  let DB = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} };
  const prof = (id) => { useGroup(DB[id] || ALLP.find(x => x.id === id)); if (!DB[id]) { const d = ALLP.find(x => x.id === id); DB[id] = JSON.parse(JSON.stringify(d));
      DB[id].hw = {}; HW.lessons.filter(L => L.n <= (d.hwTo || 0)).forEach(L => { DB[id].hw[L.id] = L.rounds.map((_, i) => i); }); save(); }   // демо: по-старите домашни са изиграни
    return DB[id]; };
  let P = null;

  // ---- домашно (както в ПУ и АЕ): учителят възлага занятие от своя профил (офис → „Пилот“ → „Домашни“, lesson_id MA01…MA21);
  // „Продължи“ води към следващия незавършен кръг на НАЙ-НОВОТО възложено незавършено домашно (детето остава с групата);
  // по-старите незавършени – „Доиграй“, по желание. Демо: възложени са занятията до P.classAt (?class=N или „За учителя“).
  let HW = { lessons: [], unlock: [] };
  // възрастова група: 5 (5–6 г., 21 занятия), 7 (7–9 г.) и 10 (10+) – по 13 занятия; групата избира плана, небето и параметрите
  const HWS = { 5: HW, 7: HW, 10: HW };
  const hwReady = Promise.all([["5", "config/ma-homework.json?v=2"], ["7", "config/ma-homework-7.json?v=1"], ["10", "config/ma-homework-10.json?v=1"]].map(([g, u]) =>
    fetch(u).then(r => r.json()).then(j => { HWS[g] = j; }).catch(() => {}))).then(() => { HW = HWS[5]; });
  const groupOf = (p) => p && p.group ? String(p.group) : p && p.age >= 10 ? "10" : p && p.age >= 7 ? "7" : "5";
  function useGroup(p) { const g = groupOf(p); HW = HWS[g] || HWS[5]; CONST = g === "5" ? CONST5 : CONST7; LINES = g === "5" ? LINES5 : LINES7; buildStars(); return g; }
  const REVIEW = (() => { const r = Q.get("review"); try { if (r === "1") sessionStorage.setItem("obs.review", "1"); if (r === "0") sessionStorage.removeItem("obs.review"); return sessionStorage.getItem("obs.review") === "1"; } catch (e) { return r === "1"; } })();
  const classAt = () => Math.max(1, Math.min(HW.lessons.length || 21, P.classAt || P.cur || 1));
  const assignedL = () => HW.lessons.filter(L => L.n <= classAt());
  const hwDone = (L) => ((P.hw || {})[L.id] || []);
  const hwState = (L) => { const d = hwDone(L); return { done: d, complete: d.length >= L.rounds.length, next: L.rounds.findIndex((_, i) => !d.includes(i)) }; };
  const hwCurrent = () => assignedL().slice().reverse().find(L => !hwState(L).complete) || null;
  const hwOlder = () => { const c = hwCurrent(); return assignedL().filter(L => L !== c && !hwState(L).complete); };
  const unlockAt = (id) => { const u = HW.unlock.find(x => x.game === id); return u ? u.from : 1; };
  const isOpen = (id) => REVIEW || unlockAt(id) <= classAt();
  // формата на обучение (от профила на детето): присъствено → физически абакус; онлайн / AI тутор → дигитален абакус
  const FORMATS = [["center", "присъствено"], ["online", "онлайн"], ["ai", "с AI тутор"]];
  const usesDigital = () => (P.format || "center") !== "center";
  // връзка с платформата (както в АЕ): пилотното дете идва от js/sync.js (?pilot=… или „Кой играе?“ на общ таблет)
  const PS = window.PILOT_SYNC || null, CHILD = PS && PS.status && PS.status().child;
  // от сървъра: възложените от учителя занятия MA01…MA21 (най-новото определя докъде е групата) и изиграните кръгове (и от други таблети)
  function fromServer() {
    if (!CHILD) return; const rj = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null") || {}; } catch (e) { return {}; } };
    const ids = HW.lessons.map(L => L.id), hw = (rj("platforma.hw.server.v1")[CHILD] || []).filter(h => /^M[AS]\d{2}$/.test(h.lesson || ""));
    if (hw.length) { const at = Math.max(...hw.map(h => ids.indexOf(h.lesson) + 1)); if (at > 0) P.classAt = at; P.hwid = {}; hw.forEach(h => { P.hwid[h.lesson] = h.hw; }); }
    const led = rj("platforma.rounds.v1")[CHILD] || {}; P.hw = P.hw || {};
    Object.keys(led).filter(k => /^M[AS]\d{2}$/.test(k)).forEach(k => { const L = HW.lessons.find(x => x.id === k), d = P.hw[k] = P.hw[k] || [];
      led[k].forEach(n => { const i = Number(n) - 1; if (L && i >= 0 && i < L.rounds.length && !d.includes(i)) d.push(i); }); });
    save();
  }
  // към сървъра: всеки завършен кръг като „activity_completed“ (същият договор като ПУ и АЕ)
  function sendRound(L, i, id, ok, tot, t0) {
    if (!PS || !CHILD || !P || P.id !== CHILD) return;   // тестовите/демо профили не пишат в профила на влязлото дете
    try { PS.enqueue({ at: new Date(t0).toISOString(), lesson_id: L.id, round_id: i + 1, gameId: "ma_" + id, gameName: "Ментална аритметика: " + GAMES[id].name, hw: (P.hwid || {})[L.id] || null, st: i,
      total: tot || null, answered: tot || null, correct: tot ? ok : null, accuracy: tot ? Math.round(ok * 100 / tot) : null, seconds: Math.round((Date.now() - t0) / 1000), early: false, program: "mental_arithmetic", answers: [], events: [] }); } catch (e) { console.warn(e); }
  }

  // ---- глас: Зори (zr_*), иначе разказвачът (Калина) ----
  let AUDZ = {}, AUD = {}, cur = null;
  fetch("config/abacus-audio-zori.json?v=8").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUDZ[x.t] = x.f; })).catch(() => {});
  fetch("config/abacus-audio.json?v=4").then(r => r.ok ? r.json() : []).then(a => a.forEach(x => { AUD[x.t] = x.f; })).catch(() => {});
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
    const list = TESTMODE ? TEST : DEMO;
    app.innerHTML = `<div class="o-ptitle">Кой наблюдава тази вечер?</div>
      <div class="o-plist${TESTMODE ? " test" : ""}">${list.map(d => { const p = DB[d.id] || d; const lit = Object.values(p.b || {}).filter(v => v >= 3).length;
        return `<button class="o-pcard" data-id="${d.id}"><img src="assets/img/world/avatars/${p.av}.webp" alt=""><b>${p.name}</b><span>★ ${lit} звезди</span></button>`; }).join("")}</div>
      <p class="o-note">${TESTMODE ? "Тест с деца · " : "Прототип · демо профили · "}<button class="o-link" id="o-tmode">${TESTMODE ? "към демо профилите" : "тестови профили (Дете 1–6)"}</button>${TESTMODE ? "" : ' · <button class="o-link" id="o-reset">нулирай демото</button>'}</p>`;
    app.querySelectorAll(".o-pcard").forEach(b => b.onclick = () => { P = prof(b.dataset.id); applyMotion(); screenHome(); });
    const rs = $("#o-reset"); if (rs) rs.onclick = () => { DEMO.forEach(d => delete DB[d.id]); save(); screenProfiles(); };
    $("#o-tmode").onclick = () => { TESTMODE = !TESTMODE; try { localStorage.setItem("obs.test", TESTMODE ? "1" : "0"); } catch (e) {} screenProfiles(); };
  }

  const starPath = (R) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; d += (i ? "L" : "M") + (rr * Math.cos(a)).toFixed(1) + " " + (rr * Math.sin(a)).toFixed(1); } return d + "Z"; };
  // ---- небето като SVG (използва се и в прозореца на обсерваторията, и в картата) ----
  // видими съзвездия: А винаги; Б – щом детето стигне до него; В – след „Двете ръце“ (по желание). Останалите – мъглявини „?“
  const visibleC = (c) => groupOf(P) !== "5" ? (c === "A" || (c === "B" && classAt() >= 9)) : c === "A" || (c === "B" && P.cur >= 10) || (c === "C" && (P.b[17] || 0) >= 3);
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
  // начален екран в общата рамка на платформата (както „Моето пътешествие“ в АЕ): горе ⌂ · герой · програма · профил;
  // вляво голямото поле с обсерваторията и „Продължи“ (с реалния напредък); вдясно две карти – „Звездна карта“ и „Игри“
  function screenHome() {
    gen++; M = null; P.cur = classAt();
    const all = Object.keys(STAR), lit = all.filter(k => (P.b[k] || 0) >= 3).length, L = hwCurrent(), older = hwOlder();
    const LL = L || assignedL().slice(-1)[0], st = LL ? hwState(LL) : { done: [] };
    const line = !L ? "Браво! Домашното е готово." : st.done.length ? "Здравей! Да продължим домашното." : "Здравей! Днес имаме ново домашно.";
    const dots = LL ? `<span class="o-hdots">${LL.rounds.map((_, k) => `<i class="${st.done.includes(k) ? "on" : L && k === st.next ? "now" : ""}"></i>`).join("")}</span>` : "";
    const sub = L ? `Занятие ${L.n} · ${L.rounds[st.next].label} · кръг ${st.next + 1} от ${L.rounds.length}` : "Домашното е готово – виж звездите";
    app.className = "o-scr o-hubscr";
    app.innerHTML = `<section class="o-hub">
      <header class="o-hhead"><a class="o-hh" href="index.html" aria-label="Към Моят свят">⌂</a><img class="o-hz" src="assets/img/zori/z_explain.png" alt=""><b>Ментална аритметика</b>${REVIEW ? '<span class="o-review">преглед</span>' : ""}<span class="o-sp"></span>
        <a class="o-abac" href="abacus-app.html?p=${encodeURIComponent(P.id)}" aria-label="Абакус"><svg viewBox="0 0 40 32" aria-hidden="true"><rect x="2" y="2" width="36" height="28" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M2 12h36M12 2v28M20 2v28M28 2v28" stroke="currentColor" stroke-width="2"/><g fill="#5BE08A"><rect x="7.5" y="5" width="9" height="5" rx="2.5"/><rect x="15.5" y="14" width="9" height="5" rx="2.5"/><rect x="23.5" y="14" width="9" height="5" rx="2.5"/><rect x="23.5" y="20" width="9" height="5" rx="2.5"/></g></svg><b>Абакус</b></a>
        <button class="o-teach" id="o-teach" aria-label="За учителя (задръж)">👩‍🏫<i></i></button><button class="o-me" id="o-me"><img src="assets/img/world/avatars/${P.av}.webp" alt=""><b>${P.name}</b><span>смени</span></button></header>
      <div class="o-hgrid">
        <div class="o-hero">
          <div class="o-hbg"></div><button class="o-hwin" id="o-win" aria-label="Звездна карта"><div class="o-proj">${skySVG({ vb: "40 80 460 460" })}</div><div class="o-glass"></div></button>
          <div class="o-htitle"><b>Звездна обсерватория</b><small>Област Аврора</small></div>
          ${LL ? `<div class="o-hbadge"><b>Занятие ${LL.n}</b><small>${LL.title}</small>${dots}</div>` : ""}
          <div class="o-hstage"><div class="o-say">${line}</div>${zori(L ? "explain" : "joy")}<button class="o-kidb" id="o-kid"><img class="o-kid" src="assets/img/world/avatars/${P.av}.webp" alt=""><span>${P.name} · ти</span></button></div>
          ${older.length ? `<button class="o-hold" id="o-older">Доиграй: занятие ${older[older.length - 1].n}</button>` : ""}
          <button class="o-hgo" id="o-go"><em>${L ? "▶" : "★"}</em><span><b>${L ? "Продължи" : "Звездна карта"}</b><small>${sub}</small></span></button>
        </div>
        <button class="o-hcard" id="o-map"><img src="assets/img/obs/card_map.webp" alt=""><span class="o-htx"><b>Звездна карта</b><small>Моите открития</small><small class="o-hcount">★ ${lit} от ${all.length} звезди светят</small></span><i>›</i></button>
        <button class="o-hcard" id="o-games"><img src="assets/img/obs/card_games.webp" alt=""><span class="o-htx"><b>Игри</b><small>Тренирай уменията си</small></span><i>›</i></button>
      </div></section>`;
    voice(line);
    $("#o-go").onclick = () => L ? runHw(L, st.next) : screenMap();
    const ob = $("#o-older"); if (ob) ob.onclick = () => { const O = older[older.length - 1]; runHw(O, hwState(O).next); };
    $("#o-map").onclick = () => screenMap(); $("#o-games").onclick = screenGames; $("#o-win").onclick = () => screenMap(); $("#o-me").onclick = screenAvatar; $("#o-kid").onclick = screenAvatar;
    holdBtn($("#o-teach"), screenTeacher);
  }

  // ---- кръг от домашното: играта с точните настройки от учителя; без „Настройки“ ----
  async function runHw(L, i) {
    gen++; const r = L.rounds[i], id = r.game, c = { ...defaults(id, true), ...r.set }; M = { free: true, hw: L.id, n: L.n, max: 9 };
    try {
      gameShell(id, 0, c.rounds, `Занятие ${L.n} · кръг ${i + 1} от ${L.rounds.length}`); await talk(INTRO[id], "explain");
      const t0 = Date.now(), [ok, tot] = await PLAY[id](c); sendRound(L, i, id, ok, tot, t0);
      P.hw = P.hw || {}; const d = P.hw[L.id] = P.hw[L.id] || []; if (!d.includes(i)) d.push(i);
      P.hwres = P.hwres || {}; (P.hwres[L.id] = P.hwres[L.id] || {})[i] = { game: id, mode: c.mode || null, ok, tot, t: Date.now() }; save();
      hwState(L).complete ? hwComplete(L) : screenHwRound(L, i, ok, tot);
    } catch (e) { if (e !== "stale") throw e; }
  }
  function screenHwRound(L, i, ok, tot) {
    gen++; const st = hwState(L), nx = st.next;
    app.className = "o-scr o-end";
    app.innerHTML = `<div class="o-endbox">${zori("joy")}<div class="o-say"></div>
      <div class="o-gres">Занятие ${L.n} · ${L.rounds[i].label}: <b>${ok} от ${tot}</b></div>
      <div class="o-hdots big">${L.rounds.map((_, k) => `<i class="${st.done.includes(k) ? "on" : k === nx ? "now" : ""}"></i>`).join("")}</div>
      <div class="o-sbar"><button class="o-sec" id="o-rh">Към обсерваторията</button><button class="o-go" id="o-next">▶ Продължи<small>${L.rounds[nx].label} · кръг ${nx + 1} от ${L.rounds.length}</small></button></div></div>`;
    say("Браво! Още един кръг е готов.", "joy"); setTimeout(burst, 300);
    $("#o-rh").onclick = screenHome; $("#o-next").onclick = () => runHw(L, nx);
  }
  // домашното е готово → яркостта на звездата (занятие N = звезда N) от резултатите: Звездни сигнали ≥ 80%, абакус ≥ 75%, без телескоп ≥ 67% – по една точка
  function hwComplete(L) {
    gen++; const res = Object.values((P.hwres || {})[L.id] || {}), sum = (f) => res.filter(f).reduce((a, x) => [a[0] + x.ok, a[1] + x.tot], [0, 0]), q = (a) => a[1] ? a[0] / a[1] : null;
    const fl = q(sum(x => x.game === "flash")), ab = q(sum(x => x.game === "trainer" && x.mode === "ab")), im = q(sum(x => x.game === "trainer" && x.mode === "mind"));
    const met = (fl != null && fl >= .8 ? 1 : 0) + (ab != null && ab >= .75 ? 1 : 0) + (im != null && im >= .67 ? 1 : 0);
    const n = L.n, before = P.b[n] || 0, after = Math.max(before, met); P.b[n] = after; if (im != null && im >= .67 && after >= 3) P.halo[n] = 1; save();
    const pc = (x) => x == null ? "—" : Math.round(x * 100) + "%";
    app.className = "o-scr o-end";
    app.innerHTML = `<div class="o-endsky">${STAR[n] ? skySVG({ vb: `${STAR[n].x - 300} ${STAR[n].y - 70} 600 360` }) : ""}</div>
      <div class="o-endbox">${zori("joy")}<div class="o-say"></div>
      <div class="o-gres">Домашното за занятие ${n} е готово!</div>
      <div class="o-res"><div><b>${pc(fl)}</b>звездни сигнали</div><div><b>${pc(ab)}</b>абакус</div><div><b>${pc(im)}</b>без телескоп</div></div>
      <div class="o-stars">${"★".repeat(after)}${"☆".repeat(3 - after)}</div>
      <div class="o-sbar"><button class="o-sec" id="o-tomap">Към картата</button><button class="o-go" id="o-home">Към обсерваторията</button></div></div>`;
    say(after > before ? "Небето е подредено за тази вечер. Звездата стана по-ярка!" : "Браво! Домашното е готово.", "joy"); burst();
    $("#o-tomap").onclick = () => screenMap(n); $("#o-home").onclick = screenHome;
  }
  // ---- „За учителя“ (демо, задръж): кое занятие е проведено, докъде е домашното; таблицата за отключване на игрите (за ревизия) ----
  function screenTeacher() {
    gen++; const at = classAt(), max = HW.lessons.length;
    const rows = HW.lessons.map(L => { const st = hwState(L), d = st.done.length, k = L.rounds.length;
      const s = L.n > at ? "не е проведено" : st.complete ? "домашното е готово" : d ? `незавършено: ${d} от ${k} кръга` : "домашното не е започнато";
      return `<tr class="${L.n > at ? "fut" : st.complete ? "ok" : "open"}"><td>${L.id}</td><td>${L.title}</td><td>${L.rounds.map(r => r.label === "Игра" ? GAMES[r.game].name : r.label).join(" · ")}</td><td>${s}</td></tr>`; }).join("");
    const un = HW.unlock.map(u => `<tr class="${u.from <= at ? "ok" : "fut"}"><td>${u.name}</td><td>от занятие ${u.from}</td><td>${u.why}</td></tr>`).join("");
    app.className = "o-scr o-map o-gamesbg o-tscr";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към обсерваторията</button><div class="o-grow"><div class="o-mt">За учителя</div><div class="o-ms">${/^t\d$/.test(P.id) ? "тест" : "демо"} · ${P.name} · проведени занятия: ${at} от ${max}</div></div>
        <label class="o-tfmt">Форма на обучение <select id="o-t-fmt">${FORMATS.map(([k, v]) => `<option value="${k}" ${(P.format || "center") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <button class="o-sec" id="o-t-obs">📝 Наблюдение</button><button class="o-sec" id="o-t-exp">📤 Данни от теста</button><button class="o-sec" id="o-t-reset">Започни отначало</button><label class="o-tfmt">Възраст <select id="o-t-grp">${[["5", "5–6 г."], ["7", "7–9 г."], ["10", "10+"]].map(([k, v]) => `<option value="${k}" ${groupOf(P) === k ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="o-tfmt">Детето е на <select id="o-t-at">${HW.lessons.map(L => `<option value="${L.n}" ${L.n === at ? "selected" : ""}>занятие ${L.n}</option>`).join("")}</select></label><button class="o-go sm" id="o-t-next" ${at >= max ? "disabled" : ""}>Проведи занятие ${Math.min(max, at + 1)}</button></div>
      <div class="o-teachbox"><p class="o-tnote">Формата на обучение определя абакуса в „Звездни сметки“: присъствено – физически (отговорът с клавиатурата), онлайн и с AI тутор – дигиталният абакус до примерите. В платформата идва от профила на детето. В истинската платформа учителят възлага домашното от своя профил (офис → „Пилот“ → „Домашни“). Тук: всяко проведено занятие = възложено домашно. „Продължи“ води към най-новото незавършено; по-старите – „Доиграй“, по желание.</p>
        <table class="o-ttbl"><thead><tr><th>Код</th><th>Занятие</th><th>Кръгове на домашното</th><th>Състояние</th></tr></thead><tbody>${rows}</tbody></table>
        <h3>Свободни игри – отключване <small>(${HW.unlock_status || ""})</small></h3><table class="o-ttbl"><tbody>${un}</tbody></table></div>`;
    $("#o-back").onclick = screenHome;
    $("#o-t-fmt").onchange = (e) => { P.format = e.target.value; save(); };
    $("#o-t-next").onclick = () => { P.classAt = Math.min(max, at + 1); save(); screenHome(); };
    $("#o-t-exp").onclick = exportData; $("#o-t-obs").onclick = () => screenObserve();
    // тест: детето започва от занятието, на което е в групата – по-старите домашни се броят за изиграни (както при демо профилите)
    // смяна на възрастовата група: друг план (21 или 13 занятия) – започва отначало
    $("#o-t-grp").onchange = (e) => { P.group = e.target.value; P.classAt = 1; P.hw = {}; P.hwres = {}; P.b = {}; P.halo = {}; useGroup(P); save(); screenTeacher(); };
    $("#o-t-at").onchange = (e) => { const n = +e.target.value; P.classAt = n; P.hw = P.hw || {};
      HW.lessons.forEach(L => { if (L.n < n && !(P.hw[L.id] || []).length) P.hw[L.id] = L.rounds.map((_, i) => i); }); save(); screenTeacher(); };
    $("#o-t-reset").onclick = () => { P.classAt = 1; P.hw = {}; P.hwres = {}; P.b = {}; P.halo = {}; save(); screenHome(); };
  }
  // наблюдение на треньора (тест с деца): същите въпроси като страницата за записите; пази се в P.obs и влиза във файла „Данни от теста“ – без профили и вход
  const OBSQ = [
    ["1. Домашното през „Продължи“", [["hw", "Справи се", [["self", "Само", "g"], ["help", "С малко помощ", "m"], ["no", "Не успя", "b"]]]], "hw"],
    ["2. Дигитален абакус", [["ab_swipe", "Плъзгане", [["easy", "Естествено", "g"], ["shown", "След показване", "m"], ["hard", "Трудно", "b"], ["na", "Не е пробвано", "n"]]],
      ["ab_hit", "Уцелва ли топчетата", [["ok", "Уцелва", "g"], ["some", "Понякога грешно", "m"], ["often", "Често грешно", "b"], ["na", "Не е пробвано", "n"]]],
      ["ab_mind", "Просветване (мислено)", [["helps", "Помага", "g"], ["short", "Твърде кратко", "m"], ["unused", "Не го ползва", "b"], ["na", "Не е пробвано", "n"]]]], "ab"],
    ["3. Звездни сметки", [["tr_speed", "Скорост", [["slow", "Твърде бавно", "m"], ["good", "Добре", "g"], ["fast", "Твърде бързо", "b"], ["na", "Не е играно", "n"]]],
      ["tr_voice", "Гласът", [["clear", "Разбираем", "g"], ["unclear", "Неразбираем", "b"], ["off", "Без глас", "n"]]]], "tr"],
    ["4. Поправи телескопа", [["fx_hint", "Подсказката", [["yes", "Помогна", "g"], ["no", "Не помогна", "b"], ["na", "Не се стигна", "n"]]],
      ["fx_demo", "„Зори показва“", [["yes", "Помогна", "g"], ["no", "Не помогна", "b"], ["na", "Не се стигна", "n"]]],
      ["fx_next", "Следващият подобен", [["self", "Сам", "g"], ["help", "С помощ", "m"], ["na", "Не се стигна", "n"]]]], null]];
  function screenObserve() {
    gen++; P.obs = P.obs || []; const day = new Date().toISOString().slice(0, 10);
    let o = P.obs.find(x => x.date === day); if (!o) { o = { date: day, ratings: {}, notes: {}, games: [], adultHelp: 0, device: /iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "", lesson: classAt(), format: usesDigital() ? "дигитален абакус" : "физическо сметало" }; P.obs.push(o); }
    const names = Object.keys(GAMES).map(k => GAMES[k].name);
    app.className = "o-scr o-map o-gamesbg o-tscr";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← За учителя</button><div class="o-grow"><div class="o-mt">Наблюдение</div><div class="o-ms">${P.name} · ${day} · занятие ${o.lesson}</div></div></div>
      <div class="o-teachbox o-obs">
        <label class="o-of">Наблюдател (инициали)<input id="ob-who" maxlength="12" value="${(o.observer || "").replace(/"/g, "&quot;")}"></label>
        <label class="o-of">Възраст<select id="ob-age"><option value="5">5 г.</option><option value="6">6 г.</option></select></label>
        ${OBSQ.map(([t, qs, nk]) => `<h3>${t}</h3>${qs.map(([k, lab, ops]) => `<div class="o-oq"><span>${lab}</span><div class="o-och" data-k="${k}">${ops.map(([v, txt, c]) => `<button class="${c}${o.ratings[k] === v ? " on" : ""}" data-v="${v}">${txt}</button>`).join("")}</div></div>`).join("")}
          ${nk ? `<textarea data-n="${nk}" placeholder="Бележки">${(o.notes[nk] || "").replace(/</g, "&lt;")}</textarea>` : ""}`).join("")}
        <h3>5. Свободни игри <small>кои избра само</small></h3><div class="o-ogames">${names.map(n => `<label><input type="checkbox" value="${n}" ${o.games.includes(n) ? "checked" : ""}>${n}</label>`).join("")}</div>
        <label class="o-of">Минути общо<input id="ob-min" type="number" inputmode="numeric" min="0" max="120" value="${o.minutes == null ? "" : o.minutes}"></label>
        <h3>Помощ от възрастен</h3><div class="o-ocount"><button id="ob-hm">−</button><b id="ob-h">${o.adultHelp}</b><button id="ob-hp">+</button></div>
        <h3>С думите на детето</h3><textarea data-n="liked" placeholder="Хареса му">${(o.notes.liked || "").replace(/</g, "&lt;")}</textarea><textarea data-n="disliked" placeholder="Не му хареса">${(o.notes.disliked || "").replace(/</g, "&lt;")}</textarea><textarea data-n="other" placeholder="Други бележки">${(o.notes.other || "").replace(/</g, "&lt;")}</textarea>
        <p class="o-tnote">Записва се веднага на този телефон и влиза във файла „📤 Данни от теста“.</p>
      </div>`;
    $("#ob-age").value = String(o.age || P.age || 5);
    const keep = () => { o.observer = $("#ob-who").value.trim(); o.age = +$("#ob-age").value; o.minutes = $("#ob-min").value === "" ? null : +$("#ob-min").value;
      app.querySelectorAll("textarea[data-n]").forEach(t => { o.notes[t.dataset.n] = t.value.trim(); });
      o.games = [...app.querySelectorAll(".o-ogames input:checked")].map(x => x.value); o.savedAt = new Date().toISOString(); save(); };
    app.querySelectorAll(".o-och button").forEach(b => b.onclick = () => { const k = b.parentElement.dataset.k, on = b.classList.contains("on");
      b.parentElement.querySelectorAll("button").forEach(x => x.classList.remove("on")); if (!on) b.classList.add("on"); o.ratings[k] = on ? null : b.dataset.v; keep(); });
    app.querySelectorAll("input, select, textarea").forEach(e => e.addEventListener("change", keep));
    const hb = (d) => { o.adultHelp = Math.max(0, (o.adultHelp || 0) + d); $("#ob-h").textContent = o.adultHelp; keep(); };
    $("#ob-hm").onclick = () => hb(-1); $("#ob-hp").onclick = () => hb(1);
    $("#o-back").onclick = () => { keep(); screenTeacher(); };
  }
  // данни от теста: профилът (домашни, резултати, дневниците на игрите) + сесиите на абакуса за това дете → един JSON файл.
  // Телефон: „Сподели“ (Viber, имейл, Файлове); иначе – сваляне; ако и това не стане – текстът за копиране.
  async function exportData() {
    let ab = []; try { ab = JSON.parse(localStorage.getItem("ma.abacus.v1") || "[]").filter(x => x.p === P.id); } catch (e) {}
    const data = { kind: "ma-test-export", v: 1, exportedAt: new Date().toISOString(), child: P.id, name: P.name, device: navigator.userAgent, screen: [screen.width, screen.height], profile: P, abacus: ab };
    const txt = JSON.stringify(data), fn = `ma-test-${P.id}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
    try { const f = new File([txt], fn, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "Данни от теста – " + P.name }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); return; } catch (e) {}
    const box = $(".o-teachbox"); if (box) box.insertAdjacentHTML("afterbegin", `<textarea class="o-exp" readonly>${txt.replace(/</g, "&lt;")}</textarea>`);
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
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към обсерваторията</button><div class="o-grow"><div class="o-mt">Аврора</div><div class="o-ms">първата област от небето · модул „Просто“</div></div><button class="o-sec" id="o-mg">Игри ✦</button>${hwCurrent() ? `<button class="o-go sm" id="o-mc">▶ Продължи</button>` : ""}</div>
      <div class="o-mapwrap">${skySVG({ labels: 1, far: 1, focus, vb: "40 60 1400 580" })}</div>
      <div class="o-card" id="o-card" hidden></div>
      <div class="o-legend"><span><i class="lk"></i>предстои</span><span><i class="lv1"></i>упражняваме</span><span><i class="lv3"></i>научено</span><span><i class="rv"></i>проверено след време</span><span><i class="mind">✦</i>и наум</span></div>`;
    $("#o-back").onclick = screenHome; $("#o-mg").onclick = screenGames; const mc = $("#o-mc"); if (mc) mc.onclick = () => { const L = hwCurrent(); runHw(L, hwState(L).next); };
    app.querySelectorAll(".o-star").forEach(g => g.addEventListener("click", () => card(+g.dataset.n)));
    if (focus) card(focus);
    app.querySelectorAll(".o-star").forEach(g => g.addEventListener("click", () => { app.querySelectorAll(".o-lab.tmp").forEach(t => t.remove()); }));
  }
  function card(n) {
    const st = STAR[n], lv = P.b[n] || 0, el = $("#o-card"), locked = n > classAt() || (groupOf(P) === "5" && st.c === "C" && (P.b[17] || 0) < 3);
    const bars = ["Точност", "Начин", "Сам/а"].map((t, i) => `<div class="o-bar"><span>${t}</span><b class="${i < lv ? "on" : ""}"></b></div>`).join("");
    el.innerHTML = `<button class="o-x" aria-label="Затвори">✕</button><div class="o-ct">${st.title}</div>
      <div class="o-cs">${CONST.find(c => c.id === st.c).name}${st.big ? " · Звездна нощ" : ""}</div>
      ${locked ? `<p>Тази звезда още не се вижда. ${st.c === "C" ? "Отключва се след „Двете ръце“ – по желание." : "Ще я открием в следващите занятия."}</p>`
        : `<div class="o-bars">${bars}</div>${P.halo[n] ? '<p class="o-hl">✦ Смята я и наум</p>' : ""}${(P.rev || {})[n] ? '<p class="o-hl" style="color:#9FE3B8">◎ Проверена след време</p>' : ""}${(() => { const L = HW.lessons.find(x => x.n === n); if (!L || n > classAt()) return ""; const h = hwState(L);
          return h.complete ? '<p class="o-hl" style="color:#9FE3B8">✓ Домашното на занятие ' + n + ' е готово</p>' : `<button class="o-go sm" id="o-obs">${h.done.length ? "Доиграй" : "Започни"} домашното</button>`; })()}`}`;
    el.hidden = false; el.querySelector(".o-x").onclick = () => { el.hidden = true; };
    const ob = $("#o-obs"); if (ob) ob.onclick = () => { const L = HW.lessons.find(x => x.n === n); runHw(L, hwState(L).next); };
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
  // без бутон: приключва, щом числото стане вярно, или ако след поне едно движение детето спре за IDLE мс
  const IDLE = 4000;
  function untilIdle(ab, target) {
    return new Promise(res => { let fin = false, tm = null; const end = () => { if (!fin) { fin = true; clearTimeout(tm); ab.onChange(null); res(); } };
      ab.onChange(() => { clearTimeout(tm); if (ab.value() === target) setTimeout(end, 500 * FAST); else tm = setTimeout(end, IDLE * FAST); }); });
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
  async function signalRound(t, sec, k, rec, look) {   // look = вид „сигнал“: абакус (по подразбиране) или съзвездие
    look = look || { draw: (v) => `<div class="o-flash r${t.rods} o-sig">${abImg(v, t.rods)}</div>`, dim: () => dimAb(t.rods), say: "Погледни абакуса!", again: "↺ Същият сигнал – още веднъж" };
    const w = $("#o-work"), v = randVal(t); rec.n = v; rec.showMs = Math.round(sec * 1000); if (FAST_ON) window.OBS_T = { v };
    const show = async (again) => { once(k || again ? 1 : 0, look.say, "point"); if (!again) await wait(900);
      w.innerHTML = `${again ? `<div class="o-again">${look.again}</div>` : ""}${look.draw(v)}`; await wait(sec * 1000); };
    await show(false);
    const opts = new Set([v]); let g = 0; while (opts.size < 3 && g++ < 99) opts.add(randVal(t)); const list = shuffle([...opts]), tried = new Set(); let first = true;
    while (true) {
      w.innerHTML = `${look.dim()}<div class="o-ch big">${list.map(x => `<button data-v="${x}"${tried.has(x) ? ' class="tried" disabled' : ""}>${x}</button>`).join("")}</div>`;
      once(first && k === 0 ? 0 : 1, "Кое число видя?", "explain"); if (first && k > 0) voice("Кое число видя?");
      const t0 = performance.now(), pick = await new Promise(res => w.querySelectorAll(".o-ch button").forEach(b => b.onclick = () => res(+b.dataset.v)));
      if (first) { rec.choice = pick; rec.rtMs = Math.round(performance.now() - t0); }
      if (pick === v) { rec.correct = first; w.querySelector(`.o-ch button[data-v="${v}"]`).classList.add("ok"); say(thank(v), "joy"); const z = $(".o-zori"); if (z) { z.classList.remove("hop"); void z.offsetWidth; z.classList.add("hop"); } await wait(1300); return first; }
      if (!first) { w.innerHTML = `${look.draw(v).replace(" o-sig", "")}<div class="o-cq">${v}</div>`; say("Ето кое число беше.", "explain"); await wait(1900); return false; }
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
    constel: `<svg viewBox="0 0 100 100"><line x1="14" y1="38" x2="86" y2="38" stroke="#B88A4E" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/><g fill="#FFE08A"><path class="ic-s1" d="M50 8l4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1z"/><path class="ic-s2" d="M50 44l4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1z"/><path class="ic-s3" d="M50 70l4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1z"/></g></svg>`,
    comet: `<svg viewBox="0 0 100 100"><path class="ic-tail" d="M12 82 L62 40 L70 50 Z" fill="#8FC7FF" opacity=".55"/><circle class="ic-head" cx="68" cy="40" r="17" fill="#FFE08A"/><text x="68" y="47" text-anchor="middle" font-size="20" font-weight="900" fill="#2B2140" font-family="Nunito">7</text></svg>`,
    oops: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="#232A63" stroke="#B88A4E" stroke-width="5"/><text x="50" y="66" text-anchor="middle" font-size="46" font-weight="900" fill="#F5C04A" font-family="Nunito" class="ic-q">?</text><path class="ic-tw" d="M80 16l3 7 7 1-5 5 2 7-7-4-6 4 2-7-5-5 7-1z" fill="#FFE9A8"/></svg>`,
    count: `<svg viewBox="0 0 100 100"><g fill="#F5C04A"><path class="ic-s1" d="M30 18l5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z"/><path class="ic-s2" d="M70 34l5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z"/><path class="ic-s3" d="M38 58l5 11 12 1-9 8 3 12-11-6-10 6 3-12-9-8 12-1z"/></g></svg>`
  };
  const GAMES = {
    trainer: { name: "Звездни сметки", adult: "Тренажор", sub: "смятай примерите", skill: "смятане на абакуса и наум",
      opts: { topic: "тема", count: [3, 5, 7, 10], speed: SPEEDS, rounds: [3, 5, 8], voice: [["off", "без глас"], ["on", "с глас (под 1 сек. – без)"]] } },
    flash: { name: "Звездни сигнали", adult: "Флашкарти", sub: "кое число видя?", skill: "разпознаване на образа на числото (първо точно, после по-бързо)",
      opts: { topic: "тема", speed: [["auto", "авто"], 5, 4, 3, 2.5, 2, 1.5, 1, .8, .6], rounds: [5, 8, 12] } },
    fix: { name: "Поправи телескопа", sub: "с едно движение", skill: "четене на числото и правилното движение",
      opts: { topic: "тема", rounds: [3, 5, 8] } },
    memory: { name: "Нощна памет", sub: "виж и нареди", skill: "образа на числото – основа за въображаемия абакус",
      opts: { topic: "тема", speed: SPEEDS, rounds: [3, 5, 8] } },
    count: { name: "Звездно броене", sub: "колко звезди видя?", skill: "виждане на количество с един поглед; 6–10 като 5 и още",
      opts: { upto: [3, 5, 10], speed: [3, 2, 1.5, 1], rounds: [4, 6, 8] } },
    constel: { name: "Съзвездие-число", sub: "звезди като топчета", skill: "образа на числото без абакуса – стъпка към смятането наум",
      opts: { topic: "тема", speed: [4, 3, 2, 1.5, 1], rounds: [5, 8, 12] } },
    comet: { name: "Комета", sub: "нареди, преди да отлети", skill: "бързо и точно нареждане на числото",
      opts: { topic: "тема", speed: [8, 6, 5, 4], rounds: [5, 8, 12] } },
    oops: { name: "Провери Зори", sub: "вярно ли смята?", skill: "разбиране на правилото и самопроверка",
      opts: { topic: "тема", rounds: [4, 6, 8] } }
  };
  const OPTNAME = { tool: "Абакус", voice: "Глас за числата", topic: "Тема", count: "Брой числа", speed: "Скорост (сек.)", rounds: "Кръгове", mode: "Начин", len: "Колко числа", upto: "До" };
  function defaults(id, bare) {
    const n = Math.min(classAt(), 21), mine = (!bare && P.set && P.set[id]) || {};
    const keep = (P.set && P.set[id]) || {};   // гласът е избор за детето – важи и в домашното
    const L = HW.lessons.find(x => x.n === n), ab = L && (L.rounds.find(r => r.game === "trainer" && r.set.mode === "ab" && r.label === "Абакус") || {}).set;   // дължина и скорост – от домашното на последното занятие
    const c = { voice: keep.voice || "off", topic: lessonTopic(n), count: id === "trainer" && ab ? ab.count : 5, speed: id === "flash" ? "auto" : id === "constel" ? 3 : id === "comet" ? 8 : 2, rounds: GAMES[id].opts.rounds[1], mode: "ab", len: 2, upto: n < 3 ? 3 : n < 6 ? 5 : 10, ...mine };
    if (!bare && !topicOpen(c.topic)) c.topic = lessonTopic(n);
    if (!bare && id === "trainer" && ab && !(mine.speed)) c.speed = ab.speed;
    if (!bare) c.mode = "ab";   // „наум“ е само вид кръг в домашното („Без телескоп“), не настройка   // запомнена тема, която още не е учена → текущата
    return c;
  }
  // темите в настройките – само до учените (по проведеното занятие); в „преглед“ – всички
  // отворени теми: до най-напредналата тема в възложените занятия (по плана на групата на детето)
  const topicOpen = (id) => { if (REVIEW) return true; let mx = 0; assignedL().forEach(L => L.rounds.forEach(r => { const i = TOP.findIndex(t => t.id === (r.set || {}).topic); if (i > mx) mx = i; }));
    return TOP.findIndex(t => t.id === id) <= mx; };
  const lessonTopic = (n) => (HW.lessons.find(L => L.n === n) || {}).topic || TOPIC_OF[n] || "s9";
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
  function gameShell(id, round, total, hwTitle) {
    if (inMission()) { shell(4, STAR[M.n].title); return; }
    app.className = "o-scr o-mis o-game";
    app.innerHTML = `<div class="o-mtop"><button class="o-back" id="o-gx">✕ Изход</button>${hwTitle ? "" : `<button class="o-back o-adult" id="o-gs"><i></i>⚙ <small>задръж</small></button>`}
      <div class="o-pips">${Array.from({ length: total }, (_, j) => `<b class="${j < round ? "d" : j === round ? "c" : ""}"></b>`).join("")}</div><div class="o-mname">${GAMES[id].name}${hwTitle ? `<small>${hwTitle}</small>` : ""}</div></div>
      <div class="o-mbody"><div class="o-mz">${zori("explain")}<div class="o-say"></div></div><div class="o-mwork" id="o-work"></div></div>`;
    $("#o-gx").onclick = () => { gen++; hwTitle ? screenHome() : screenGames(); }; if (!hwTitle) holdBtn($("#o-gs"), () => { gen++; screenSettings(id); });
  }
  const inMission = () => !!M && !M.free;
  function pip(round) { const b = app.querySelectorAll(".o-game .o-pips b"); b.forEach((x, j) => { const st = x.classList.contains("star"); x.className = j < round ? "d" : j === round ? "c" : ""; if (st) x.classList.add("star"); }); }

  // ---- самите игри: връщат [верни, общо] ----
  // ---- „Звездни сметки“ (за възрастните – „Тренажор“): само примерите, като истинския тренажор; детето смята на своя абакус ----
  // Абакусът е отделен инструмент, не е част от играта: физически (отговорът – с клавиатурата), дигитален (abacus.html?embed=1 до примерите;
  // отговорът и всички движения идват от него) или наум (клавиатура). Глас за числата – по избор (вкл./изкл.).
  // Запис за всеки пример (P.log.trainer) – основа за AI тутора: числа, скорост, глас, откъде е отговорът, отговор, време, кога е показано всяко число,
  // движенията (при дигитален) и правилото на всяка стъпка от двигателя.
  // глас за числата: под 1 сек. на число се изключва сам; иначе записите се забързват (без промяна на тона), за да свършат преди следващото число
  const VOICE_MIN = 1, VOICE_FIT = .85, VOICE_MAXRATE = 2.5;
  let TRIM = {}; fetch("config/abacus-audio-trim.json?v=1").then(r => r.ok ? r.json() : {}).then(j => { TRIM = j; }).catch(() => {});   // [начало, край] на говора във всеки запис
  function numParts(i, n) { const op = n < 0 ? "минус" : "плюс", a = Math.abs(n); return i === 0 ? [String(n)] : AUD[`${op} ${a}`] ? [`${op} ${a}`] : [op, String(a)]; }
  async function numPrep(nums, sec) {   // зарежда записите на целия пример и изчислява скоростта на всяко число
    if (Q.get("voice") === "0" || sec < VOICE_MIN) return null;
    const meta = (f) => new Promise(res => { const a = new Audio("assets/audio/abacus/" + f); a.preload = "auto"; let ok = false;
      const done = () => { if (!ok) { ok = true; res(a); } }; a.addEventListener("loadedmetadata", done, { once: true }); a.addEventListener("error", done, { once: true }); setTimeout(done, 1500); a.load(); });
    return Promise.all(nums.map(async (n, i) => { const fs = numParts(i, n).map(p => AUD[p]).filter(Boolean), as = await Promise.all(fs.map(meta));
      as.forEach((a, k) => { const tr = TRIM[fs[k]]; a._from = tr ? tr[0] : 0; a._len = tr ? tr[1] - tr[0] : (isFinite(a.duration) ? a.duration : .8); });
      const dur = as.reduce((t, a) => t + a._len, 0) + (as.length - 1) * .03;
      const rate = Math.min(VOICE_MAXRATE, Math.max(1, dur / (sec * VOICE_FIT))); as.forEach(a => { a.playbackRate = rate; try { a.preservesPitch = true; a.webkitPreservesPitch = true; } catch (e) {} });
      return { as, rate }; }));
  }
  function numSay(clip) {
    if (!clip || !clip.as.length) return; try { if (cur) cur.pause(); } catch (e) {}
    const play = (k) => { const au = clip.as[k]; try { au.currentTime = au._from || 0; } catch (e) {} au.playbackRate = clip.rate; cur = au; au.play().catch(() => {});
      setTimeout(() => { if (cur !== au) return; if (k + 1 < clip.as.length) { au.pause(); play(k + 1); } else au.pause(); }, (au._len / clip.rate) * 1000 + 20); };   // само говорът, без тишината
    play(0);
  }
  function keypad(host, maxLen) {   // голяма клавиатура за отговора: 0–9, ⌫, ✓
    host.innerHTML = `<div class="o-kp"><div class="o-kpv" id="o-kpv">?</div><div class="o-kpk">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-d="${d}">${d}</button>`).join("")}<button data-d="back" aria-label="Изтрий">⌫</button><button data-d="0">0</button><button data-d="ok" class="ok" aria-label="Готово" disabled>✓</button></div></div>`;
    let v = ""; const show = () => { host.querySelector("#o-kpv").textContent = v || "?"; host.querySelector('[data-d="ok"]').disabled = !v; };
    return new Promise(res => host.querySelectorAll("button").forEach(b => b.onclick = () => { const d = b.dataset.d;
      if (d === "back") v = v.slice(0, -1); else if (d === "ok") { if (v) { host.querySelectorAll("button").forEach(x => x.disabled = true); return res(+v); } } else if (v.length < maxLen) v = (v === "0" ? "" : v) + d; show(); }));
  }
  let ABMSG = null; window.addEventListener("message", (e) => { const d = e.data || {}; if (d.src === "abacus" && ABMSG) ABMSG(d); });
  async function playTrainer(c) {
    const t = topicFor(c.topic), mind = c.mode === "mind", digi = !mind && usesDigital(), talkN = c.voice === "on"; let ok = 0;   // „наум“ – само като кръг „Без телескоп“ в домашното
    P.log = P.log || {}; P.log.trainer = P.log.trainer || []; const w = $("#o-work"); w.classList.add("o-trw");
    w.innerHTML = `<div class="o-trl${digi ? "" : " solo"}"><div class="o-trn" id="o-num"></div><div class="o-trq" id="o-trq"></div></div>` +
      (digi ? `<div class="o-trab" style="aspect-ratio:${220 + 180 * (t.rods - 1)} / 630"><iframe id="o-abf" title="Дигитален абакус" src="abacus.html?embed=1&mode=free&voice=0&rods=${t.rods}${P.touch ? "&touch=1" : ""}"></iframe></div>` : "");
    const abf = digi ? $("#o-abf") : null; let abVal = 0, abMoves = [];
    if (digi) { await new Promise(r => { abf.addEventListener("load", r, { once: true }); setTimeout(r, 4000); }); ABMSG = (d) => { abVal = d.value; if (d.move) abMoves.push({ ...d.move, at: Date.now() }); if (ABMSG.on) ABMSG.on(); }; }
    const abReset = () => { abVal = 0; abMoves = []; try { abf.contentWindow.postMessage({ src: "obs", type: "reset" }, "*"); } catch (e) {} };
    try {
      for (let k = 0; k < c.rounds; k++) {
        pip(k); const ex = E.simpleExample({ ...t, count: c.count, must: t.rods === 1 && !t.round && !t.teen && k % 2 === 0 ? t.opMax : 0 }), nums = ex.nums, num = $("#o-num"), q = $("#o-trq"); q.innerHTML = ""; if (digi) abReset();
        once(k, mind ? "Смятай наум!" : "Смятай на абакуса!", "point"); await wait(k ? 700 : 1600);
        const clips = talkN ? await numPrep(nums, c.speed) : null;   // под 1 сек. – без глас
        const shown = [], t0 = Date.now(); let acc = 0; const rules = [];
        for (let i = 0; i < nums.length; i++) { const n = nums[i];
          if (i) { const p = E.plan(acc, n < 0 ? "-" : "+", Math.abs(n), t.rods); rules.push(p.rule); } acc += n;
          num.textContent = i === 0 ? n : (n > 0 ? "+ " + n : "− " + -n); num.className = "o-trn pop" + (n < 0 && i ? " minus" : ""); shown.push(Date.now() - t0);
          if (clips) numSay(clips[i]); await wait(c.speed * 1000 - 200); num.textContent = ""; await wait(200); }
        const target = acc, tq = Date.now(); if (FAST_ON) window.OBS_T = { target, nums }; num.textContent = "= ?"; num.className = "o-trn"; once(k, "Колко стана?", "explain"); if (k) voice("Колко стана?");
        let ans;
        if (digi) {   // отговорът е на абакуса: верен → продължава; иначе 4 s без движение → приема се
          q.innerHTML = `<p class="o-trhint">Нареди отговора на абакуса</p>`;
          ans = await new Promise(res => { let tm = null; const chk = () => { clearTimeout(tm); if (abVal === target) tm = setTimeout(() => res(abVal), 500 * FAST); else if (abMoves.length) tm = setTimeout(() => res(abVal), IDLE * FAST); };
            ABMSG.on = chk; chk(); wait(120000).then(() => res(abVal), () => {}); });
          ABMSG.on = null;
        } else ans = await keypad(q, String(Math.pow(10, t.rods + 1)).length - 1);
        const right = ans === target;
        P.log.trainer.push({ t: Date.now(), topic: t.id, nums, speed: c.speed, voice: !!clips, voiceRate: clips ? Math.max(...clips.map(x => x.rate)) : null, src: mind ? "mind" : digi ? "digi" : "phys", answer: ans, correct: right, rtMs: Date.now() - tq, shownMs: shown, rules, moves: digi ? abMoves.map(m => ({ ...m, ms: m.at - t0 })) : null });
        if (P.log.trainer.length > 400) P.log.trainer.splice(0, P.log.trainer.length - 400); save();
        num.textContent = "= " + target; q.innerHTML = right ? "" : `<p class="o-trhint">Ти: ${ans}</p>`;
        if (right) { ok++; pipStar(k); say(thank(target), "joy"); } else say("Почти! Ето колко стана.", "wait"); await wait(right ? 1300 : 2400);
      }
    } finally { ABMSG = null; }
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
  // ---- „Съзвездие-число“: само светещите топчета, като звезди на техните места (без рамка и пръчки) – стъпка към въображаемия абакус ----
  function constSVG(v, rods, dim) {   // звездите стоят точно където са топчетата: светещите – допрени до гредата; бледите контури – „свалени“, далеч от нея
    const W = 170, X0 = 95, H = 500, BEAM = 140, wTot = X0 * 2 + (rods - 1) * W, st = E.fromValue(v, rods), xOf = (r) => X0 + (rods - 1 - r) * W;
    const eY = (k, e) => k <= e ? BEAM + 46 + (k - 1) * 60 : H - 34 - (4 - k) * 60, hY = (h) => h ? BEAM - 46 : 40;
    const star = (x, y, on) => on ? `<g class="cs-on" transform="translate(${x} ${y})"><circle r="40" fill="url(#csg)"/><path d="${starPath(27)}" fill="#FFE08A"/></g>`
      : `<path class="cs-off" transform="translate(${x} ${y})" d="${starPath(22)}" fill="none" stroke="#B9B4D8" stroke-opacity=".45" stroke-width="3" stroke-linejoin="round"/>`;
    let s = `<svg viewBox="0 0 ${wTot} ${H}" class="o-const${dim ? " dim" : ""}"><defs><radialGradient id="csg"><stop offset="0" stop-color="#F5C04A" stop-opacity=".6"/><stop offset="1" stop-color="#F5C04A" stop-opacity="0"/></radialGradient></defs>`;
    for (let i = 0; i < rods; i++) s += `<line x1="${xOf(i)}" y1="14" x2="${xOf(i)}" y2="${H - 10}" stroke="#ffffff" stroke-opacity=".08" stroke-width="3"/>`;
    s += `<line x1="20" y1="${BEAM}" x2="${wTot - 20}" y2="${BEAM}" stroke="#B88A4E" stroke-width="7" stroke-linecap="round"/>`;
    for (let i = 0; i < rods; i++) { const r = st[i], x = xOf(i); s += star(x, hY(!dim && r.h), !dim && r.h); for (let k = 1; k <= 4; k++) s += star(x, eY(k, dim ? 0 : r.e), !dim && k <= r.e); }
    return s + `</svg>`;
  }
  const CONST_LOOK = (t) => ({ draw: (v) => `<div class="o-cbox2 o-sig">${constSVG(v, t.rods)}</div>`, dim: () => `<div class="o-cbox2 o-dim">${constSVG(0, t.rods, true)}<span>?</span></div>`,
    say: "Погледни съзвездието!", again: "↺ Същото съзвездие – още веднъж" });
  async function playConst(c) {
    const t = topicFor(c.topic); let ok = 0; P.log = P.log || {}; P.log.const = P.log.const || [];
    const wk = $("#o-work"); if (wk) wk.classList.add("o-skyfield");
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const rec = { t: Date.now(), topic: t.id, choice: null, correct: false, retries: 0, rtMs: null };
      if (await signalRound(t, +c.speed, k, rec, CONST_LOOK(t))) { ok++; pipStar(k); }
      P.log.const.push(rec); if (P.log.const.length > 300) P.log.const.splice(0, P.log.const.length - 300); save();
    }
    return [ok, c.rounds];
  }

  // ---- „Комета“: числото лети на кометата; детето го нарежда, преди кометата да излезе от небето. Скоростта се нагласява в играта:
  // хванато → следващата комета малко по-бърза; изпусната → по-бавна. Няма „живот“ и наказание – изпуснатата комета просто показва числото.
  function cometFly(el, bar, ms) {   // движение с rAF (не зависи от CSS анимациите); при „без анимации“ кометата стои, а лентата намалява
    const still = document.documentElement.classList.contains("o-still"), t0 = performance.now(), g = gen; let stop = false;
    const step = (now) => { if (stop || g !== gen) return; const p = Math.min(1, (now - t0) / (ms * FAST));
      if (!still) el.style.left = (-8 + p * 100) + "%"; bar.style.width = (100 - p * 100) + "%"; if (p < 1) requestAnimationFrame(step); };
    if (still) el.style.left = "42%"; requestAnimationFrame(step); return () => { stop = true; };
  }
  async function playComet(c) {
    const t = topicFor(c.topic); let ok = 0, dur = +c.speed * 1000; const min = 2500, max = +c.speed * 1000 * 1.4;
    P.log = P.log || {}; P.log.comet = P.log.comet || [];
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const v = randVal(t) || 1, w = $("#o-work"); w.classList.add("o-skyfield");
      w.innerHTML = `<div class="o-csky"><div class="o-comet" id="o-comet"><i></i><b>${v}</b></div><div class="o-cbar"><i id="o-cbar"></i></div></div><div class="o-abhost o-cab" id="o-abh"></div>`;
      const ab = abacus($("#o-abh"), t.rods); ab.enable(false); if (FAST_ON) window.OBS_T = { ab, v };
      if (!k) await talk("Нареди числото, преди кометата да отлети!", "point"); else { say("Ето още една комета!", "point"); await wait(700); }
      ab.enable(true); const t0 = performance.now(), stopFly = cometFly($("#o-comet"), $("#o-cbar"), dur);
      const caught = await new Promise(res => { let fin = false; const end = (x) => { if (!fin) { fin = true; ab.onChange(null); res(x); } };
        ab.onChange(() => { if (ab.value() === v) setTimeout(() => end(true), 250 * FAST); }); wait(dur).then(() => end(ab.value() === v), () => {}); });
      stopFly(); ab.enable(false); const rt = Math.round(performance.now() - t0);
      P.log.comet.push({ t: Date.now(), topic: t.id, n: v, ms: Math.round(dur), caught, rtMs: caught ? rt : null }); if (P.log.comet.length > 300) P.log.comet.splice(0, P.log.comet.length - 300); save();
      if (caught) { ok++; pipStar(k); $("#o-comet").classList.add("caught"); burst(); say(thank(v), "joy"); dur = Math.max(min, dur * .88); await wait(1400); }
      else { $("#o-comet").classList.add("gone"); ab.set(v); say("Кометата отлетя. Ето числото.", "explain"); dur = Math.min(max, dur * 1.15); await wait(2400); }
    }
    return [ok, c.rounds];
  }

  // ---- „Провери Зори“: Зори смята пример на абакуса (бавно, със стрелки). Понякога смята вярно, понякога мести с едно топче повече/по-малко
  // или на грешната пръчка. Детето казва „Вярно“ или „Грешно“; ако е сбъркала – детето показва как е правилно (проверка на числото и на движенията).
  function oopsTask(t) {
    for (let g = 0; g < 200; g++) {
      const ex = E.simpleExample({ ...t, count: 2 }), a = ex.nums[0], n = ex.nums[1], op = n < 0 ? "-" : "+", k = Math.abs(n);
      const p = E.plan(a, op, k, t.rods); if (!p.ok || !p.moves.length) continue;
      const right = a + n, wrongKind = Math.random() < .4 ? null : (t.rods > 1 && Math.random() < .3 ? "rod" : "count");
      if (!wrongKind) return { a, op, k, right, moves: p.moves, shown: right, wrong: null };
      const ms = p.moves.map(m => ({ ...m })), last = ms[ms.length - 1];
      if (wrongKind === "rod") { const r2 = last.rod ? 0 : 1; last.rod = r2; }
      else { const opts = last.bead === "e" ? [last.d + 1, last.d - 1].filter(d => d && Math.sign(d) === Math.sign(last.d)) : []; if (!opts.length) continue; last.d = opts[Math.floor(Math.random() * opts.length)]; }
      let st = E.fromValue(a, t.rods); for (const m of ms) { st = st && E.apply(st, m); } if (!st) continue; const got = E.value(st); if (got === right) continue;
      return { a, op, k, right, moves: ms, shown: got, wrong: wrongKind, good: p.moves };
    }
    return null;
  }
  async function playOops(c) {
    const t = topicFor(c.topic); let ok = 0; P.log = P.log || {}; P.log.oops = P.log.oops || [];
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const q = oopsTask(t); if (!q) break; const w = $("#o-work"), ex = `${q.a} ${q.op === "+" ? "+" : "−"} ${q.k}`;
      w.innerHTML = `<div class="o-num" id="o-num">${ex}</div><div class="o-abhost" id="o-abh"></div><div class="o-ch big o-yn" id="o-yn" hidden><button data-v="1">✓ Вярно</button><button data-v="0">✗ Грешно</button></div>`;
      const ab = abacus($("#o-abh"), t.rods); ab.enable(false); ab.set(q.a); if (FAST_ON) window.OBS_T = { ab, q };
      const play = async (ms) => { ab.set(q.a); await wait(500); await ab.demo(ms, false, true); };
      if (!k) await talk("Гледай как смятам. Вярно ли е?", "point"); else { say("Гледай как смятам!", "point"); await wait(600); }
      await play(q.moves); $("#o-num").textContent = `${ex} = ${q.shown}`; once(k, "Вярно ли смятах?", "explain"); if (k) voice("Вярно ли смятах?");
      const yn = $("#o-yn"); yn.hidden = false;
      const said = await new Promise(res => yn.querySelectorAll("button").forEach(b => b.onclick = () => res(b.dataset.v === "1"))); yn.hidden = true;
      const rec = { t: Date.now(), topic: t.id, ex, shown: q.shown, wrong: q.wrong, said: said ? "right" : "wrong", spotted: said === !q.wrong, fixed: null };
      let star = rec.spotted;
      if (!q.wrong && said) { say("Точно така! Този път смятах вярно.", "joy"); await wait(1500); }
      else if (!q.wrong && !said) { await talk("Този път смятах вярно. Гледай още веднъж.", "explain"); await play(q.moves); await wait(800); }
      else if (q.wrong && said) { await talk("Ох, всъщност сбърках! Гледай как е правилно.", "wait"); await play(q.good); $("#o-num").textContent = `${ex} = ${q.right}`; await wait(1200); }
      else {   // хванато! детето показва как е правилно
        await talk("Браво, хвана грешката! Покажи ми как е правилно.", "joy"); ab.set(q.a); $("#o-num").textContent = ex; ab.enable(true);
        await untilIdle(ab, q.right); ab.enable(false);
        const j = E.judge({ start: q.a, op: q.op, n: q.k, rods: t.rods }, ab.moves()); rec.fixed = j.correct; rec.method = !!j.method;
        if (j.correct) { $("#o-num").textContent = `${ex} = ${q.right}`; say(thank(q.right), "joy"); await wait(1400); }
        else { star = false; await talk("Почти! Гледай как е правилно.", "wait"); await play(q.good); $("#o-num").textContent = `${ex} = ${q.right}`; await wait(1200); }
      }
      if (star) { ok++; pipStar(k); }
      P.log.oops.push(rec); if (P.log.oops.length > 300) P.log.oops.splice(0, P.log.oops.length - 300); save();
    }
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
  // задачата е едно движение → проверява се сама след първото движение (без бутон)
  function fixAttempt(ab, task) {
    ab.enable(true);
    return new Promise(res => { let fin = false; const end = () => { if (!fin) { fin = true; ab.onChange(null); ab.enable(false); res(fixJudge(ab, task)); } };
      ab.onChange(() => { ab.enable(false); setTimeout(end, 700 * FAST); }); });
  }
  async function playFix(c) {
    const t = topicFor(c.topic); let solo = 0, built = 0; const total = c.rounds, tele = () => TELE(Math.round(built * 5 / total), 5);
    P.log = P.log || {}; P.log.fix = P.log.fix || []; let like = null, prev = null;
    for (let k = 0; k < c.rounds; k++) {
      pip(k); const task = fixTask(t, like, prev && prev.target), rec = { t: Date.now(), topic: t.id, target: task.target, wrong: task.wrong, fix: task.fix, similar: !!like, tries: [], hints: [], shown: 0, repeated: null, solo: false };
      const w = $("#o-work"); w.innerHTML = `<div class="o-fix"><div class="o-fixhead"><div class="o-fixgoal">Направи <b class="o-num pop">${task.target}</b></div>
        <div class="o-telebox" title="Телескоп">${tele()}<span>${built}/${total}</span></div></div><div class="o-fixmsg" id="o-fixmsg"></div>
        <div class="o-abhost" id="o-abh"></div><div class="o-row"><button class="o-sec o-rew" id="o-rew" hidden>↺ Гледай пак</button></div></div>`;
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
          const show = async () => { rec.shown++; msg("Зори показва"); $("#o-rew").hidden = true; ab.enable(false); ab.set(task.wrong);
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
        w.innerHTML = `<div class="o-num">?</div><div class="o-abhost" id="o-abh"></div>`;
        once(k || tr ? 1 : 0, "Нареди същото число.", "explain"); if (k && !tr) voice("Нареди същото число.");
        const ab = abacus($("#o-abh"), t.rods); await untilIdle(ab, v); ab.enable(false); right = ab.value() === v;
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
  const PLAY = { trainer: playTrainer, flash: playFlash, fix: playFix, memory: playMemory, count: playCount, constel: playConst, comet: playComet, oops: playOops };
  const INTRO = { trainer: "Звездни сметки!", flash: "Звездни сигнали!", fix: "Поправи телескопа!", memory: "Нощна памет!", count: "Звездно броене!", constel: "Съзвездие-число!", comet: "Комета!", oops: "Провери Зори!" };

  // в мисията: последният етап – една от игрите, с параметрите на занятието
  async function missionGame() {   // (фонът „нощно небе“ за броенето се слага в playCount)
    const pool = ["count", "fix", "memory", "constel", "oops"], id = pool[Math.floor(Math.random() * pool.length)], c = { ...defaults(id), rounds: id === "count" || id === "fix" || id === "oops" ? 4 : id === "constel" ? 5 : 3, upto: M.max < 3 ? 3 : M.max < 6 ? 5 : 10 };
    shell(4, STAR[M.n].title); await talk(INTRO[id], "explain"); return PLAY[id](c);
  }

  // ---- екрани: Игри → Настройки → игра → резултат ----
  function navBar(extra) { return `<div class="o-maptop"><button class="o-back" id="o-back">← Към обсерваторията</button>${extra || ""}</div>`; }
  // екран „Игри“: илюстровани карти като на началния екран; цвят по игра; заключените „чакат“ (от занятие N), новоотключената – „Ново!“
  function screenGames() {
    gen++; M = null;
    app.className = "o-scr o-gscr";
    app.innerHTML = `<div class="o-gbg"></div><section class="o-gwrap">
      <header class="o-ghead"><button class="o-back" id="o-back">← Към обсерваторията</button><div class="o-gtitle"><b>Игри</b><small>Тренирай уменията си</small></div><span class="o-sp"></span>
        <div class="o-gz"><div class="o-say">Избери игра!</div>${zori("point")}</div></header>
      <div class="o-ggrid">${Object.entries(GAMES).map(([id, g], i) => { const op = isOpen(id), fresh = op && !REVIEW && unlockAt(id) === classAt() && unlockAt(id) > 1;
        return `<button class="o-gc2 g-${id}${op ? "" : " lock"}" data-g="${id}" style="animation-delay:${i * .05}s">${fresh ? '<em class="o-new">Ново!</em>' : ""}
          <span class="o-gart"><img src="assets/img/obs/g_${id}.webp" alt="">${op ? "" : `<i class="o-glock">🔒 от занятие ${unlockAt(id)}</i>`}</span>
          <span class="o-gtx"><b>${g.name}</b><small>${g.sub}</small></span></button>`; }).join("")}</div></section>`;
    voice("Избери игра!");
    $("#o-back").onclick = screenHome;
    app.querySelectorAll(".o-gc2").forEach(b => b.onclick = () => isOpen(b.dataset.g) ? screenStart(b.dataset.g) : say("Тази игра ще се отключи по-късно.", "explain"));
  }
  // старт на игра: голям „Старт“; „Настройки за възрастен“ се отварят само със задържане (1 сек.), както в ПУ и АЕ
  function holdBtn(el, fn) { let t = null; const go = (e) => { e.preventDefault(); el.classList.add("hold"); t = setTimeout(() => { el.classList.remove("hold"); fn(); }, 1000); }, stop = () => { clearTimeout(t); el.classList.remove("hold"); };
    el.addEventListener("pointerdown", go); el.addEventListener("pointerup", stop); el.addEventListener("pointerleave", stop); el.addEventListener("pointercancel", stop); }
  function screenStart(id) {
    gen++; const g = GAMES[id];
    app.className = "o-scr o-map o-gamesbg";
    app.innerHTML = `<div class="o-maptop"><button class="o-back" id="o-back">← Към игрите</button><div class="o-grow"><div class="o-mt">${g.name}</div><div class="o-ms">${g.sub}</div></div></div>
      <div class="o-set"><div class="o-gstart g-${id}"><img src="assets/img/obs/g_${id}.webp" alt=""></div><div class="o-startz">${zori("explain")}</div></div>
      <div class="o-sbar"><button class="o-sec o-adult" id="o-adult"><i></i>⚙ Настройки за възрастен <small>задръж</small></button><button class="o-go" id="o-start">▶ Старт</button></div>`;
    $("#o-back").onclick = screenGames; $("#o-start").onclick = () => runGame(id); holdBtn($("#o-adult"), () => screenSettings(id));
  }
  function screenSettings(id) {
    gen++; const g = GAMES[id], c = defaults(id);
    const chip = (k, v, label) => `<button class="o-chip${String(c[k]) === String(v) ? " on" : ""}" data-k="${k}" data-v="${v}">${label}</button>`;
    const row = (k) => { const o = g.opts[k]; let chips;
      if (o === "tema" || o === "тема") chips = TOP.filter(t => topicOpen(t.id)).map(t => chip(k, t.id, t.name)).join("");
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
    P.mc = P.mc || {}; P.mc[n] = (P.mc[n] || 0) + 1;
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
  hwReady.then(() => {
    if (Q.get("test") === "1" || Q.get("test") === "0") { TESTMODE = Q.get("test") === "1"; try { localStorage.setItem("obs.test", Q.get("test")); } catch (e) {} }
    // тест с деца: винаги изборът „Дете 1–6“, дори ако на устройството има влязло дете от платформата
    if (CHILD && !TESTMODE) { DB[CHILD] = DB[CHILD] || { id: CHILD, name: "Аз", av: "a1", cur: 1, classAt: 1, b: {}, halo: {}, hw: {} }; P = DB[CHILD]; useGroup(P); fromServer(); applyMotion(); screenHome(); return; }
    if (Q.get("p") && ALLP.some(x => x.id === Q.get("p"))) { P = prof(Q.get("p")); if (Q.get("class")) { P.classAt = +Q.get("class"); save(); } applyMotion(); Q.get("m") ? startMission(+Q.get("m")) : Q.get("map") ? screenMap() : screenHome(); } else screenProfiles();
  });
  window.OBS = { _const: (v, r, d) => constSVG(v, r, d), _hw: () => HW, runHw, screenTeacher, _hwComplete: (n) => hwComplete(HW.lessons.find(x => x.n === n)), _countSVG: (v) => countSVG(v), screenHome, screenMap, startMission, screenGames, screenSettings, screenResult, runGame, profile: () => P,
    testFinish: (n, r) => { M = Object.assign({ n, ex: [], par: PAR[n], max: MAXN[n], flash: [5, 6], ab: [3, 4], meth: [3, 4], im: [2, 3], help: 0 }, r || {}); return finish(); } };   // само за проверки
})();
