/* Дигитален абакус – самостоятелно приложение (abacus-app.html).
   Режими: classic – топчетата се плъзгат (докосване или плъзгане с пръст);
           touch   – топчетата стоят на място, докоснатите светват и остават светнати;
           mind    – мислено: докоснатото топче светва за миг и изгасва, числото горе е скрито (опора при смятане наум).
   Стойността се пази във всички режими и всяко движение се записва: { t (мс от началото), rod (0 = единици), bead, d, v (стойност след него) }.
   Сесиите: localStorage ma.abacus.v1 (последните 60). Онлайн занятие: window.ABACUS_HOOK (js/live/child.js) получава всяко движение. */
(function () {
  const E = window.ABACUS_ENGINE, Q = new URLSearchParams(location.search), DEBUG = Q.get("debug") === "1";
  const RODS = 5, CW = 190, BW = 136, BH = 66, PADX = 34, FR = 14;
  const SKEY = "ma.abacus.set", LKEY = "ma.abacus.v1";
  const MODES = {
    classic: { name: "Класически", sub: "топчетата се плъзгат", cls: "m-classic" },
    touch: { name: "Докосване", sub: "топчетата светват", cls: "m-touch" },
    mind: { name: "Мислено", sub: "светват за миг, числото е скрито", cls: "m-mind" }
  };
  // видове топчета – светло / основно / тъмно; форма: кристал (шестоъгълник) или перла (кръгло)
  const DESIGNS = {
    emerald: { name: "Изумруд", c: ["#86E8A4", "#22B357", "#137A3A"], f: "gem" },
    sapphire: { name: "Сапфир", c: ["#9CCBFF", "#2F7FE0", "#1B4E99"], f: "gem" },
    ruby: { name: "Рубин", c: ["#FFA3A3", "#E0353B", "#96161C"], f: "gem" },
    amethyst: { name: "Аметист", c: ["#D9B0FF", "#8A43E0", "#5A2296"], f: "gem" },
    amber: { name: "Кехлибар", c: ["#FFD889", "#F29A1E", "#A85E07"], f: "gem" },
    pearl: { name: "Перла", c: ["#F1ECFF", "#AE9CF2", "#6E5BC4"], f: "round" }
  };
  const GREY = ["#E6E8EF", "#A9AEBD", "#6D7285"];
  const $ = (s) => document.querySelector(s);
  // устройство в портрет (iPhone/iPad не позволяват уеб страница да заключи ориентацията): показваме абакуса хоризонтално, завъртян с CSS
  const ROT = matchMedia("(orientation: portrait) and (max-width: 1100px)");
  const load = (k, d) => { try { return Object.assign({}, d, JSON.parse(localStorage.getItem(k) || "{}")); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let set = load(SKEY, { design: "emerald", sound: true, mode: "classic" });
  if (!DESIGNS[set.design]) set.design = "emerald";
  // ✕ / ← връщат в началния екран на детето в платформата (профилът идва от бутона „Абакус“ там и се помни за отваряне от иконата)
  if (/^[a-z0-9_-]{1,32}$/i.test(Q.get("p") || "")) { set.p = Q.get("p"); save(SKEY, set); }
  const EXIT = "observatory.html" + (set.p ? "?p=" + encodeURIComponent(set.p) : "");
  let st = E.make(RODS), mode = set.mode, sess = null;

  // ---- звук: кратко дървено щракване (Web Audio), без файлове ----
  let ac = null;
  function click(n) {
    if (!set.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime, len = Math.floor(ac.sampleRate * 0.035), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 2300 + Math.random() * 300; bp.Q.value = 3;
      g.gain.value = Math.min(1, 0.55 + 0.12 * (n || 1));
      src.connect(bp).connect(g).connect(ac.destination); src.start(t);
    } catch (e) {}
  }

  // ---- запис ----
  function startSession() { sess = { id: "s" + Date.now().toString(36), at: new Date().toISOString(), p: set.p || null, mode, design: set.design, moves: [] }; sess.t0 = performance.now(); }
  function store() {
    if (!sess || !sess.moves.length) return;
    try { const a = JSON.parse(localStorage.getItem(LKEY) || "[]"), i = a.findIndex(x => x.id === sess.id), o = Object.assign({}, sess); delete o.t0;
      if (i >= 0) a[i] = o; else a.push(o); localStorage.setItem(LKEY, JSON.stringify(a.slice(-60))); } catch (e) {}
  }
  let storeT = null;
  function record(m) {
    const v = E.value(st), row = { t: Math.round(performance.now() - sess.t0), rod: m.rod, bead: m.bead, d: m.d, v };
    sess.moves.push(row); clearTimeout(storeT); storeT = setTimeout(store, 400);
    try { if (window.ABACUS_HOOK) window.ABACUS_HOOK(Object.assign({ t: Math.round(performance.now()) }, m)); } catch (e) {}
    if (DEBUG) { const l = $("#aa-log"); l.textContent = `${(row.t / 1000).toFixed(2)}с  пр.${m.rod + 1} ${m.bead === "h" ? "горно" : "долни"} ${m.d > 0 ? "+" : ""}${m.d} → ${v}\n` + l.textContent.slice(0, 1500); }
  }

  // ---- геометрия ----
  // classic: горе място за 2 топчета, долу за 5 (едно празно място); touch/mind: зоните са точно колкото топчетата
  function geo() {
    const slide = mode === "classic", T = FR + 8, up = (slide ? 2 : 1) * BH + 8, BEAM = T + up, BT = 16, L = BEAM + BT, low = (slide ? 5 : 4) * BH + 8;
    return { slide, T, BEAM, BT, L, H: L + low + FR + 8, W: PADX * 2 + RODS * CW };
  }
  const colX = (i) => PADX + (E.col(i, RODS) + 0.5) * CW;
  function hY(g, on) { return g.slide ? (on ? g.BEAM - 4 - BH / 2 : g.T + 4 + BH / 2) : g.T + 4 + BH / 2; }
  function eY(g, k, on) { return g.L + 4 + (k - 0.5 + (g.slide && !on ? 1 : 0)) * BH; }

  function beadSVG(id, f) {
    const w = BW, h = BH - 6;
    if (f === "round") return `<ellipse class="rb" cx="0" cy="0" rx="${w / 2 - 6}" ry="${h / 2}"${id ? ` fill="url(#${id})"` : ""} stroke="var(--b3)" stroke-width="3"/><ellipse cx="-${w / 7}" cy="-${h / 5}" rx="${w / 6}" ry="${h / 8}" fill="#fff" opacity=".55"/>`;
    const p = (pts) => pts.map(q => q.join(" ")).join(" L");
    const L = -w / 2, R = w / 2, a = w / 4, t = -h / 2, b = h / 2;
    return `<path d="M${p([[L, 0], [-a, t], [a, t], [R, 0], [a, b], [-a, b]])}Z" fill="var(--b2)" stroke="var(--b3)" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M${p([[L + 6, -1], [-a + 3, t + 4], [a - 3, t + 4], [R - 6, -1]])}Z" fill="var(--b1)" opacity=".85"/>` +
      `<path d="M${p([[-a + 12, t + 9], [a - 26, t + 9], [a - 34, t + 17], [-a + 18, t + 17]])}Z" fill="#fff" opacity=".6"/>` +
      `<path d="M${p([[L + 8, 2], [R - 8, 2], [a - 4, b - 5], [-a + 4, b - 5]])}Z" fill="var(--b3)" opacity=".28"/>`;
  }
  const grad = (id, c) => `<radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
  function paint(el, c) { el.style.setProperty("--b1", c[0]); el.style.setProperty("--b2", c[1]); el.style.setProperty("--b3", c[2]); }

  function draw() {
    const g = geo(), D = DESIGNS[set.design];
    let s = `<svg viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="Абакус с 5 пръчки"><defs>` +
      grad("rg-on", D.c) + grad("rg-off", GREY) + `</defs>` +
      `<rect x="${FR / 2}" y="${FR / 2}" width="${g.W - FR}" height="${g.H - FR}" rx="22" fill="var(--board)" stroke="var(--frame)" stroke-width="${FR}"/>`;
    for (let i = 0; i < RODS; i++) s += `<line x1="${colX(i)}" y1="${FR}" x2="${colX(i)}" y2="${g.H - FR}" stroke="var(--rod)" stroke-width="7" stroke-linecap="round"/>`;
    s += `<rect x="${FR}" y="${g.BEAM}" width="${g.W - 2 * FR}" height="${g.BT}" fill="var(--frame)"/>`;
    for (let i = 0; i < RODS; i++) s += `<circle cx="${colX(i)}" cy="${g.BEAM + g.BT / 2}" r="4" fill="var(--board)"/>`;
    for (let i = 0; i < RODS; i++) {
      s += `<g class="aa-bead" data-rod="${i}" data-bead="h"><rect class="hit" x="${-CW / 2}" y="${-BH / 2}" width="${CW}" height="${BH}"/>${beadSVG("", D.f)}</g>`;
      for (let k = 1; k <= 4; k++) s += `<g class="aa-bead" data-rod="${i}" data-bead="e" data-k="${k}"><rect class="hit" x="${-CW / 2}" y="${-BH / 2}" width="${CW}" height="${BH}"/>${beadSVG("", D.f)}</g>`;
    }
    $("#aa-board").innerHTML = s + "</svg>";
    $("#aa-board").querySelectorAll(".aa-bead").forEach(bind);
    update(null, true);
  }

  // ---- състояние → картина ----
  function update(changed, instant) {
    const g = geo(), D = DESIGNS[set.design];
    $("#aa-board").querySelectorAll(".aa-bead").forEach(el => {
      const i = +el.dataset.rod, r = st[i], h = el.dataset.bead === "h", k = +el.dataset.k || 0, on = h ? !!r.h : k <= r.e;
      const y = h ? hY(g, on) : eY(g, k, on);
      if (instant) el.classList.add("still");
      el.style.transform = `translate(${colX(i)}px, ${y}px)`;
      if (instant) requestAnimationFrame(() => el.classList.remove("still"));
      const lit = mode === "classic" || (mode === "touch" && on);
      paint(el, lit ? D.c : GREY); el.classList.toggle("off", !lit);
    });
    if (changed && mode === "mind") flash(changed);
    $("#aa-val").textContent = mode === "mind" ? "●●●●●" : String(E.value(st));
  }
  // мислено: докоснатите топчета светват за миг (около 0,1 с) и изгасват
  function flash(m) {
    const D = DESIGNS[set.design], els = [];
    if (m.bead === "h") els.push(document.querySelector(`.aa-bead[data-rod="${m.rod}"][data-bead="h"]`));
    else { const before = st[m.rod].e - m.d, lo = Math.min(before, st[m.rod].e) + 1, hi = Math.max(before, st[m.rod].e);
      for (let k = lo; k <= hi; k++) els.push(document.querySelector(`.aa-bead[data-rod="${m.rod}"][data-bead="e"][data-k="${k}"]`)); }
    els.forEach(el => { if (!el) return; paint(el, D.c); el.classList.remove("off"); clearTimeout(el._f);
      el._f = setTimeout(() => { if (mode === "mind") { paint(el, GREY); el.classList.add("off"); } }, 120); });
  }

  // ---- докосване и плъзгане ----
  // classic: плъзгане в посоката на пръста (като истинския абакус) или докосване (12.11.2026 – по-лесно при по-висока скорост).
  // touch/mind: действа веднага при докосване (две ръце / щипка – едновременно, всяка с отделен пръст).
  function act(el) {
    const m = E.tapMove(st, +el.dataset.rod, el.dataset.bead, +el.dataset.k || 0), ns = E.apply(st, m); if (!ns) return null;
    st = ns; click(Math.abs(m.bead === "h" ? 1 : m.d)); update(m); record(m); return m;
  }
  function bind(el) {
    el.addEventListener("pointerdown", ev => {
      ev.preventDefault(); if (ac && ac.state === "suspended") ac.resume();
      if (mode !== "classic") { act(el); return; }
      const p = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, done: false };
      // в портрет екранът е завъртян на 90° (CSS) – „нагоре“ по абакуса е надясно по екрана
      const move = (e) => { if (e.pointerId !== p.id || p.done) return; const dy = ROT.matches ? p.x0 - e.clientX : e.clientY - p.y0; if (Math.abs(dy) < 10) return;
        p.done = true; const m = E.tapMove(st, +el.dataset.rod, el.dataset.bead, +el.dataset.k || 0);
        const towardBeam = el.dataset.bead === "h" ? dy > 0 : dy < 0;   // към гредата = включва топчето
        if (towardBeam === (m.d > 0)) act(el); };
      const up = (e) => { if (e.pointerId !== p.id) return; if (!p.done) act(el); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    });
  }

  // ---- екрани ----
  function swatch(id) { const D = DESIGNS[id]; return `<svg viewBox="-95 -40 190 80" aria-hidden="true"><g style="--b1:${D.c[0]};--b2:${D.c[1]};--b3:${D.c[2]}">${beadSVG("sw-" + id, D.f)}</g><defs>${grad("sw-" + id, D.c)}</defs></svg>`; }
  function render() {
    document.body.innerHTML = `<div class="aa-root">
    <section class="aa-home" id="aa-home">
      <header class="aa-bar"><button class="aa-ib back" id="aa-exit1" aria-label="Към платформата">←</button><h1>Абакус</h1><button class="aa-ib close" id="aa-close1" aria-label="Затвори">✕</button></header>
      <div class="aa-cols">
        <div class="aa-col"><h2>Вид на топчетата</h2><div class="aa-designs">${Object.keys(DESIGNS).map(id =>
          `<button class="aa-dz${id === set.design ? " on" : ""}" data-d="${id}" aria-pressed="${id === set.design}">${swatch(id)}<span>${DESIGNS[id].name}</span></button>`).join("")}</div>
          <p class="aa-note">5 пръчки · единиците са най-вдясно</p></div>
        <div class="aa-col"><h2>Избери режим</h2><div class="aa-modes">${Object.keys(MODES).map(id =>
          `<button class="aa-mode ${MODES[id].cls}" data-m="${id}"><span class="aa-mi">${modeIcon(id)}</span><span><b>${MODES[id].name}</b><small>${MODES[id].sub}</small></span></button>`).join("")}</div></div>
      </div>
    </section>
    <section class="aa-play" id="aa-play" hidden>
      <header class="aa-bar"><button class="aa-ib back" id="aa-back" aria-label="Назад към избора">←</button><button class="aa-ib zero" id="aa-zero" aria-label="Нулирай абакуса">0</button>
        <div class="aa-val" id="aa-val" aria-live="off">0</div><div class="ab-task" id="ab-task"></div>
        <button class="aa-ib snd" id="aa-snd" aria-label="Звук"></button><button class="aa-ib close" id="aa-close2" aria-label="Затвори">✕</button></header>
      <div class="aa-board" id="aa-board"></div>
      <div class="ab-say" id="ab-say"></div>${DEBUG ? '<pre class="aa-log" id="aa-log"></pre>' : ""}
    </section></div>`;
    document.querySelectorAll(".aa-dz").forEach(b => b.onclick = () => { set.design = b.dataset.d; save(SKEY, set);
      document.querySelectorAll(".aa-dz").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); });
    document.querySelectorAll(".aa-mode").forEach(b => b.onclick = () => open(b.dataset.m));
    const exit = () => { store(); location.href = EXIT; };
    ["#aa-exit1", "#aa-close1", "#aa-close2"].forEach(s => $(s).onclick = exit);
    $("#aa-back").onclick = () => { store(); $("#aa-play").hidden = true; $("#aa-home").hidden = false; };
    // нулиране: всички топчета в изходна позиция (записва се в сесията като „reset“)
    $("#aa-zero").onclick = () => { if (!sess) return; const had = E.value(st) !== 0 || st.some(r => r.h || r.e); st = E.make(RODS); update(null, false);
      if (had) { click(3); sess.moves.push({ t: Math.round(performance.now() - sess.t0), reset: true, v: 0 }); clearTimeout(storeT); storeT = setTimeout(store, 400); }
      try { if (window.ABACUS_HOOK) window.ABACUS_HOOK(null); } catch (e) {}
      if (DEBUG) { const l = $("#aa-log"); l.textContent = "↺ нулиране\n" + l.textContent; } };
    $("#aa-snd").onclick = () => { set.sound = !set.sound; save(SKEY, set); sndBtn(); if (set.sound) click(1); };
    sndBtn();
  }
  function sndBtn() { const b = $("#aa-snd"); b.textContent = set.sound ? "🔊" : "🔇"; b.setAttribute("aria-pressed", set.sound); }
  function modeIcon(id) {
    const c = id === "classic" ? ["#86E8A4", "#22B357", "#137A3A"] : GREY, lit = ["#86E8A4", "#22B357", "#137A3A"];
    const b = (y, col, o) => `<path d="M-18 ${y} L-9 ${y - 6} L9 ${y - 6} L18 ${y} L9 ${y + 6} L-9 ${y + 6} Z" fill="${col[1]}" stroke="${col[2]}" stroke-width="1.5" opacity="${o || 1}"/>`;
    if (id === "classic") return `<svg viewBox="-24 -30 48 60"><line x1="0" y1="-28" x2="0" y2="28" stroke="#8A6234" stroke-width="2"/>${b(-18, c)}${b(4, c)}${b(16, c)}`.concat(`<path d="M14 -2 l6 -8 l6 8" fill="none" stroke="#fff" stroke-width="3"/></svg>`);
    if (id === "touch") return `<svg viewBox="-24 -30 48 60"><line x1="0" y1="-28" x2="0" y2="28" stroke="#8A6234" stroke-width="2"/>${b(-18, GREY)}${b(-2, lit)}${b(10, lit)}${b(22, GREY)}</svg>`;
    return `<svg viewBox="-24 -30 48 60"><line x1="0" y1="-28" x2="0" y2="28" stroke="#8A6234" stroke-width="2"/>${b(-18, GREY)}${b(-2, lit, .45)}${b(10, GREY)}${b(22, GREY)}<circle cx="15" cy="-16" r="5" fill="#FFD34D"/></svg>`;
  }
  function open(m) {
    mode = MODES[m] ? m : "classic"; set.mode = mode; save(SKEY, set);
    document.body.dataset.mode = mode; $("#aa-home").hidden = true; $("#aa-play").hidden = false;
    st = E.make(RODS); startSession(); draw();
    try { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen && matchMedia("(pointer: coarse)").matches) d.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {})).catch(() => {}); } catch (e) {}
  }
  window.addEventListener("pagehide", store);

  render();
  if (Q.get("mode") || Q.get("live")) open(Q.get("mode") || set.mode);
  // интерфейс за онлайн занятието (js/live/child.js) и за тестовете
  window.ABACUS_UI = { state: () => st, set: (v) => { st = E.fromValue(v, RODS); update(null, true); }, mode: () => mode, open, session: () => sess,
    tap: (rod, bead, k) => { const el = document.querySelector(`.aa-bead[data-rod="${rod}"][data-bead="${bead}"]${bead === "e" ? `[data-k="${k}"]` : ""}`); return el && act(el); } };
})();
