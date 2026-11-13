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
    land: { url: "assets/img/journey/room_land.webp", w: 1536, h: 1024, win: { x: 780, y: 255, r: 285 }, zori: { x: 985, y: 945, h: 320 },
      box: { tele: [85, 150, 425, 855], map: [378, 348, 630, 762], abac: [1148, 328, 1368, 588] }, lens: [410, 190],
      lamps: [[75, 505, 1.1], [1455, 92, 1], [1111, 482, .8]] },
    port: { url: "assets/img/journey/room_port.webp", w: 1024, h: 1536, win: { x: 510, y: 325, r: 240 }, zori: { x: 500, y: 1430, h: 380 },
      box: { tele: [50, 470, 385, 1235], map: [255, 625, 495, 1015], abac: [685, 568, 885, 812] }, lens: [372, 492],
      lamps: [[60, 270, 1], [985, 410, .9], [643, 735, .8]] } };
  const OBJ = { abac: { icon: "🧮", name: "Абакус", aria: "Абакус – свободна тренировка" }, tele: { icon: "🔭", name: "Игри", aria: "Телескоп – игри" },
    map: { icon: "🗺️", name: "Звездна карта", aria: "Звездна карта" } };
  let glowTex = null;
  const radial = () => { if (glowTex && glowTex.valid) return glowTex; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.35, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return glowTex = PIXI.Texture.from(c); };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function mount(host, model, H) {
    if (!window.PIXI || !window.gsap || !PIXI.utils.isWebGLSupported()) throw new Error("scene: no WebGL/PIXI/GSAP");
    const root = document.documentElement, reduced = () => root.classList.contains("o-calm") || root.classList.contains("o-still") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    host.innerHTML = `<div class="os-stage"></div><div class="os-ui">
        <button class="os-portal" type="button" aria-label="${esc(model.portal.aria)}"><span class="os-win">${model.portal.svg || ""}<span class="o-glass"></span></span>
          <span class="os-plaque">${model.portal.kicker ? `<em>${esc(model.portal.kicker)}</em>` : ""}<b>${esc(model.portal.title)}</b><small>${esc(model.portal.sub)}</small>${model.portal.dots || ""}
            <span class="os-cta"><i aria-hidden="true">${model.portal.icon}</i>${esc(model.portal.cta)}</span></span></button>
        ${Object.entries(OBJ).map(([k, o]) => `<button class="os-hit" type="button" data-k="${k}" aria-label="${o.aria}"></button><span class="os-chip${model.chips ? " on" : ""}" data-k="${k}" aria-hidden="true"><i>${o.icon}</i>${o.name}</span>`).join("")}
        <div class="os-bub" role="status" aria-live="polite" hidden></div></div>`;
    const stage = host.querySelector(".os-stage"), ui = host.querySelector(".os-ui"), $ = (s) => ui.querySelector(s);
    const app = new PIXI.Application({ resizeTo: stage, backgroundColor: 0x160F0A, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    stage.appendChild(app.view); app.view.setAttribute("aria-hidden", "true");
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
    const zoriReady = PIXI.Assets.load(model.zori || "assets/img/zori/z_calm.png").then(t => { if (dead) return; zori = new PIXI.Sprite(t); zori.anchor.set(.5, 1); zori.zIndex = 6; world.addChild(zori); layout(); });
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
      const [mx0, my0, mx1, my1] = RM.box.map; sheenMask.clear().beginFill(0xffffff).drawRect(mx0 + 10, my0 + 10, mx1 - mx0 - 20, (my1 - my0) * .62).endFill(); sheen.height = (my1 - my0) * .9; sheen.width = (mx1 - mx0) * .28;
      lensStar.position.set(RM.lens[0], RM.lens[1]);
      if (zori) { zori.position.set(RM.zori.x, RM.zori.y); zori.scale.set(RM.zori.h / zori.texture.height); zori._s = zori.scale.x; }
      shadow.position.set(RM.zori.x, RM.zori.y - 4); shadow.width = RM.zori.h * .55; shadow.height = RM.zori.h * .09;
      placeDom(); }
    // ---- DOM над платното: бутоните (зоните на предметите), надписите, порталът, балонът ----
    function placeDom() { const W = app.screen.width, H0 = app.screen.height;
      ui.querySelectorAll(".os-hit").forEach(b => { const [x0, y0, x1, y1] = RM.box[b.dataset.k], p = toScreen(x0, y0), q = toScreen(x1, y1), pad = 6;
        const L = Math.max(0, p.x - pad), Tp = Math.max(56, p.y - pad), R = Math.min(W, q.x + pad), B = Math.min(H0, q.y + pad);
        Object.assign(b.style, { left: L + "px", top: Tp + "px", width: Math.max(44, R - L) + "px", height: Math.max(44, B - Tp) + "px" }); });
      ui.querySelectorAll(".os-chip").forEach(c => { const [x0, y0, x1, y1] = RM.box[c.dataset.k], cx = (x0 + x1) / 2, y = c.dataset.k === "tele" ? y0 + (y1 - y0) * .55 : y0, p = toScreen(cx, y), hw = (c.offsetWidth || 110) / 2 + 8;
        c.style.left = Math.min(W - hw, Math.max(hw, p.x)) + "px"; c.style.top = Math.max(70, p.y - 8) + "px"; });
      const w = RM.win, c = toScreen(w.x, w.y), d = w.r * 2 * sc * .94, po = $(".os-portal");
      Object.assign(po.style, { left: c.x - d / 2 + "px", top: c.y - d / 2 + "px", width: d + "px", height: d + "px" });
      po.classList.toggle("small", d < 300); placeBubble(); }
    function placeBubble() { const b = $(".os-bub"); if (!b || b.hidden || !zori) return; const W = app.screen.width, h = RM.zori.h * sc, p = toScreen(RM.zori.x, RM.zori.y), head = p.y - h * .97, side = h * .3;
      const st = { left: "", right: "", top: "", bottom: "", maxWidth: "" }, spR = W - (p.x + side) - 12, spL = p.x - side - 12;
      if (spR >= 170) Object.assign(st, { left: p.x + side + "px", top: Math.max(64, head) + "px", maxWidth: Math.min(280, spR) + "px" });
      else if (spL >= 170) Object.assign(st, { right: W - (p.x - side) + "px", top: Math.max(64, head) + "px", maxWidth: Math.min(280, spL) + "px" });
      else Object.assign(st, { left: "12px", right: "12px", top: Math.max(64, head - 70) + "px", maxWidth: "none" });
      Object.assign(b.style, st);
      // балонът не закрива портала и бутоните: ако се застъпва – скрива се (репликата се чува)
      const r = b.getBoundingClientRect(), hit = [...ui.querySelectorAll(".os-portal, .os-chip.on, .os-head, .os-older")].some(e => { const q = e.getBoundingClientRect(); return q.width && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top; });
      b.classList.toggle("off", hit); }
    function say(text) { const b = $(".os-bub"); if (!b || !text) return; b.textContent = text; b.hidden = false; placeBubble(); if (!reduced()) T(gsap.fromTo(b, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "back.out(2)" }));
      later(() => { if (!dead) T(gsap.to(b, { opacity: 0, duration: .4, onComplete: () => { b.hidden = true; b.style.opacity = ""; } })); }, Math.max(6500, text.length * 110)); }

    // ---- посочване / фокус: светлина и надпис ----
    const hot = (k, on) => { if (!glow[k]) return; glow[k]._hot = on ? 1 : 0; const c = ui.querySelector(`.os-chip[data-k="${k}"]`); if (c) c.classList.toggle("hot", on); };
    ui.querySelectorAll(".os-hit").forEach(b => { const k = b.dataset.k;
      b.addEventListener("pointerenter", () => hot(k, true)); b.addEventListener("pointerleave", () => hot(k, false)); b.addEventListener("focus", () => hot(k, true)); b.addEventListener("blur", () => hot(k, false));
      b.addEventListener("click", () => activate(k)); });
    $(".os-portal").addEventListener("click", () => activate("mission"));

    // ---- камерата: приближава предмета; после – действието (екранът се сменя, сцената се освобождава) ----
    function focus(box, dur, fill) { const [x0, y0, x1, y1] = box, W = app.screen.width, H0 = app.screen.height, s = Math.min(W / (x1 - x0), H0 / (y1 - y0)) * fill, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return new Promise(res => { T(gsap.to(world.scale, { x: s, y: s, duration: dur, ease: "power2.inOut" })); T(gsap.to(world.position, { x: W / 2 - cx * s, y: H0 / 2 - cy * s, duration: dur, ease: "power2.inOut", onComplete: res })); }); }
    function cover(cls, dur) { const c = document.createElement("div"); c.className = "os-cover " + cls; document.body.appendChild(c);
      return new Promise(res => gsap.fromTo(c, { opacity: 0 }, { opacity: 1, duration: dur, ease: "power1.in", onComplete: () => res(c) })); }
    const reveal = (c) => { if (c) gsap.to(c, { opacity: 0, duration: .45, delay: .05, onComplete: () => c.remove() }); };
    async function activate(k) { if (busy || dead) return; busy = true; const calm = reduced(); hot(k, true);
      T(gsap.to(ui.querySelectorAll(".os-hit, .os-chip, .os-bub, .os-head, .os-older"), { opacity: 0, duration: .2 }));
      const win = RM.win, winBox = [win.x - win.r, win.y - win.r, win.x + win.r, win.y + win.r]; let c = null;
      try {
        if (k === "abac") { if (!calm) await focus(RM.box.abac, .7, .85); c = await cover("os-dark", calm ? .2 : .25); unmount(); H.abacus(); return; }   // друга страница – покривалото остава
        if (k === "tele") { if (!calm) { const [lx, ly] = RM.lens; await focus([lx - 150, ly - 120, lx + 150, ly + 120], .55, .9); } c = await cover("os-lens", calm ? .2 : .3); unmount(); H.games(); reveal(c); return; }
        if (k === "map") { if (!calm) await focus(RM.box.map, .55, 1); c = await cover("os-unroll" + (calm ? "" : " anim"), calm ? .2 : .45); unmount(); H.map(); reveal(c); return; }
        if (k === "mission") { T(gsap.to(".os-portal", { opacity: 0, duration: .25 })); if (!calm) await focus(winBox, .6, 1.1); c = await cover("os-stars", calm ? .2 : .3); unmount(); H.mission(); reveal(c); return; }
      } catch (e) { if (c) c.remove(); throw e; } }

    // ---- живот на стаята ----
    let sheenT = 2;
    app.ticker.add((dt) => { if (dead) return; const t = (performance.now() - t0) / 1000, calm = reduced();
      lamps.forEach((g, i) => { const f = calm ? .55 : .5 + .1 * Math.sin(t * 8 + i * 2) + .06 * Math.sin(t * 21 + i); g.alpha = f * g._on; g.scale.set((g._k || 1) * (1.6 + (calm ? 0 : .06 * Math.sin(t * 4 + i))) * (.4 + .6 * g._on)); });
      motes.forEach(m => { if (calm) { m.alpha = 0; return; } m.y -= m._v * dt; m.x += Math.sin(t * .6 + m._p) * .2; m.alpha = .16 + .2 * (.5 + .5 * Math.sin(t * 1.3 + m._p)); if (m.y < RM.h * .2) { m.y = RM.h * .85; m.x = Math.random() * RM.w; } });
      Object.entries(glow).forEach(([k, g], i) => { const base = calm ? .06 : .05 + .04 * (.5 + .5 * Math.sin(t * 1.4 - i * 1.2)); g.alpha += ((g._hot ? .42 : base) - g.alpha) * .15; });
      if (!calm) { sheenT -= dt / 60; if (sheenT < 0) { const [x0, , x1] = RM.box.map, k = Math.min(1, -sheenT / 1.4); sheen.position.set(x0 + (x1 - x0) * (-.2 + 1.4 * k), RM.box.map[1] + (RM.box.map[3] - RM.box.map[1]) * .32); sheen.alpha = Math.sin(k * Math.PI) * .55; if (k >= 1) { sheenT = 4 + Math.random() * 3; sheen.alpha = 0; } } }
      lensStar.alpha = calm ? .35 : .35 + .35 * Math.max(0, Math.sin(t * 1.7)); lensStar.scale.set(calm ? .35 : .3 + .12 * Math.sin(t * 1.7));
      if (zori && zori._s) { const b = calm ? 0 : Math.sin(t * 2); zori.scale.set(zori._s * (1 - b * .004), zori._s * (1 + b * .012)); zori.rotation = calm ? 0 : Math.sin(t * .9) * .012; } });
    const onResize = () => layout(), onVis = () => { if (document.hidden) app.ticker.stop(); else if (!dead) app.ticker.start(); };
    window.addEventListener("resize", onResize); window.addEventListener("orientationchange", onResize); document.addEventListener("visibilitychange", onVis);

    // ---- влизане: стаята е тъмна, фенерите светват един по един, Зори поздравява ----
    Promise.all(loadRoom).then(() => zoriReady).then(() => { if (dead) return; layout();
      if (!reduced()) { T(gsap.to(dark, { alpha: 0, duration: 1.1, ease: "power1.in", delay: .1 })); lamps.forEach((g, i) => T(gsap.to(g, { _on: 1, duration: .45, delay: .3 + i * .25, ease: "back.out(3)" })));
        T(gsap.from(ui.querySelector(".os-portal"), { opacity: 0, scale: .92, duration: .55, delay: .7, ease: "back.out(1.6)" })); }
      later(() => say(model.line), reduced() ? 200 : 1300); }).catch(() => {});
    layout();

    function unmount() { if (dead) return; dead = true; tweens.forEach(tw => tw.kill()); timers.forEach(clearTimeout);
      window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); document.removeEventListener("visibilitychange", onVis);
      try { app.destroy(true, { children: true, texture: false, baseTexture: false }); } catch (e) {} }
    return { ui, unmount, say, layout, activate, get alive() { return !dead; } };
  }
  window.ObsScene = { mount };
})();
