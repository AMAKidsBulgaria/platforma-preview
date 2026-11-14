/* Интерактивната обсерватория – Фаза 1 (observatory.html?scene=1, 13.11.2026).
   САМО ИЗГЛЕД: не знае нищо за домашни, звезди и профили. Получава готов модел (текстовете на мисията, небето като SVG, репликата на Зори)
   и обработчици (mission / abacus / games / map) от js/obs/app.js и ги вика след прехода.
   Стаята е една картина (хоризонтална 1536×1024 или вертикална 1024×1536); предметите-входове са нарисувани в нея:
     абакусът → дигиталният абакус, телескопът → игрите, звездната карта → картата, прозорецът → порталът с истинската следваща мисия.
   PixiJS рисува стаята, светлините и Зори; DOM дава достъпните бутони (по един за всеки предмет), надписите, портала и балона.
   Намалено движение (html.o-calm / o-still или prefers-reduced-motion): без приближаване на камерата, без трептене – само кратко затъмняване.
   mount(host, model, handlers) → { ui, unmount() }; при грешка хвърля – app.js показва стария начален екран. */
(function () {
  const ROOMS = {
    land: { url: "assets/img/journey/room_land.webp?v=2", w: 1536, h: 1024, win: { x: 780, y: 255, r: 285 }, zori: { x: 985, y: 945, h: 320 },
      box: { tele: [85, 150, 425, 855], map: [378, 348, 630, 762], abac: [1140, 480, 1315, 600] }, lens: [410, 190],
      tag: { tele: [262, 610], map: [470, 600], abac: [1228, 604] },
      lamps: [[75, 505, 1.1], [1455, 92, 1], [1111, 482, .8]] },
    port: { url: "assets/img/journey/room_port.webp?v=2", w: 1024, h: 1536, win: { x: 510, y: 325, r: 240 }, zori: { x: 500, y: 1430, h: 380 },
      box: { tele: [50, 470, 385, 1235], map: [255, 625, 495, 1015], abac: [695, 690, 872, 822] }, lens: [372, 492],
      tag: { tele: [150, 1075], map: [372, 905], abac: [784, 826] },
      lamps: [[60, 270, 1], [985, 410, .9], [643, 735, .8]] } };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const OBJ = { abac: { icon: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16M12 4v16M16 4v16"/><circle cx="8" cy="6.5" r="1.2" fill="currentColor"/><circle cx="12" cy="13" r="1.2" fill="currentColor"/><circle cx="16" cy="15.5" r="1.2" fill="currentColor"/>'), name: "Абакус", aria: "Абакус – свободна тренировка" },
    tele: { icon: svg('<path d="M3 13l13-6 2 4-13 6z"/><path d="M16 7l3-1.5 1.5 3L18 11"/><path d="M9 16l-3 5M10 15.5l3 5.5"/>'), name: "Игри", aria: "Телескоп – игри" },
    map: { icon: svg('<rect x="4" y="3" width="16" height="13" rx="1.5"/><path d="M7 12l3-4 3 2 4-4M8 16l-2 5M16 16l2 5M12 16v5"/><circle cx="7" cy="12" r=".9" fill="currentColor"/><circle cx="17" cy="6" r=".9" fill="currentColor"/>'), name: "Звездна карта", aria: "Звездна карта" } };
  let glowTex = null;
  const radial = () => { if (glowTex && glowTex.valid) return glowTex; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.35, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return glowTex = PIXI.Texture.from(c); };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function mount(host, model, H) {
    if (!window.PIXI || !window.gsap || !PIXI.utils.isWebGLSupported()) throw new Error("scene: no WebGL/PIXI/GSAP");
    const root = document.documentElement, reduced = () => root.classList.contains("o-calm") || root.classList.contains("o-still") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pm = model.portal;
    host.innerHTML = `<div class="os-stage"></div><div class="os-ui">
        <button class="os-portal" type="button" tabindex="-1" aria-hidden="true"><span class="os-win">${pm.svg || ""}<span class="o-glass"></span></span></button>
        ${Object.entries(OBJ).map(([k, o]) => `<button class="os-hit" type="button" data-k="${k}" aria-label="${o.aria}"></button><span class="os-chip on" data-k="${k}" aria-hidden="true"><i>${o.icon}</i>${o.name}</span>`).join("")}
        <button class="os-zori" type="button" aria-label="Зори – чуй отново"></button>
        <svg class="os-beam" aria-hidden="true"><line/></svg>
        <button class="os-mission" type="button" aria-label="${esc(pm.aria)}"><span class="os-mtx"><span class="os-m1">${pm.kicker ? `<em>${esc(pm.kicker)}</em>` : ""}<b>${esc(pm.title)}</b></span><span class="os-m2"><small>${esc(pm.sub)}</small>${pm.dots || ""}</span></span>
          <span class="os-cta"><i aria-hidden="true">${pm.icon}</i>${esc(pm.cta)}</span></button>
        <div class="os-bub" role="status" aria-live="polite" hidden></div></div>`;
    // звездата на мисията: нежно пулсиращ пръстен (само подчертаване на истинската следваща звезда)
    if (pm.star != null) { const g = host.querySelector(`.os-win .o-star[data-n="${pm.star}"]`); if (g) { g.classList.add("os-target"); const ns = "http://www.w3.org/2000/svg";
      [1, 2].forEach(i => { const c = document.createElementNS(ns, "circle"); c.setAttribute("r", "24"); c.setAttribute("class", "os-tring os-tring" + i); g.insertBefore(c, g.firstChild); }); } }
    const stage = host.querySelector(".os-stage"), ui = host.querySelector(".os-ui"), $ = (s) => ui.querySelector(s);
    const app = new PIXI.Application({ resizeTo: stage, backgroundColor: 0x160F0A, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    stage.appendChild(app.view); app.view.setAttribute("aria-hidden", "true");
    // Зори маха за поздрав: видео с прозрачен фон (VP9-alpha за Chrome/Android, HEVC-alpha за Safari); първият и последният кадър съвпадат с картинката
    const wv = document.createElement("video"), apple = /Apple/.test(navigator.vendor || ""); wv.className = "os-zwave"; wv.muted = true; wv.playsInline = true; wv.setAttribute("playsinline", ""); wv.setAttribute("aria-hidden", "true"); wv.preload = "auto";
    if (!reduced()) { wv.src = "assets/video/journey/zori_wave." + (apple ? "mov" : "webm"); stage.appendChild(wv); }
    const tweens = [], timers = [], T = (tw) => { tweens.push(tw); return tw; }, later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    let dead = false, busy = false, RM = ROOMS.land, key = "", sc = 1, off = { x: 0, y: 0 }, t0 = performance.now();
    // ---- слоевете ----
    const world = new PIXI.Container(); world.sortableChildren = true; app.stage.addChild(world);
    const room = new PIXI.Sprite(); room.zIndex = 0; world.addChild(room);
    const TEX = {}; let zori = null;
    const loadRoom = Object.values(ROOMS).map(r => PIXI.Assets.load(r.url).then(t => { TEX[r.url] = t; }));
    const lamps = [0, 1, 2].map(() => { const g = new PIXI.Sprite(radial()); g.anchor.set(.5); g.tint = 0xFFB347; g.blendMode = PIXI.BLEND_MODES.ADD; g.zIndex = 3; g._on = reduced() ? 1 : 0; world.addChild(g); return g; });
    const motes = []; for (let i = 0; i < 26; i++) { const m = new PIXI.Sprite(radial()); m.anchor.set(.5); m.tint = 0xFFD9A0; m.scale.set(.05 + Math.random() * .06); m._v = .12 + Math.random() * .25; m._p = Math.random() * 6; m.zIndex = 8; world.addChild(m); motes.push(m); }
    // светлината на предметите: мека (ADD) – по-силна при посочване/фокус; карта: отблясък, който минава по пергамента; телескоп: искра в обектива
    const glow = {}; Object.keys(OBJ).forEach(k => { const g = new PIXI.Sprite(radial()); g.anchor.set(.5); g.tint = 0xFFD27A; g.blendMode = PIXI.BLEND_MODES.ADD; g.alpha = 0; g.zIndex = 4; g._hot = 0; world.addChild(g); glow[k] = g; });
    const sheen = new PIXI.Sprite(radial()); sheen.anchor.set(.5); sheen.tint = 0xFFF1C2; sheen.blendMode = PIXI.BLEND_MODES.ADD; sheen.alpha = 0; sheen.zIndex = 5; world.addChild(sheen);
    const sheenMask = new PIXI.Graphics(); world.addChild(sheenMask); sheen.mask = sheenMask;
    const lensStar = new PIXI.Sprite(radial()); lensStar.anchor.set(.5); lensStar.tint = 0xBFE0FF; lensStar.blendMode = PIXI.BLEND_MODES.ADD; lensStar.zIndex = 5; world.addChild(lensStar);
    const shadow = new PIXI.Sprite(radial()); shadow.anchor.set(.5); shadow.tint = 0x000000; shadow.alpha = .5; shadow.zIndex = 5; world.addChild(shadow);
    let zTex = null, zBlink = null, blinkT = null;
    const zoriReady = Promise.all([PIXI.Assets.load(model.zori || "assets/img/zori/z_calm.png"), PIXI.Assets.load("assets/img/zori/z_calm_blink.png").catch(() => null)]).then(([t, b]) => { if (dead) return;
      zTex = t; zBlink = b; zori = new PIXI.Sprite(t); zori.anchor.set(.5, 1); zori.zIndex = 6; zori._dy = 0; world.addChild(zori); layout(); blink(); });
    // примигване: 120 ms, през 4–7 с (и при намалено движение – то е естествено, не е движение на сцената)
    function blink() { if (dead || !zBlink) return; blinkT = later(() => { if (dead || !zori) return; zori.texture = zBlink; later(() => { if (!dead && zori) zori.texture = zTex; blink(); }, 110 + Math.random() * 40); }, 4000 + Math.random() * 3000); }
    const dark = new PIXI.Graphics(); dark.beginFill(0x05040A).drawRect(-4000, -4000, 12000, 12000).endFill(); dark.zIndex = 9; dark.alpha = reduced() ? 0 : 1; world.addChild(dark);

    // ---- подредба: картината запълва екрана, режем най-много ~20%; вертикалната – за изправен екран ----
    const toScreen = (x, y) => ({ x: off.x + x * sc, y: off.y + y * sc });
    function layout() { if (dead) return; const W = app.screen.width, H0 = app.screen.height, k = H0 > W * 1.05 ? "port" : "land"; RM = ROOMS[k];
      const cover = Math.max(W / RM.w, H0 / RM.h), contain = Math.min(W / RM.w, H0 / RM.h); sc = Math.min(cover, contain * 1.25);
      const vh = H0 / sc; off = { x: (W - RM.w * sc) / 2, y: k === "port" ? H0 - RM.h * sc : vh >= RM.h ? (H0 - RM.h * sc) / 2 : -(RM.h - vh) * .45 * sc };
      if (!busy) { world.scale.set(sc); world.position.set(off.x, off.y); }
      if (k !== key && TEX[RM.url]) { key = k; room.texture = TEX[RM.url]; }
      RM.lamps.forEach(([x, y, s], i) => { lamps[i].position.set(x, y); lamps[i]._k = s; });
      motes.forEach(m => { if (m._init !== k) { m._init = k; m.position.set(Math.random() * RM.w, RM.h * (.25 + Math.random() * .6)); } });
      Object.entries(glow).forEach(([o, g]) => { const [x0, y0, x1, y1] = RM.box[o]; g.position.set((x0 + x1) / 2, (y0 + y1) / 2); g.width = (x1 - x0) * 1.5; g.height = (y1 - y0) * 1.25; });
      const [mx0, my0, mx1, my1] = RM.box.map; const mw0 = mx1 - mx0; sheenMask.clear().beginFill(0xffffff).drawRect(mx0 + mw0 * .12, my0 + (my1 - my0) * .06, mw0 * .76, (my1 - my0) * .5).endFill();
      // само върху пергамента
      sheen.height = (my1 - my0) * .9; sheen.width = (mx1 - mx0) * .28;
      lensStar.position.set(RM.lens[0], RM.lens[1]);
      const zy = zoriY(), zx = zoriX(); if (zori) { zori.position.set(zx, zy); zori._y = zy; zori.scale.set(RM.zori.h / zori.texture.height); zori._s = zori.scale.x; }
      shadow.position.set(zx, zy - 4); shadow.width = RM.zori.h * .55; shadow.height = RM.zori.h * .09;
      placeDom(); placeWave(); }
    // видеото: героят в кадъра е от y 49 до 482 (от 516) и центриран при x 186 (от 396) – напасваме го върху картинката
    function placeWave() { if (!wv.parentNode) return; const h = RM.zori.h * sc, p = toScreen(zoriX(), zoriY()), vh = h * 516 / 433;
      Object.assign(wv.style, { height: vh + "px", width: vh * 396 / 516 + "px", left: p.x - h * 186 / 433 + "px", top: p.y - h * 482 / 433 + "px" }); }
    let waving = false, afterWave = null;
    function wave() { if (dead || !zori || reduced() || !wv.parentNode || waving) return false; waving = true; placeWave();
      const end = () => { if (!waving) return; waving = false; wv.classList.remove("on"); if (zori) zori.alpha = 1; const f = afterWave; afterWave = null; if (f && !dead) f(); };
      wv.onplaying = () => { if (!waving || dead) return; wv.classList.add("on"); if (zori) zori.alpha = 0; }; wv.onended = end; wv.onerror = end; later(end, 7000);
      try { wv.currentTime = 0; wv.playbackRate = 1.2; const pr = wv.play(); if (pr && pr.catch) pr.catch(() => { end(); hop(.6); }); } catch (e) { end(); return false; } return true; }
    // ---- DOM над платното: бутоните (зоните на предметите), надписите, порталът, балонът ----
    function placeDom() { const W = app.screen.width, H0 = app.screen.height;
      ui.querySelectorAll(".os-hit").forEach(b => { const [x0, y0, x1, y1] = RM.box[b.dataset.k], p = toScreen(x0, y0), q = toScreen(x1, y1), pad = 6;
        const L = Math.max(0, p.x - pad), Tp = Math.max(56, p.y - pad), R = Math.min(W, q.x + pad), B = Math.min(H0, q.y + pad);
        Object.assign(b.style, { left: L + "px", top: Tp + "px", width: Math.max(44, R - L) + "px", height: Math.max(44, B - Tp) + "px" }); });
      ui.querySelectorAll(".os-chip").forEach(c => { const [x, y] = RM.tag[c.dataset.k], p = toScreen(x, y), hw = (c.offsetWidth || 110) / 2 + 8;
        c.style.left = Math.min(W - hw, Math.max(hw, p.x)) + "px"; c.style.top = Math.max(70, p.y) + "px"; });
      const w = RM.win, c = toScreen(w.x, w.y), d = w.r * 2 * sc * .94, po = $(".os-portal");
      Object.assign(po.style, { left: c.x - d / 2 + "px", top: c.y - d / 2 + "px", width: d + "px", height: d + "px" });
      // табелата на мисията: под прозореца (на перваза, леко върху долния ръб); тесен изправен екран – долу в средата
      const m = $(".os-mission"), narrow = H0 > W, low = !narrow && H0 < 520; m.classList.toggle("dock", narrow); m.classList.toggle("tight", low);
      if (narrow) Object.assign(m.style, { left: "50%", top: "auto", bottom: "max(14px, env(safe-area-inset-bottom))", maxWidth: "" });
      else if (low) { const mw = m.offsetWidth || 260, mr = toScreen(RM.box.tele[2], 0).x, zl = toScreen(zoriX(), 0).x - RM.zori.h * sc * .32 - 8;
        Object.assign(m.style, { left: Math.max(mr + mw / 2 - 40, Math.min(zl - mw / 2, c.x)) + "px", top: "auto", bottom: "max(10px, env(safe-area-inset-bottom))", maxWidth: "" }); }
      else { const mr = toScreen(RM.box.map[2], 0).x + 10, al = toScreen(RM.box.abac[0], 0).x - 10, mw = Math.max(240, Math.min(380, al - mr)); m.style.maxWidth = mw + "px";
        const mh = m.offsetHeight || 90, cx = Math.min(al - mw / 2, Math.max(mr + mw / 2, c.x));
        Object.assign(m.style, { left: cx + "px", bottom: "auto", top: Math.min(H0 - mh - 12, c.y + d / 2 - mh * .18) + "px" }); }
      // лъчът: от звездата на мисията (в центъра на прозореца) към табелата – окото минава звезда → мисия → „Продължи“
      const bm = $(".os-beam"), mr2 = m.getBoundingClientRect(), hr = ui.getBoundingClientRect(), tg = ui.querySelector(".os-target");
      // при табела долу (изправен / нисък екран) лъчът би минал през Зори – без него
      if (tg && mr2.height && !narrow && !low) { const x1 = c.x, y1 = c.y + d * .09, x2 = mr2.left - hr.left + mr2.width / 2, y2 = mr2.top - hr.top; Object.assign(bm.style, { display: y2 - y1 > 8 ? "" : "none" });
        const ln = bm.querySelector("line"); ln.setAttribute("x1", x1); ln.setAttribute("y1", y1); ln.setAttribute("x2", x2); ln.setAttribute("y2", y2); } else bm.style.display = "none";
      if (zori) { const h = RM.zori.h * sc, zp = toScreen(zoriX(), zoriY()); Object.assign($(".os-zori").style, { left: zp.x - h * .3 + "px", top: zp.y - h + "px", width: h * .6 + "px", height: h + "px" });
        // табелка, която се застъпва със Зори – над предмета
        const zr = $(".os-zori").getBoundingClientRect(); ui.querySelectorAll(".os-chip").forEach(c => { const r = c.getBoundingClientRect();
          if (!(r.left < zr.right && r.right > zr.left && r.top < zr.bottom && r.bottom > zr.top)) return;
          // първо – по-нагоре по самия предмет (табелката остава закачена на него); ако не стига – над предмета
          const by = toScreen(0, RM.box[c.dataset.k][1]).y, hh = c.offsetHeight || 24, need = r.bottom - zr.top + 6, ny = r.top - need;
          c.style.top = Math.max(70, ny >= by + hh * .5 ? ny : by - hh - 4) + "px"; }); }
      const tags = [...ui.querySelectorAll(".os-chip")]; for (let i = 0; i < tags.length; i++) for (let j = 0; j < tags.length; j++) { if (i === j) continue; const a = tags[i].getBoundingClientRect(), b2 = tags[j].getBoundingClientRect();
        if (j > i && a.left < b2.right && a.right > b2.left && a.top < b2.bottom && a.bottom > b2.top) tags[j].style.top = (parseFloat(tags[j].style.top) || 0) + (a.bottom - b2.top) + 4 + "px"; }
      placeBubble(); }
    // Зори стои над табелата, когато тя е долу (тесен изправен екран)
    const zoriX = () => { const W = app.screen.width, H0 = app.screen.height; return H0 <= W && H0 < 520 && RM === ROOMS.land ? 1215 : RM.zori.x; };
    const zoriY = () => { const W = app.screen.width, H0 = app.screen.height; if (!(H0 > W)) return RM.zori.y; const mh = ($(".os-mission").offsetHeight || 120) + 22; return Math.min(RM.zori.y, (H0 - mh - off.y) / sc); };
    function placeBubble() { const b = $(".os-bub"); if (!b || b.hidden || !zori) return; const W = app.screen.width, h = RM.zori.h * sc, p = toScreen(zoriX(), zoriY()), head = p.y - h * .97, side = h * .3;
      const st = { left: "", right: "", top: "", bottom: "", maxWidth: "" }, spR = W - (p.x + side) - 12, spL = p.x - side - 12;
      if (spR >= 120) Object.assign(st, { left: p.x + side + "px", top: Math.max(64, head) + "px", maxWidth: Math.min(280, spR) + "px" });
      else if (spL >= 120) Object.assign(st, { right: W - (p.x - side) + "px", top: Math.max(64, head) + "px", maxWidth: Math.min(280, spL) + "px" });
      else Object.assign(st, { left: "12px", right: "12px", top: Math.max(64, head - 70) + "px", maxWidth: "none" });
      Object.assign(b.style, st);
      // балонът не закрива портала и бутоните: ако се застъпва – скрива се (репликата се чува)
      const r = b.getBoundingClientRect(), hit = [...ui.querySelectorAll(".os-mission, .os-portal, .os-chip.on, .os-head, .os-older")].some(e => { const q = e.getBoundingClientRect(); return q.width && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top; });
      b.classList.toggle("off", hit); }
    let bubT = null;
    function say(text) { const b = $(".os-bub"); if (!b || !text) return; clearTimeout(bubT); gsap.killTweensOf(b); b.style.opacity = ""; b.textContent = text; b.hidden = false; placeBubble(); if (!reduced()) T(gsap.fromTo(b, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "back.out(2)" }));
      bubT = later(() => { if (!dead) T(gsap.to(b, { opacity: 0, duration: .4, onComplete: () => { b.hidden = true; b.style.opacity = ""; } })); }, Math.max(7000, 2500 + text.length * 90)); }

    // ---- посочване / фокус: светлина и надпис ----
    const hot = (k, on) => { if (!glow[k]) return; glow[k]._hot = on ? 1 : 0; const c = ui.querySelector(`.os-chip[data-k="${k}"]`); if (c) c.classList.toggle("hot", on); };
    ui.querySelectorAll(".os-hit").forEach(b => { const k = b.dataset.k;
      b.addEventListener("pointerenter", () => hot(k, true)); b.addEventListener("pointerleave", () => hot(k, false)); b.addEventListener("focus", () => hot(k, true)); b.addEventListener("blur", () => hot(k, false));
      b.addEventListener("click", () => activate(k)); });
    $(".os-portal").addEventListener("click", () => activate("mission")); $(".os-mission").addEventListener("click", () => activate("mission"));
    $(".os-zori").addEventListener("click", () => { if (busy) return; say(model.line); if (model.voice) model.voice(); if (!wave()) hop(.45); });
    // поздрав: кратък подскок с наклон (без при намалено движение)
    function hop(d) { if (!zori || reduced()) return; T(gsap.timeline().to(zori, { _dy: -22, rotation: -.05, duration: d * .45, ease: "power2.out" }).to(zori, { _dy: 0, rotation: 0, duration: d * .55, ease: "bounce.out" })); }

    // ---- камерата: приближава предмета; после – действието (екранът се сменя, сцената се освобождава) ----
    function focus(box, dur, fill) { const [x0, y0, x1, y1] = box, W = app.screen.width, H0 = app.screen.height, s = Math.min(W / (x1 - x0), H0 / (y1 - y0)) * fill, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return new Promise(res => { T(gsap.to(world.scale, { x: s, y: s, duration: dur, ease: "power2.inOut" })); T(gsap.to(world.position, { x: W / 2 - cx * s, y: H0 / 2 - cy * s, duration: dur, ease: "power2.inOut", onComplete: res })); }); }
    function cover(cls, dur) { const c = document.createElement("div"); c.className = "os-cover " + cls; document.body.appendChild(c);
      return new Promise(res => gsap.fromTo(c, { opacity: 0 }, { opacity: 1, duration: dur, ease: "power1.in", onComplete: () => res(c) })); }
    const reveal = (c) => { if (c) gsap.to(c, { opacity: 0, duration: .45, delay: .05, onComplete: () => c.remove() }); };
    async function activate(k) { if (busy || dead) return; busy = true; const calm = reduced(); hot(k, true);
      T(gsap.to(ui.querySelectorAll(".os-hit, .os-chip, .os-bub, .os-head, .os-older, .os-mission"), { opacity: 0, duration: .2 }));
      const win = RM.win, winBox = [win.x - win.r, win.y - win.r, win.x + win.r, win.y + win.r]; let c = null;
      try {
        if (k === "abac") { if (!calm) await focus(RM.box.abac, .7, .85); c = await cover("os-dark", calm ? .2 : .25); unmount(); H.abacus(); return; }   // друга страница – покривалото остава
        if (k === "tele") { if (!calm) { const [lx, ly] = RM.lens; await focus([lx - 150, ly - 120, lx + 150, ly + 120], .55, .9); } c = await cover("os-lens", calm ? .2 : .3); unmount(); H.games(); reveal(c); return; }
        if (k === "map") { if (!calm) await focus(RM.box.map, .55, 1); c = await cover("os-unroll" + (calm ? "" : " anim"), calm ? .2 : .45); unmount(); H.map(); reveal(c); return; }
        if (k === "mission") { T(gsap.to(ui.querySelector(".os-portal .os-win"), { boxShadow: "0 0 80px rgba(255,220,140,.9)", duration: .3 })); if (!calm) await focus(winBox, .6, 1.1); c = await cover("os-stars", calm ? .2 : .3); unmount(); H.mission(); reveal(c); return; }
      } catch (e) { if (c) c.remove(); throw e; } }

    // ---- живот на стаята ----
    let sheenT = 2;
    app.ticker.add((dt) => { if (dead) return; const t = (performance.now() - t0) / 1000, calm = reduced();
      lamps.forEach((g, i) => { const f = calm ? .55 : .5 + .1 * Math.sin(t * 8 + i * 2) + .06 * Math.sin(t * 21 + i); g.alpha = f * g._on; g.scale.set((g._k || 1) * (1.6 + (calm ? 0 : .06 * Math.sin(t * 4 + i))) * (.4 + .6 * g._on)); });
      motes.forEach(m => { if (calm) { m.alpha = 0; return; } m.y -= m._v * dt; m.x += Math.sin(t * .6 + m._p) * .2; m.alpha = .16 + .2 * (.5 + .5 * Math.sin(t * 1.3 + m._p)); if (m.y < RM.h * .2) { m.y = RM.h * .85; m.x = Math.random() * RM.w; } });
      Object.entries(glow).forEach(([k, g], i) => { const base = calm ? .06 : .05 + .04 * (.5 + .5 * Math.sin(t * 1.4 - i * 1.2)); g.alpha += ((g._hot ? .42 : base) - g.alpha) * .15; });
      if (!calm) { sheenT -= dt / 60; if (sheenT < 0) { const [x0, , x1] = RM.box.map, k = Math.min(1, -sheenT / 1.4); sheen.position.set(x0 + (x1 - x0) * (-.2 + 1.4 * k), RM.box.map[1] + (RM.box.map[3] - RM.box.map[1]) * .32); sheen.alpha = Math.sin(k * Math.PI) * .55; if (k >= 1) { sheenT = 4 + Math.random() * 3; sheen.alpha = 0; } } }
      lensStar.alpha = calm ? .35 : .35 + .35 * Math.max(0, Math.sin(t * 1.7)); lensStar.scale.set(calm ? .35 : .3 + .12 * Math.sin(t * 1.7));
      if (zori && zori._s) { const b = calm ? 0 : Math.sin(t * 1.9); zori.scale.set(zori._s * (1 - b * .005), zori._s * (1 + b * .014)); zori.y = zori._y + zori._dy;
        if (!gsap.isTweening(zori)) zori.rotation = calm ? 0 : Math.sin(t * .8) * .016; } });
    const onResize = () => layout(), onVis = () => { if (document.hidden) app.ticker.stop(); else if (!dead) app.ticker.start(); };
    window.addEventListener("resize", onResize); window.addEventListener("orientationchange", onResize); document.addEventListener("visibilitychange", onVis);
    // мобилните браузъри: лентата с адреса се свива/разгъва – височината се променя без „resize“ на прозореца
    const vv = window.visualViewport; if (vv) vv.addEventListener("resize", onResize);

    // ---- влизане: стаята е тъмна, фенерите светват един по един, Зори поздравява ----
    Promise.all(loadRoom).then(() => zoriReady).then(() => { if (dead) return; layout(); requestAnimationFrame(() => !dead && layout());
      if (!reduced()) { T(gsap.to(dark, { alpha: 0, duration: 1.1, ease: "power1.in", delay: .1 })); lamps.forEach((g, i) => T(gsap.to(g, { _on: 1, duration: .45, delay: .3 + i * .25, ease: "back.out(3)" })));
        T(gsap.from(ui.querySelectorAll(".os-portal, .os-mission"), { opacity: 0, y: 14, duration: .55, delay: .7, stagger: .12, ease: "back.out(1.6)" })); later(() => { if (!wave()) hop(.6); }, 1000); }
      later(() => model.guide ? guide() : say(model.line), reduced() ? 200 : 1300); }).catch(() => {});
    function guide() { const tg = ui.querySelector(".os-target"); say(model.guide); if (model.voice) model.voice(model.guide); if (!tg) return;
      if (waving) { afterWave = () => point(tg); return; } point(tg); }
    // жестът: пръстените пламват, Зори се обръща към прозореца, искра от ръката до звездата
    function point(tg) { tg.classList.add("os-flash"); later(() => tg.classList.remove("os-flash"), 2600);
      if (reduced() || !zori) return; const dir = RM.zori.x > RM.win.x ? -1 : 1;
      T(gsap.timeline().to(zori, { rotation: .07 * dir, _dy: -8, duration: .45, ease: "power2.out" }).to(zori, { rotation: 0, _dy: 0, duration: .6, ease: "power2.inOut", delay: 1.1 }));
      const hand = toScreen(zoriX() + dir * RM.zori.h * .26, zoriY() - RM.zori.h * .45), w = RM.win, to = toScreen(w.x, w.y), sp = document.createElement("i"); sp.className = "os-spark"; ui.appendChild(sp);
      const o = { t: 0 }, mx = (hand.x + to.x) / 2, my = Math.min(hand.y, to.y) - 60;
      T(gsap.to(o, { t: 1, duration: 1.1, delay: .35, ease: "power1.inOut", onUpdate: () => { const t = o.t, x = (1 - t) * (1 - t) * hand.x + 2 * (1 - t) * t * mx + t * t * to.x, y = (1 - t) * (1 - t) * hand.y + 2 * (1 - t) * t * my + t * t * to.y;
        sp.style.left = x + "px"; sp.style.top = y + "px"; sp.style.opacity = String(Math.min(1, t * 4, (1 - t) * 6 + .2)); }, onComplete: () => sp.remove() })); }
    layout();

    function unmount() { if (dead) return; dead = true; tweens.forEach(tw => tw.kill()); timers.forEach(clearTimeout); try { wv.pause(); wv.removeAttribute("src"); wv.load(); wv.remove(); } catch (e) {}
      window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); document.removeEventListener("visibilitychange", onVis); if (vv) vv.removeEventListener("resize", onResize);
      try { app.destroy(true, { children: true, texture: false, baseTexture: false }); } catch (e) {} }
    return { ui, unmount, say, layout, activate, get alive() { return !dead; }, get blinking() { return !!(zori && zBlink && zori.texture === zBlink); }, get waving() { return waving; } };   // blinking – за автоматичните проверки
  }
  window.ObsScene = { mount };
})();
