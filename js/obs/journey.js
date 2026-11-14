/* Полетът до звездата – Фаза 2, първи вертикален сценарий (observatory.html?scene=1, 14.11.2026).
   САМО ИЗГЛЕД: не чете и не пише прогрес. Получава готова цел (истинската следваща мисия, определена от js/obs/app.js) и функция launch(),
   която стартира съществуващото домашно / урока с тутора. launch() се вика точно веднъж; при грешка – веднага (резервен път).
   Състояния: IDLE → DEPARTING → FLYING → ARRIVING → LEARNING (RETURNING е в сцената на обсерваторията; CANCELLED – прекъснат преди старта).
   start({ target: { n, kicker, title, sub }, first, reduced, say(text) → Promise, launch(), onState(s) }) → { skip(), cancel(), state } */
(function () {
  const S = { IDLE: "IDLE", DEPARTING: "DEPARTING", FLYING: "FLYING", ARRIVING: "ARRIVING", LEARNING: "LEARNING", RETURNING: "RETURNING", CANCELLED: "CANCELLED" };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ARRIVE_LINE = "Пристигнахме!";
  let glowTex = null, starTex = null;
  const radial = () => { if (glowTex && glowTex.valid) return glowTex; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.35, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return glowTex = PIXI.Texture.from(c); };
  // звездата-цел: петолъчка със златист градиент (същата форма като звездите на картата)
  const starShape = () => { if (starTex && starTex.valid) return starTex; const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    g.translate(128, 128); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 46 : 104; g[i ? "lineTo" : "moveTo"](rr * Math.cos(a), rr * Math.sin(a)); } g.closePath();
    const gr = g.createRadialGradient(0, -10, 6, 0, 0, 110); gr.addColorStop(0, "#FFFBE6"); gr.addColorStop(.45, "#FFE08A"); gr.addColorStop(1, "#E9A93A"); g.fillStyle = gr;
    g.shadowColor = "rgba(255,214,120,.9)"; g.shadowBlur = 18; g.fill(); g.lineWidth = 4; g.strokeStyle = "rgba(255,248,220,.85)"; g.stroke(); return starTex = PIXI.Texture.from(c); };

  function start(o) {
    let state = S.IDLE, dead = false, launched = false, app = null, tl = null, waitGo = false, onResize = () => {}, relayout = null;
    const tweens = [], timers = [], later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; }, T = (tw) => { tweens.push(tw); return tw; };
    const t = o.target || {}, reduced = !!o.reduced || !window.PIXI || !window.gsap || !(PIXI.utils && PIXI.utils.isWebGLSupported());
    const root = document.createElement("div"); root.className = "oj" + (reduced ? " oj-calm" : ""); root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Полет до звездата");
    root.innerHTML = `<div class="oj-stage" aria-hidden="true"></div>${reduced ? `<div class="oj-sstar" aria-hidden="true"></div>` : ""}
      <button class="oj-skip" type="button">Пропусни <span aria-hidden="true">›</span></button>
      <div class="oj-arrive" hidden><div class="oj-plaque">${t.kicker ? `<em>${esc(t.kicker)}</em>` : ""}<b>${esc(t.title)}</b>${t.sub ? `<small>${esc(t.sub)}</small>` : ""}</div>
        <button class="oj-go" type="button" hidden><i aria-hidden="true">▶</i> Започни</button></div>
      <div class="oj-bub" role="status" aria-live="polite" hidden></div>${reduced ? `<img class="oj-szori" src="assets/img/zori/z_fly.png" alt="" aria-hidden="true">` : ""}`;
    document.body.appendChild(root);
    const $ = (s) => root.querySelector(s), set = (s) => { state = s; root.dataset.state = s; if (o.onState) try { o.onState(s); } catch (e) {} };
    set(S.DEPARTING);

    // ---- изходите: стартът на мисията (точно веднъж) и почистването ----
    function cleanup() { dead = true; tweens.forEach(tw => tw && tw.kill && tw.kill()); timers.forEach(clearTimeout); if (tl) tl.kill();
      document.removeEventListener("keydown", onKey, true); window.removeEventListener("resize", onResize);
      try { if (app) app.destroy(true, { children: true, texture: false, baseTexture: false }); } catch (e) {} app = null; }
    function go() { if (launched) return; launched = true; set(S.LEARNING); cleanup();
      try { o.launch(); } catch (e) { console.warn("Полетът: стартът на мисията", e); }
      root.classList.add("oj-out"); setTimeout(() => root.remove(), 420); }
    function cancel() { if (launched || dead) return; set(S.CANCELLED); cleanup(); root.remove(); }
    const fail = (e) => { console.warn("Полетът не тръгна – мисията започва направо.", e); window.__journeyErr = String(e && e.stack || e); go(); };

    // ---- пристигане: табелата с истинската мисия, „Пристигнахме!“; първи полет / намалено движение – бутон „Започни“, иначе – след репликата ----
    function arrive() { if (dead || state === S.ARRIVING) return; set(S.ARRIVING); $(".oj-skip").hidden = true;
      const box = $(".oj-arrive"); box.hidden = false; requestAnimationFrame(() => box.classList.add("on"));
      const bub = $(".oj-bub"); bub.textContent = ARRIVE_LINE; bub.hidden = false; requestAnimationFrame(() => bub.classList.add("on"));
      if (!reduced && relayout) relayout();
      waitGo = !!o.first || reduced; const btn = $(".oj-go");
      if (waitGo) { btn.hidden = false; later(() => { try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); } }, 60); }
      Promise.resolve(o.say ? o.say(ARRIVE_LINE) : null).catch(() => {}).then(() => { if (!dead && !waitGo) later(go, 250); });   // автоматично – едва след репликата
    }
    $(".oj-go").addEventListener("click", go);
    // пропускане: веднага до пристигането (по време на пристигането без бутон – направо към мисията)
    function skip() { if (dead) return; if (state === S.FLYING || state === S.DEPARTING) { if (tl) tl.progress(1); arrive(); } else if (state === S.ARRIVING && !waitGo) go(); }
    $(".oj-skip").addEventListener("click", skip);
    function onKey(e) { if (dead) return; if (e.key === "Escape" || ((e.key === "Enter" || e.key === " ") && !(e.target && e.target.closest && e.target.closest("button")))) { e.preventDefault(); skip(); } }
    document.addEventListener("keydown", onKey, true);
    later(() => { try { $(".oj-skip").focus({ preventScroll: true }); } catch (e) {} }, 50);

    // ---- намалено движение / без WebGL: кратко избледняване, звездата и табелата веднага ----
    if (reduced) { later(arrive, 250); return api(); }

    // ---- полетът: PixiJS ----
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    const fx = { p: 0, spd: .15, boost: 0 }, stars = [], dust = [], trail = [];
    try {
      app = new PIXI.Application({ resizeTo: $(".oj-stage"), backgroundColor: 0x070A22, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
      $(".oj-stage").appendChild(app.view);
      const bg = new PIXI.Sprite(); bg.anchor.set(.5); bg.alpha = 0; app.stage.addChild(bg);
      PIXI.Assets.load("assets/img/journey/bg_space.webp").then(tx => { if (dead) return; bg.texture = tx; resize(); T(gsap.to(bg, { alpha: .55, duration: .6 })); }).catch(() => {});
      const field = new PIXI.Container(); app.stage.addChild(field);
      for (let i = 0; i < 180; i++) { const s = new PIXI.Sprite(radial()); s.anchor.set(.5); s.blendMode = PIXI.BLEND_MODES.ADD; s.tint = i % 9 ? 0xFFFFFF : 0xFFE3A0; s._a = Math.random() * 6.283; s._z = .05 + Math.random(); s._l = i % 3; field.addChild(s); stars.push(s); }
      for (let i = 0; i < 36; i++) { const d = new PIXI.Sprite(radial()); d.anchor.set(.5); d.blendMode = PIXI.BLEND_MODES.ADD; d.tint = 0xFFC95A; d._x = Math.random(); d._y = Math.random(); d._v = .02 + Math.random() * .05; d._p = Math.random() * 6; field.addChild(d); dust.push(d); }
      const halo = new PIXI.Sprite(radial()); halo.anchor.set(.5); halo.tint = 0xFFD27A; halo.blendMode = PIXI.BLEND_MODES.ADD; app.stage.addChild(halo);
      const target = new PIXI.Sprite(starShape()); target.anchor.set(.5); app.stage.addChild(target);
      const wave = new PIXI.Graphics(); app.stage.addChild(wave); let waveT = 1;
      const trailC = new PIXI.Container(); app.stage.addChild(trailC);
      const zori = new PIXI.Sprite(); zori.anchor.set(.5); zori.alpha = 0; app.stage.addChild(zori);
      PIXI.Assets.load("assets/img/zori/z_fly.png").then(tx => { if (dead) return; zori.texture = tx; resize(); T(gsap.to(zori, { alpha: 1, duration: .35 })); }).catch(() => {});
      // звездата-цел се докосва (по желание, само при първия полет): светлинна вълна и по-бързо пристигане
      if (o.first) { target.eventMode = "static"; target.cursor = "pointer"; target.on("pointertap", () => { if (state !== S.FLYING) return; waveT = 0; if (tl) tl.timeScale(3.2); }); }
      function resize() { if (!app) return; W = app.screen.width; H = app.screen.height; const port = H > W, low = !port && H < 520; cx = W / 2; cy = H * (port ? .34 : low ? .27 : .40); R = Math.min(W, H) * (port ? .2 : low ? .13 : .17);
        if (bg.texture && bg.texture.width > 1) { const k = Math.max(W / bg.texture.width, H / bg.texture.height) * 1.12; bg.scale.set(k); bg.position.set(cx, H / 2); }
        placeDom(); }
      // Зори и балонът не застъпват табелата и бутона: на изправен екран Зори е под тях (по-малък, ако трябва)
      function zoriBox() { const port = H > W; let zh = Math.min(H * (port ? .30 : .42), 330), zx = port ? W * .22 : W * .2, zcy = port ? H * .74 : H * .66;
        const box = $(".oj-arrive"); if (port && !box.hidden) { const bb = box.getBoundingClientRect().bottom + 12, room = H - bb - 16; if (room < zh) zh = Math.max(110, room); zcy = Math.max(zcy, bb + zh / 2); }
        return { zh, zx, zcy }; }
      function placeDom() { const box = $(".oj-arrive"), bub = $(".oj-bub");
        box.style.top = cy + R * 1.08 + (H < 520 ? 8 : 18) + "px";
        const { zh, zx, zcy } = zoriBox();
        if (zori.texture && zori.texture.height > 1) { zori.scale.set(zh / zori.texture.height); zori._x = zx; zori._y = zcy; }
        const bw = bub.offsetWidth || 150, bh = bub.offsetHeight || 44; let bx = Math.min(W - bw - 10, zx + zh * .3), by = Math.max(70, zcy - zh * .55 - bh * .2);
        const br = box.hidden ? null : box.getBoundingClientRect();
        if (br && bx < br.right && bx + bw > br.left && by < br.bottom && by + bh > br.top) by = br.bottom + 8;   // под табелата, до Зори
        Object.assign(bub.style, { left: bx + "px", top: Math.min(H - bh - 10, by) + "px" }); }
      onResize = () => resize(); relayout = () => { if (zori.texture && zori.texture.height > 1) { const z0 = { x: zori._x, y: zori._y, s: zori.scale.x }; placeDom(); const z1 = { x: zori._x, y: zori._y, s: zori.scale.x };
          zori._x = z0.x; zori._y = z0.y; zori.scale.set(z0.s); T(gsap.to(zori, { _x: z1.x, _y: z1.y, duration: .5, ease: "power2.out" })); T(gsap.to(zori.scale, { x: z1.s, y: z1.s, duration: .5, ease: "power2.out" })); } else placeDom(); };
      window.addEventListener("resize", onResize);
      resize();
      // ---- времева линия: първи полет ≈ 2,3 с, следващите ≈ 0,7 с ----
      const F = o.first ? 2.3 : .7;
      set(S.FLYING);
      tl = gsap.timeline({ onComplete: arrive });
      tl.fromTo(fx, { p: 0 }, { p: 1, duration: F, ease: "power1.inOut" }, 0);
      let frames = 0, slow = 0, t0 = performance.now();
      app.ticker.add((dt) => { if (dead) return; const now = (performance.now() - t0) / 1000, p = fx.p, arr = state === S.ARRIVING;
        // по-слабо устройство: по-малко звезди
        if (++frames < 90) { if (dt > 2.2) slow++; if (frames === 89 && slow > 40) stars.forEach((s, i) => { if (i % 2) s.visible = false; }); }
        const warp = arr ? .02 : .05 + Math.sin(Math.min(1, p) * Math.PI) * (o.first ? .9 : 1.4);
        stars.forEach(s => { if (!s.visible) return; s._z -= warp * .012 * dt * (1 + s._l * .35); if (s._z <= .03) { s._z = 1; s._a = Math.random() * 6.283; }
          const k = Math.max(W, H) * .06 / s._z, x = cx + Math.cos(s._a) * k, y = cy + Math.sin(s._a) * k; s.position.set(x, y);
          const sz = Math.min(26, (1.5 + s._l) * (1 / s._z) * .9); s.width = s.height = sz; s.alpha = Math.min(1, (1 - s._z) * 1.6) * (s._l ? .9 : .6);
          if (x < -40 || x > W + 40 || y < -40 || y > H + 40) s._z = 1; });
        dust.forEach(d => { d._y -= d._v * dt * .01 * (1 + warp * 3); if (d._y < -0.05) { d._y = 1.05; d._x = Math.random(); } d.position.set(d._x * W + Math.sin(now * .7 + d._p) * 12, d._y * H); d.width = d.height = 10 + 6 * Math.sin(now * 2 + d._p); d.alpha = .25 + .2 * Math.sin(now * 1.6 + d._p); });
        // звездата-цел: расте от далечна точка до близо (при пристигане – меко пулсира)
        const e = p * p * (3 - 2 * p), size = R * 2 * (.08 + .92 * e) * (arr ? 1 + .04 * Math.sin(now * 3) : 1);
        target.position.set(cx, cy); target.width = target.height = size; target.rotation = Math.sin(now * .6) * .06;
        halo.position.set(cx, cy); halo.width = halo.height = size * 2.6; halo.alpha = .45 + .15 * Math.sin(now * 2.4);
        if (waveT < 1) { waveT = Math.min(1, waveT + dt / 40); wave.clear().lineStyle(6 * (1 - waveT) + 1, 0xFFE08A, 1 - waveT).drawCircle(cx, cy, size * (.6 + waveT * 1.6)); } else wave.clear();
        if (zori.texture && zori.texture.height > 1) { const bob = Math.sin(now * 2.2) * 8; zori.position.set(zori._x + (arr ? 0 : Math.sin(now * 1.3) * 6), zori._y + bob); zori.rotation = -.08 + Math.sin(now * 1.1) * .04;
          // златиста следа зад Зори
          if (!arr && frames % 2 === 0) { const q = new PIXI.Sprite(radial()); q.anchor.set(.5); q.tint = 0xFFD27A; q.blendMode = PIXI.BLEND_MODES.ADD; q.position.set(zori.x - zori.width * .32, zori.y + zori.height * .28); q.width = q.height = 22; q._life = 1; trailC.addChild(q); trail.push(q); }
          for (let i = trail.length - 1; i >= 0; i--) { const q = trail[i]; q._life -= dt / 34; q.x -= dt * 1.8; q.y += dt * .9; q.alpha = Math.max(0, q._life) * .7; q.width = q.height = 8 + 18 * q._life; if (q._life <= 0) { q.destroy(); trail.splice(i, 1); } } }
      });
    } catch (e) { fail(e); }
    return api();
    function api() { return { skip, cancel, get state() { return state; }, el: root }; }
  }
  window.ObsJourney = { start, STATES: S };
})();
