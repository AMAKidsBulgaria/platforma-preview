/* „Звездният път“ – игровото преживяване на МА (вертикален срез, 13.11.2026).
   Светът (PixiJS): небе на слоеве с паралакс, звезден път, кораб с двигател от частици, запалване на звезди.
   Интерфейсът (DOM + GSAP): горна лента (серия, енергия, създания), бутонът за полет, мисията с кръговете, наградите.
   Учебната логика е същата като в платформата: примерите – от двигателя (ABACUS_ENGINE.simpleExample), параметрите – от плановете.
   Състояние: localStorage journey.v1 { lit, energy, streak, day, parts }. ?reset=1 – отначало; ?fast=1 – само за автоматичните проверки. */
(function () {
  const E = window.ABACUS_ENGINE, Q = new URLSearchParams(location.search), FAST = Q.get("fast") === "1" ? .15 : 1;
  const KEY = "journey.v1";
  if (Q.get("reset") === "1") try { localStorage.removeItem(KEY); } catch (e) {}
  const S = (() => { try { return Object.assign({ lit: 0, energy: 0, streak: 0, day: "", parts: 0 }, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return { lit: 0, energy: 0, streak: 0, day: "", parts: 0 }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const wait = (ms) => new Promise(r => setTimeout(r, ms * FAST));
  const $ = (s, r) => (r || document).querySelector(s);

  // ---- звездите на Аврора (вариант Б: Просто 0–9) ----
  const STARS = [
    { t: "Числата 0, 1, 2", topic: "s2", must: 2, act: [5, 2.0] }, { t: "Числото 3", topic: "s3", must: 3, act: [6, 2.0] },
    { t: "Числото 4", topic: "s4", must: 4, act: [6, 1.9] }, { t: "Числото 5", topic: "s5", must: 5, act: [6, 1.9] },
    { t: "Щипката · 6", topic: "s6", must: 6, act: [6, 1.9] }, { t: "Числото 7", topic: "s7", must: 7, act: [7, 1.8] },
    { t: "Числото 8", topic: "s8", must: 8, act: [7, 1.8] }, { t: "Числото 9", topic: "s9", must: 9, act: [7, 1.7] },
    { t: "Звездна нощ", topic: "s9", must: 0, act: [8, 1.6], big: true }];
  const N = STARS.length, TOPIC = (id) => E.TOPICS.find(t => t.id === id);

  // ---- звук: синтезиран (камбанка, искра, полет, запалване) ----
  let AC = null; const ac = () => { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === "suspended") AC.resume(); return AC; };
  function tone(f, t0, dur, type, vol) { const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = type || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, a.currentTime + t0); g.gain.linearRampToValueAtTime(vol || .18, a.currentTime + t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + t0 + dur);
    o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + .05); }
  function noise(t0, dur, f0, f1, vol) { const a = ac(); if (!a) return; const len = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, a.currentTime + t0); bp.frequency.exponentialRampToValueAtTime(f1, a.currentTime + t0 + dur);
    g.gain.setValueAtTime(0, a.currentTime + t0); g.gain.linearRampToValueAtTime(vol || .25, a.currentTime + t0 + dur * .3); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + t0 + dur);
    s.connect(bp).connect(g).connect(a.destination); s.start(a.currentTime + t0); }
  const SFX = {
    tap: () => tone(880, 0, .08, "triangle", .08),
    good: (combo) => { const b = 660 * Math.pow(1.06, Math.min(combo, 8)); tone(b, 0, .18, "triangle", .16); tone(b * 1.5, .07, .25, "sine", .12); },
    bad: () => { tone(300, 0, .18, "sine", .1); tone(240, .1, .22, "sine", .08); },
    whoosh: () => noise(0, .9, 300, 2400, .22),
    ignite: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .07, .6, "triangle", .13)); noise(.1, 1.2, 4000, 600, .12); },
    chime: () => { tone(1568, 0, .5, "sine", .08); tone(2093, .08, .6, "sine", .06); }
  };

  // ---- глас: записаните реплики на Зори и числата („плюс 3“) ----
  let AUD = {}, AUDZ = {}, curA = null;
  fetch("config/abacus-audio.json?v=4").then(r => r.json()).then(a => a.forEach(x => { AUD[x.t] = x.f; })).catch(() => {});
  fetch("config/abacus-audio-zori.json?v=11").then(r => r.json()).then(a => a.forEach(x => { AUDZ[x.t] = x.f; })).catch(() => {});
  function speak(t) { if (Q.get("voice") === "0") return; const f = AUDZ[t] || AUD[t]; if (!f) return; try { if (curA) curA.pause(); curA = new Audio("assets/audio/abacus/" + f); curA.play().catch(() => {}); } catch (e) {} }

  // =================== СВЕТЪТ (PixiJS) ===================
  const app = new PIXI.Application({ resizeTo: window, backgroundColor: 0x0B0E2A, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, preserveDrawingBuffer: Q.get("shot") === "1" });
  $("#world").appendChild(app.view);
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.25, "rgba(255,240,200,.75)"); r.addColorStop(.6, "rgba(255,200,90,.18)"); r.addColorStop(1, "rgba(255,200,90,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return PIXI.Texture.from(c); })();
  const dotTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 16; const g = c.getContext("2d"), r = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.5, "rgba(255,255,255,.5)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 16, 16); return PIXI.Texture.from(c); })();
  const starPts = (R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push(Math.cos(a) * rr, Math.sin(a) * rr); } return p; };

  const bg = new PIXI.Container(), layers = [new PIXI.Container(), new PIXI.Container(), new PIXI.Container()], world = new PIXI.Container(), fx = new PIXI.Container();
  const mapScene = new PIXI.Container(), homeScene = new PIXI.Container();
  mapScene.addChild(bg, ...layers, world, fx); app.stage.addChild(mapScene, homeScene); mapScene.visible = false;
  let bgSpr = null; PIXI.Assets.load("assets/img/journey/bg_space.webp").then(t => { bgSpr = new PIXI.Sprite(t); bgSpr.anchor.set(.5); bg.addChild(bgSpr); layout(); });
  // звездно поле на 3 слоя (паралакс): малки, средни, ярки с примигване
  const field = [];
  [[160, .25, .5], [80, .5, .9], [30, .8, 1.6]].forEach(([n, depth, size], li) => { for (let i = 0; i < n; i++) { const s = new PIXI.Sprite(dotTex); s.anchor.set(.5);
    s.scale.set(size * (.4 + Math.random() * .6)); s.alpha = .3 + Math.random() * .6; s._x = Math.random(); s._y = Math.random() * 3000; s._d = depth; s._tw = li === 2 ? Math.random() * 6 : -1; layers[li].addChild(s); field.push(s); } });

  // путят: звездите по лъкатушеща линия нагоре
  const GAP = 210, pos = (i) => ({ x: Math.sin(i * 1.15 + .4) * 115, y: -i * GAP });
  const pathG = new PIXI.Graphics(), litG = new PIXI.Graphics(); world.addChild(pathG, litG);
  const nodes = STARS.map((st, i) => {
    const c = new PIXI.Container(), p = pos(i); c.position.set(p.x, p.y);
    const glow = new PIXI.Sprite(glowTex); glow.anchor.set(.5); glow.tint = 0xFFC94A; c.addChild(glow);
    const ring = new PIXI.Graphics(); ring.lineStyle(3, 0xFFE9A8, .9).drawCircle(0, 0, 40); ring.visible = false; c.addChild(ring);
    const shape = new PIXI.Graphics(); c.addChild(shape);
    const fog = new PIXI.Sprite(glowTex); fog.anchor.set(.5); fog.tint = 0x7C68C9; fog.alpha = .5; fog.scale.set(1.6); c.addChild(fog);
    const lbl = new PIXI.Text(String(i === N - 1 ? "★" : i === 0 ? "0–2" : i + 2), { fontFamily: "Baloo 2, Nunito", fontSize: 22, fontWeight: "800", fill: 0x2B2140 }); lbl.anchor.set(.5); c.addChild(lbl);
    c.eventMode = "static"; c.cursor = "pointer"; c.hitArea = new PIXI.Circle(0, 0, 50); c.on("pointertap", () => starCard(i));
    world.addChild(c); return { c, glow, ring, shape, fog, lbl, big: !!st.big };
  });
  function drawNode(i) {
    const n = nodes[i], lit = i < S.lit, cur = i === S.lit, R = n.big ? 34 : 26;
    n.shape.clear(); n.shape.beginFill(lit ? 0xFFD24A : cur ? 0xF5E6B8 : 0x4B4F86, 1).lineStyle(4, lit ? 0xFFF3C4 : cur ? 0xFFFFFF : 0x6B6FA8, 1).drawPolygon(starPts(R, R * .48)).endFill();
    n.glow.visible = lit || cur; n.glow.alpha = lit ? .9 : .45; n.glow.scale.set(lit ? 1.5 : 1.1);
    n.fog.visible = i > S.lit; n.lbl.visible = lit || cur; n.lbl.style.fill = lit ? 0x5A3A00 : 0x2B2140; n.ring.visible = cur;
  }
  function drawPath() {
    pathG.clear(); litG.clear();
    for (let i = 0; i < N - 1; i++) { const a = pos(i), b = pos(i + 1), mx = (a.x + b.x) / 2 + (i % 2 ? 60 : -60), my = (a.y + b.y) / 2, lit = i + 1 <= S.lit;
      const g = lit ? litG : pathG; const steps = 22;
      for (let k = 0; k <= steps; k++) { const t = k / steps, x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x, y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y;
        if (lit) g.beginFill(0xFFD86A, .95).drawCircle(x, y, 3.2).endFill(); else if (k % 2 === 0) g.beginFill(0x8E8AD8, .55).drawCircle(x, y, 2.4).endFill(); } }
  }
  const curvePt = (i, t) => { const a = pos(i), b = pos(i + 1), mx = (a.x + b.x) / 2 + (i % 2 ? 60 : -60), my = (a.y + b.y) / 2; return { x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y }; };

  // корабът и двигателят от частици
  const ship = new PIXI.Container(); world.addChild(ship); let shipSpr = null;
  PIXI.Assets.load("assets/img/journey/ship.webp").then(t => { shipSpr = new PIXI.Sprite(t); shipSpr.anchor.set(.5); shipSpr.scale.set(.2); shipSpr.rotation = -Math.PI / 2 + .25; ship.addChild(shipSpr); });
  const parts = []; function emit(x, y, o) { o = o || {}; const s = new PIXI.Sprite(o.tex || dotTex); s.anchor.set(.5); s.position.set(x, y); s.tint = o.tint || 0xFFC060; s.blendMode = PIXI.BLEND_MODES.ADD;
    const a = o.angle != null ? o.angle + (Math.random() - .5) * (o.spread || .6) : Math.random() * Math.PI * 2, sp = (o.speed || 2) * (.5 + Math.random());
    s._vx = Math.cos(a) * sp; s._vy = Math.sin(a) * sp; s._life = s._max = (o.life || 40) * (.6 + Math.random() * .6); s._sc = o.scale || 1.4; s._g = o.gravity || 0; (o.layer || world).addChild(s); parts.push(s); }
  let shipEngine = 1, missionSpeed = 0, camY = 0, camTarget = 0, t0 = performance.now();
  app.ticker.add((dt) => {
    const t = (performance.now() - t0) / 1000, W = app.screen.width, H = app.screen.height;
    camY += (camTarget - camY) * Math.min(1, .08 * dt);
    world.position.set(W / 2, H * .42 - camY * world.scale.y);
    // паралакс + полет
    field.forEach(s => { s._y += missionSpeed * s._d * dt * 6; const y = ((s._y - camY * s._d * .6) % 3000 + 3000) % 3000; s.position.set(s._x * W, (y / 3000) * (H + 40) - 20);
      if (s._tw >= 0) s.alpha = .5 + .5 * Math.sin(t * 2 + s._tw); });
    if (bgSpr) { bgSpr.position.set(W / 2 + Math.sin(t * .05) * W * .03, H / 2 + Math.max(-H * .06, Math.min(H * .06, -camY * .01)) + Math.cos(t * .04) * H * .02); }   // леко дишане, без шев
    // кораб: леко поклащане и пламък
    if (shipSpr) { ship.children[0].y = Math.sin(t * 2.2) * 4; ship.children[0].rotation = -Math.PI / 2 + .25 + Math.sin(t * 1.6) * .04;
      if (flightMode && Math.random() < .5) { const W = app.screen.width; emit(Math.random() * W, -10, { layer: fx, angle: Math.PI / 2, spread: 0, speed: 9 + Math.random() * 8, life: 70, tint: 0xBFD8FF, scale: .6 }); }
      if (shipEngine && Math.random() < .7 * shipEngine) { const back = ship.toGlobal(new PIXI.Point(-10, 34)); const lp = fx.toLocal(back); emit(lp.x, lp.y, { layer: fx, angle: Math.PI / 2 + .25, spread: .5, speed: 1.6 + missionSpeed * 2, life: flightMode ? 34 : 26, tint: Math.random() < .5 ? 0xFFB347 : 0xFF6B3D, scale: flightMode ? 2.2 : 1.1 }); } }
    // звездите: пулс на текущата, бавно въртене на запалените
    nodes.forEach((n, i) => { if (i === S.lit) { const k = 1 + Math.sin(t * 3) * .06; n.shape.scale.set(k); n.ring.scale.set(1 + (t * .8 % 1) * .6); n.ring.alpha = 1 - (t * .8 % 1); }
      else if (i < S.lit) { n.shape.rotation = Math.sin(t * .7 + i) * .08; n.glow.alpha = .75 + Math.sin(t * 1.5 + i) * .15; } });
    // частици
    for (let i = parts.length - 1; i >= 0; i--) { const s = parts[i]; s.x += s._vx * dt; s.y += s._vy * dt; s._vy += s._g * dt; s._life -= dt; const k = s._life / s._max; s.alpha = Math.max(0, k); s.scale.set(s._sc * (.3 + k * .7));
      if (s._life <= 0) { s.destroy(); parts.splice(i, 1); } }
  });
  function layout() {
    const W = app.screen.width, H = app.screen.height, sc = Math.max(.5, Math.min(1.25, Math.min(W / 420, H / 720)));
    world.scale.set(sc); if (bgSpr) { const k = Math.max(W / 1024, H / 1536) * 1.18; bgSpr.scale.set(k); }
  }
  window.addEventListener("resize", layout);
  // корабът стои при последната запалена звезда (в началото – под първата) и гледа към следващата
  const SHX = 62, SHY = 26;
  function placeShip(lit, instant) { const p = pos(Math.min(lit, N) - 1), nx = pos(Math.min(lit, N - 1)); const tgt = { x: p.x + SHX, y: p.y + SHY };
    if (instant) ship.position.set(tgt.x, tgt.y); camTarget = nx.y + GAP * .35; return tgt; }
  // полет по пътя между звезда i и i+1
  function flyTo(i) { return new Promise(res => { SFX.whoosh(); const o = { t: 0 };
    gsap.to(o, { t: 1, duration: 1.8 * FAST, ease: "power2.inOut", onUpdate: () => { const p = curvePt(i, o.t); ship.position.set(p.x + SHX, p.y + SHY); camTarget = p.y; shipEngine = 2.2; },
      onComplete: () => { shipEngine = 1; res(); } }); }); }

  let flightMode = false;
  function enterFlight() { flightMode = true; const W = app.screen.width, H = app.screen.height, portrait = H > W;
    gsap.to(world, { alpha: 0, duration: .6 }); fx.addChild(ship); ship.position.set(portrait ? W * .5 : W * .16, portrait ? H * .86 : H * .58); ship.scale.set(.3);
    gsap.to(ship.scale, { x: portrait ? .9 : 1.1, y: portrait ? .9 : 1.1, duration: .8, ease: "back.out(1.6)" }); gsap.to("#j-zori", { opacity: 0, duration: .4 }); }
  function exitFlight() { flightMode = false; world.addChild(ship); ship.scale.set(1); gsap.to(world, { alpha: 1, duration: .6 }); gsap.to("#j-zori", { opacity: 1, duration: .4 }); }
  // =================== ИНТЕРФЕЙСЪТ (DOM + GSAP) ===================
  const ui = $("#ui");
  const today = new Date().toDateString();
  function hud() {
    ui.innerHTML = `<header class="j-top">
        <div class="j-chip j-streak" title="Дни подред"><span class="j-flame">🔥</span><b>${S.streak}</b></div>
        <div class="j-chip j-energy" title="Звездна енергия"><span class="j-gem"></span><b id="j-en">${S.energy}</b></div>
        <button class="j-chip j-home" id="j-home" title="Към обсерваторията">⌂</button><div class="j-title"><b>Аврора</b><small>${S.lit} от ${N} звезди</small></div>
        <button class="j-chip j-crea" id="j-crea" title="Звездни създания"><img src="assets/img/journey/creature_aurora.webp" alt=""><i style="--p:${Math.min(1, S.parts / N)}"></i></button>
      </header>
      <div class="j-zori" id="j-zori"><img src="assets/img/zori/z_point.png" alt="Зори"><div class="j-bub" id="j-bub"></div></div>
      <footer class="j-bottom">${S.lit < N ? `<button class="j-go" id="j-go"><span class="j-go-ic">🚀</span><span><b>Полет към звездата</b><small>${STARS[S.lit].t}</small></span></button>` : `<div class="j-done">Аврора свети! ✨</div>`}</footer>
      <div class="j-card" id="j-card" hidden></div>`;
    const go = $("#j-go"); if (go) { go.onclick = () => { SFX.tap(); mission(); }; gsap.fromTo(go, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: "back.out(1.7)", delay: .2 }); gsap.to(go, { scale: 1.04, repeat: -1, yoyo: true, duration: .9, ease: "sine.inOut", delay: .9 }); }
    $("#j-crea").onclick = album; $("#j-home").onclick = () => { SFX.tap(); goHome(); };
    gsap.from(".j-top > *", { y: -30, opacity: 0, stagger: .07, duration: .5, ease: "back.out(1.6)" });
    zori(S.lit === 0 ? "Здравей! Звездите са угаснали. Да ги запалим заедно!" : S.lit < N ? "Следващата звезда ни чака!" : "Браво! Цялата Аврора свети!", "point");
  }
  function zori(text, pose) { const z = $("#j-zori"); if (!z) return; const img = z.querySelector("img"), b = $("#j-bub"); if (pose) img.src = `assets/img/zori/z_${pose}.png`;
    b.textContent = text || ""; b.hidden = !text; gsap.fromTo(img, { scaleY: .9, scaleX: 1.08 }, { scaleY: 1, scaleX: 1, duration: .5, ease: "elastic.out(1,.4)" }); if (text) gsap.fromTo(b, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "back.out(2)" }); speak(text); }
  function starCard(i) {
    const c = $("#j-card"); if (!c) return; SFX.tap(); const st = STARS[i], lit = i < S.lit, cur = i === S.lit;
    c.innerHTML = `<b>${st.t}</b><small>${lit ? "Звездата свети ★" : cur ? "Следващата звезда" : "Още е в мъглата"}</small>`; c.hidden = false;
    gsap.fromTo(c, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }); clearTimeout(c._t); c._t = setTimeout(() => { c.hidden = true; }, 2200);
  }
  function album() {
    SFX.tap(); const k = Math.min(1, S.parts / N), m = document.createElement("div"); m.className = "j-modal";
    m.innerHTML = `<div class="j-mbox"><h2>Звездни създания</h2><div class="j-creature"><img class="sil" src="assets/img/journey/creature_aurora.webp" alt=""><img class="fill" src="assets/img/journey/creature_aurora.webp" alt="" style="clip-path: inset(${(1 - k) * 100}% 0 0 0)"></div>
      <p>${k >= 1 ? "Лисичето от Аврора се събуди! 🦊" : `Пазителят на Аврора се събужда… ${S.parts} от ${N} звезди`}</p><button class="j-btn" id="j-mx">Затвори</button></div>`;
    document.body.appendChild(m); gsap.from(m.querySelector(".j-mbox"), { scale: .7, opacity: 0, duration: .45, ease: "back.out(1.8)" }); $("#j-mx").onclick = () => m.remove();
  }
  function energyFly(fromEl, n) {   // енергия: искри летят от отговора към брояча горе
    const en = $("#j-en") || $("#j-meter"); if (!en) return; const a = fromEl.getBoundingClientRect(), b = en.getBoundingClientRect();
    for (let i = 0; i < n; i++) { const d = document.createElement("i"); d.className = "j-spark"; document.body.appendChild(d); d.style.left = a.left + a.width / 2 + "px"; d.style.top = a.top + a.height / 2 + "px";
      gsap.to(d, { left: b.left + b.width / 2, top: b.top + b.height / 2, duration: .7 + i * .05, ease: "power2.in", delay: i * .04, onComplete: () => { d.remove(); S.energy++; const e = $("#j-en"); if (e) { e.textContent = S.energy; gsap.fromTo(e, { scale: 1.5 }, { scale: 1, duration: .3 }); } } }); }
  }

  // =================== МИСИЯТА (домашното) ===================
  const ROUNDS = [{ kind: "flash", name: "Звездни сигнали", n: 5 }, { kind: "calc", name: "Звездни сметки", n: 5 }, { kind: "calc", name: "Звездни сметки – по-дълго", n: 4, longer: 1 }];
  async function mission() {
    const i = S.lit, st = STARS[i]; let combo = 0, okAll = 0, all = 0;
    gsap.to(".j-bottom, .j-top", { opacity: 0, duration: .3 }); missionSpeed = 0; enterFlight(); gsap.to({ v: 0 }, { v: 1.4, duration: 1, onUpdate: function () { missionSpeed = this.targets()[0].v; } });
    zori("Към звездата! Всеки верен отговор е енергия за кораба.", "point");
    ui.insertAdjacentHTML("beforeend", `<div class="j-mbar"><div class="j-route">${ROUNDS.map((r, k) => `<i class="${k === 0 ? "now" : ""}"></i>`).join("")}<span class="j-mship">🚀</span><span class="j-mstar">★</span></div>
      <div class="j-meter" id="j-meter"><b style="width:0%"></b><span>енергия</span></div></div><section class="j-panel" id="j-panel"></section><div class="j-combo" id="j-combo"></div>`);
    gsap.from(".j-mbar", { y: -40, opacity: 0, duration: .5 }); gsap.from("#j-panel", { y: 60, opacity: 0, duration: .5, delay: .2, ease: "back.out(1.4)" });
    const total = ROUNDS.reduce((a, r) => a + r.n, 0);
    for (let r = 0; r < ROUNDS.length; r++) {
      const R = ROUNDS[r]; $(".j-route").querySelectorAll("i").forEach((d, k) => d.className = k < r ? "done" : k === r ? "now" : "");
      gsap.to(".j-mship", { left: `${(r / ROUNDS.length) * 100}%`, duration: .8, ease: "power2.inOut" });
      await roundTitle(R.name);
      for (let q = 0; q < R.n; q++) {
        const ok = R.kind === "flash" ? await flashQ(st, q === 0) : await calcQ(st, R.longer);
        all++; if (ok) { okAll++; combo++; SFX.good(combo); if (combo >= 3) showCombo(combo); } else { combo = 0; SFX.bad(); }
        gsap.to("#j-meter b", { width: `${(okAll / total) * 100}%`, duration: .5, ease: "power2.out" });
      }
      $(".j-route").querySelectorAll("i")[r].className = "done"; SFX.chime();
    }
    gsap.to(".j-mship", { left: "100%", duration: .8, ease: "power2.inOut" });
    await wait(500); gsap.to({ v: missionSpeed }, { v: 0, duration: .8, onUpdate: function () { missionSpeed = this.targets()[0].v; } });
    $("#j-panel").remove(); $(".j-mbar").remove(); $("#j-combo").remove(); exitFlight(); placeShip(i, true);
    await ignite(i, okAll, all);
  }
  function roundTitle(t) { return new Promise(res => { const p = $("#j-panel"); p.innerHTML = `<div class="j-rt">${t}</div>`; gsap.fromTo(".j-rt", { scale: .5, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: "back.out(2)" }); setTimeout(res, 1100 * FAST); }); }
  function showCombo(c) { const el = $("#j-combo"); el.textContent = `${c} подред! ×${Math.min(3, 1 + Math.floor(c / 3))}`; gsap.fromTo(el, { scale: .4, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: 0, duration: .4, ease: "back.out(2.5)" }); gsap.to(el, { opacity: 0, duration: .4, delay: 1 }); }
  // абакус (SVG) за сигналите
  function abSvg(v) { const st = E.fromValue(v, 1)[0], BW = 120, BH = 46, X = 110, path = `M${-BW / 2} 0 L${-BW / 4} ${-BH / 2} L${BW / 4} ${-BH / 2} L${BW / 2} 0 L${BW / 4} ${BH / 2} L${-BW / 4} ${BH / 2} Z`;
    const bead = (y, on, h) => `<path transform="translate(${X} ${y})" d="${path}" fill="url(#${on ? (h ? "gh" : "ge") : "go"})" stroke="${on ? "#7A3D00" : "#3C3F70"}" stroke-width="3"/>`;
    let s = `<svg viewBox="0 0 220 440" class="j-ab"><defs><linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F29A1E"/></linearGradient><linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB0C8"/><stop offset="1" stop-color="#E3487A"/></linearGradient><linearGradient id="go" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4B4F86"/><stop offset="1" stop-color="#30335E"/></linearGradient></defs>
      <rect x="8" y="8" width="204" height="424" rx="26" fill="#1B2263" stroke="#C9A24A" stroke-width="12"/><line x1="${X}" y1="18" x2="${X}" y2="422" stroke="#8D6A3E" stroke-width="7"/><rect x="14" y="140" width="192" height="12" fill="#C9A24A"/>`;
    s += bead(st.h ? 112 : 48, !!st.h, true); for (let k = 1; k <= 4; k++) { const on = k <= st.e; s += bead(on ? 178 + (k - 1) * 48 : 398 - (4 - k) * 48, on); }
    return s + "</svg>"; }
  function choices3(v, max) { const s = new Set([v]); while (s.size < 3) s.add(Math.floor(Math.random() * (max + 1))); return [...s].sort(() => Math.random() - .5); }
  // Звездни сигнали: „Гледай!“ → абакусът за миг → „Кое число видя?“ (абакусът остава като бледа сянка); „↺ Покажи пак“ – веднъж, без звезда
  async function flashQ(st, first) {
    const t = TOPIC(st.topic), max = t.opMax >= 5 ? 9 : t.opMax, v = Math.floor(Math.random() * (max + 1)), p = $("#j-panel");
    p.innerHTML = `<div class="j-ask">Гледай абакуса!</div><div class="j-flash"><div class="j-abw">${abSvg(0)}</div></div>`;
    const show = async () => { const w = p.querySelector(".j-abw"); w.innerHTML = abSvg(v); w.style.opacity = 1; gsap.fromTo(w, { scale: .85 }, { scale: 1, duration: .25, ease: "back.out(2)" });
      await wait(first ? 2200 : 1700); gsap.to(w, { opacity: .18, duration: .25 }); };
    await wait(700); await show();
    p.querySelector(".j-ask").textContent = "Кое число видя?"; speak("Кое число видя?");
    const opts = choices3(v, max); p.insertAdjacentHTML("beforeend", `<div class="j-opts">${opts.map(o => `<button data-v="${o}">${o}</button>`).join("")}</div><button class="j-again" id="j-again">↺ Покажи пак</button>`);
    gsap.from(".j-opts button", { y: 30, opacity: 0, stagger: .06, duration: .3, ease: "back.out(2)" }); if (Q.get("fast") === "1") window.J_T = { v };
    let again = false; $("#j-again").onclick = async () => { if (again) return; again = true; $("#j-again").disabled = true; await show(); };
    const pick = await new Promise(res => p.querySelectorAll(".j-opts button").forEach(b => b.onclick = () => res(b)));
    const ok = +pick.dataset.v === v && !again; p.querySelectorAll(".j-opts button").forEach(b => { b.disabled = true; if (+b.dataset.v === v) b.classList.add("ok"); }); $("#j-again").hidden = true;
    gsap.to(".j-abw", { opacity: 1, duration: .3 });
    if (+pick.dataset.v === v) { if (ok) energyFly(pick, 3); gsap.fromTo(pick, { scale: 1.25 }, { scale: 1, duration: .4, ease: "elastic.out(1,.4)" }); p.querySelector(".j-ask").textContent = ok ? `Точно така – ${v}!` : `Да – ${v}!`; }
    else { pick.classList.add("no"); gsap.fromTo(pick, { x: -10 }, { x: 0, duration: .4, ease: "elastic.out(1,.3)" }); p.querySelector(".j-ask").textContent = `Беше ${v}.`; }
    await wait(+pick.dataset.v === v ? 1000 : 1800); return ok;
  }
  async function calcQ(st, longer) {
    const t = TOPIC(st.topic), cnt = st.act[0] + (longer ? 2 : 0), ex = E.simpleExample({ ...t, count: cnt, must: st.must && Math.random() < .5 ? Math.min(st.must, t.opMax) : 0 }) || E.simpleExample({ ...t, count: cnt });
    const p = $("#j-panel"); p.innerHTML = `<div class="j-calc"><div class="j-num" id="j-num"></div><div class="j-hint">Смятай на абакуса!</div></div>`;
    const el = $("#j-num"); if (Q.get("fast") === "1") window.J_T = { v: ex.answer };
    for (const n of ex.nums) { el.textContent = (n > 0 ? "+" : "−") + Math.abs(n); el.className = "j-num " + (n > 0 ? "plus" : "minus"); speak(`${n > 0 ? "плюс" : "минус"} ${Math.abs(n)}`);
      gsap.fromTo(el, { scale: .4, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: .28, ease: "back.out(2.5)" }); await wait(st.act[1] * 1000 - 250); gsap.to(el, { opacity: 0, scale: .8, duration: .15 }); await wait(250); }
    el.textContent = "= ?"; el.className = "j-num ask"; gsap.fromTo(el, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .3 });
    p.insertAdjacentHTML("beforeend", `<div class="j-kp"><div class="j-kv" id="j-kv"> </div>${[1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "✓"].map(d => `<button data-d="${d}">${d}</button>`).join("")}</div>`);
    gsap.from(".j-kp button", { scale: .6, opacity: 0, stagger: .02, duration: .25, ease: "back.out(2)" });
    let v = ""; const kv = $("#j-kv");
    const ans = await new Promise(res => p.querySelectorAll(".j-kp button").forEach(b => b.onclick = () => { const d = b.dataset.d; SFX.tap(); gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .2 });
      if (d === "⌫") v = v.slice(0, -1); else if (d === "✓") { if (v !== "") res(+v); return; } else if (v.length < 2) v += d; kv.textContent = v || " "; }));
    const ok = ans === ex.answer; el.textContent = "= " + ex.answer; el.className = "j-num " + (ok ? "good" : "ask");
    if (ok) { energyFly(el, 4); gsap.fromTo(el, { scale: 1.3 }, { scale: 1, duration: .5, ease: "elastic.out(1,.4)" }); } else { kv.classList.add("no"); gsap.fromTo(".j-kp", { x: -10 }, { x: 0, duration: .5, ease: "elastic.out(1,.3)" }); }
    await wait(ok ? 1000 : 1800); return ok;
  }

  // =================== ЗАПАЛВАНЕТО ===================
  async function ignite(i, ok, all) {
    await flyTo(i - 1);   // корабът лети от предишната звезда (или от старта) до звездата на мисията
    const target = nodes[i], tp = pos(i); camTarget = tp.y; ship.position.set(tp.x + SHX, tp.y + SHY);
    await wait(300); SFX.ignite();
    const ring = new PIXI.Sprite(glowTex); ring.anchor.set(.5); ring.position.set(tp.x, tp.y); ring.tint = 0xFFE08A; ring.blendMode = PIXI.BLEND_MODES.ADD; world.addChild(ring);
    gsap.fromTo(ring.scale, { x: .2, y: .2 }, { x: 7, y: 7, duration: 1.1 * FAST, ease: "power2.out" }); gsap.to(ring, { alpha: 0, duration: 1.1 * FAST, onComplete: () => ring.destroy() });
    for (let k = 0; k < 70; k++) emit(tp.x, tp.y, { speed: 3 + Math.random() * 4, life: 60, tint: [0xFFE08A, 0xFFB347, 0xFFFFFF, 0x8FC7FF][k % 4], scale: 1.6, gravity: .02 });
    S.lit = Math.max(S.lit, i + 1); S.parts = Math.min(N, S.parts + 1);
    if (S.day !== today) { const y = new Date(Date.now() - 864e5).toDateString(); S.streak = S.day === y ? S.streak + 1 : 1; S.day = today; }
    save(); drawPath(); nodes.forEach((_, k) => drawNode(k));
    gsap.fromTo(target.c.scale, { x: .4, y: .4 }, { x: 1, y: 1, duration: 1 * FAST, ease: "elastic.out(1,.35)" });
    await wait(1200);
    reward(i, ok, all);
  }
  function reward(i, ok, all) {
    const k = Math.min(1, S.parts / N), prev = Math.max(0, (S.parts - 1) / N), stars = ok / all >= .9 ? 3 : ok / all >= .6 ? 2 : 1, m = document.createElement("div"); m.className = "j-modal";
    m.innerHTML = `<div class="j-mbox j-rew"><div class="j-rays"></div><h2>Звездата свети!</h2><p class="j-st">${STARS[i].t}</p>
      <div class="j-stars">${[0, 1, 2].map(x => `<span class="${x < stars ? "on" : ""}">★</span>`).join("")}</div>
      <div class="j-creature small"><img class="sil" src="assets/img/journey/creature_aurora.webp" alt=""><img class="fill" id="j-fill" src="assets/img/journey/creature_aurora.webp" alt="" style="clip-path: inset(${(1 - prev) * 100}% 0 0 0)"></div>
      <p>${k >= 1 ? "Пазителят на Аврора се събуди! 🦊" : "Пазителят на Аврора се събужда…"}</p>
      <div class="j-gain"><span class="j-gem"></span>+${ok * 3 + Math.round(ok * .5)} енергия · ${ok} от ${all} верни</div>
      <button class="j-btn j-big" id="j-next">Към картата</button></div>`;
    document.body.appendChild(m);
    const tl = gsap.timeline(); tl.from(m.querySelector(".j-mbox"), { scale: .5, opacity: 0, duration: .5, ease: "back.out(1.8)" })
      .from(m.querySelectorAll(".j-stars span"), { scale: 0, rotation: -90, stagger: .18, duration: .45, ease: "back.out(3)", onStart: () => SFX.chime() })
      .to("#j-fill", { clipPath: `inset(${(1 - k) * 100}% 0 0 0)`, duration: 1.2, ease: "power2.inOut" }, "+=.1")
      .from(m.querySelector("#j-next"), { y: 30, opacity: 0, duration: .4, ease: "back.out(2)" });
    zori("Браво! Запалихме звезда!", "joy");
    $("#j-next").textContent = "Към обсерваторията"; $("#j-next").onclick = () => { m.remove(); goHome(true); };
  }


  // =================== ОБСЕРВАТОРИЯТА (началният екран, „домът“) ===================
  // Стаята е картина 1536×1024 с изрязан прозорец (x 400–1145, y 0–635); зад нея – живото небе със звездите на детето, падащи звезди и корабът.
  // Предметите в стаята са менюто: телескопът → „Продължи“ (полет), картата на масата → пътят, планетата → игрите, лисичето → създанията.
  const RW = 1536, RH = 1024, WIN = { x: 772, y: 318, r: 380 };
  const room = new PIXI.Container(), sky = new PIXI.Container(); homeScene.addChild(sky, room);
  let roomSpr = null, teleSpr = null, foxSpr = null, planetSpr = null, homeShip = null, zoriSpr = null;
  const skyBg = new PIXI.Sprite(); skyBg.anchor.set(.5); sky.addChild(skyBg);
  PIXI.Assets.load("assets/img/journey/bg_space.webp").then(t => { skyBg.texture = t; homeLayout(); });
  const skyStars = []; for (let i = 0; i < 140; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * WIN.r, d = new PIXI.Sprite(dotTex); d.anchor.set(.5);
    d.position.set(WIN.x + Math.cos(a) * r, WIN.y + Math.sin(a) * r); d.scale.set(.4 + Math.random() * .9); d._tw = Math.random() * 6; d.alpha = .6; sky.addChild(d); skyStars.push(d); }
  // звездите на детето в прозореца: малката Аврора – запалените светят, следващата пулсира
  const MINI = STARS.map((_, i) => ({ x: WIN.x - 230 + i * 58, y: WIN.y + 40 - Math.sin(i * .9) * 90 - i * 6 }));
  const miniG = new PIXI.Graphics(); sky.addChild(miniG); const miniGlow = MINI.map(p => { const g = new PIXI.Sprite(glowTex); g.anchor.set(.5); g.position.set(p.x, p.y); g.tint = 0xFFC94A; g.blendMode = PIXI.BLEND_MODES.ADD; sky.addChild(g); return g; });
  function drawMini() { miniG.clear();
    for (let i = 0; i < N - 1; i++) if (i + 1 < S.lit) miniG.lineStyle(3, 0xFFD86A, .7).moveTo(MINI[i].x, MINI[i].y).lineTo(MINI[i + 1].x, MINI[i + 1].y);
    MINI.forEach((p, i) => { const lit = i < S.lit, cur = i === S.lit; miniG.lineStyle(0); miniG.beginFill(lit ? 0xFFE08A : cur ? 0xFFFFFF : 0x6B6FA8, lit || cur ? 1 : .5).drawPolygon(starPts(lit ? 14 : 10, lit ? 6 : 4.5).map((v, k) => v + (k % 2 ? p.y : p.x))).endFill();
      miniGlow[i].visible = lit || cur; miniGlow[i].scale.set(lit ? .7 : .45); }); }
  const shoot = new PIXI.Graphics(); sky.addChild(shoot); let shootT = 3;
  PIXI.Assets.load("assets/img/journey/ship.webp").then(t => { homeShip = new PIXI.Sprite(t); homeShip.anchor.set(.5); homeShip.scale.set(.32); homeShip.position.set(WIN.x + 230, WIN.y - 150); homeShip.rotation = -.35; sky.addChild(homeShip); });
  PIXI.Assets.load("assets/img/journey/room.webp").then(t => { roomSpr = new PIXI.Sprite(t); room.addChildAt(roomSpr, 0); homeLayout(); });
  const lamps = [[268, 201, 1.4], [85, 623, 1.1], [1191, 495, 1.3]].map(([x, y, k]) => { const g = new PIXI.Sprite(glowTex); g.anchor.set(.5); g.position.set(x, y); g.tint = 0xFFB347; g.blendMode = PIXI.BLEND_MODES.ADD; g._k = k; room.addChild(g); return g; });
  const motes = []; for (let i = 0; i < 40; i++) { const m = new PIXI.Sprite(dotTex); m.anchor.set(.5); m.tint = 0xFFD9A0; m.alpha = .35; m.scale.set(.3 + Math.random() * .5); m.position.set(Math.random() * RW, 200 + Math.random() * 700); m._v = .1 + Math.random() * .25; m._p = Math.random() * 6; room.addChild(m); motes.push(m); }
  PIXI.Assets.load("assets/img/journey/creature_aurora.webp").then(t => { foxSpr = new PIXI.Sprite(t); foxSpr.anchor.set(.5, 1); foxSpr.position.set(905, 700); foxSpr.scale.set(.25); room.addChild(foxSpr); homeLayout(); });
  PIXI.Assets.load("assets/img/journey/planet_games.webp").then(t => { planetSpr = new PIXI.Sprite(t); planetSpr.anchor.set(.5); planetSpr.position.set(1340, 150); planetSpr.scale.set(.42); room.addChild(planetSpr); homeLayout(); });
  PIXI.Assets.load("assets/img/journey/telescope.webp").then(t => { teleSpr = new PIXI.Sprite(t); teleSpr.anchor.set(.42, 1); teleSpr.position.set(300, 800); teleSpr.scale.set(.82); room.addChild(teleSpr); homeLayout(); });
  PIXI.Assets.load("assets/img/zori/z_explain.png").then(t => { zoriSpr = new PIXI.Sprite(t); zoriSpr.anchor.set(.5, 1); zoriSpr.position.set(600, 1010); zoriSpr.scale.set(380 / t.height); room.addChild(zoriSpr); homeLayout(); });
  window.addEventListener("orientationchange", () => setTimeout(homeLayout, 300));
  let homeSc = 1, homeOff = { x: 0, y: 0 }, portraitHome = false;
  function homeLayout() {
    const W = app.screen.width, H = app.screen.height; portraitHome = H > W * 1.05;
    homeSc = portraitHome ? H / RH : Math.max(W / RW, H / RH);
    const ox = portraitHome ? W / 2 - WIN.x * homeSc : (W - RW * homeSc) / 2, oy = portraitHome ? H - RH * homeSc : -(RH * homeSc - H) * .8;   // хоризонтално: режем повече от пода, не от прозореца
    homeOff = { x: ox, y: oy }; homeScene.scale.set(homeSc); homeScene.position.set(ox, oy);
    if (skyBg.texture && skyBg.texture.width > 1) { skyBg.position.set(WIN.x, WIN.y); skyBg.scale.set((WIN.r * 2.3) / Math.min(skyBg.texture.width, skyBg.texture.height)); }
    // вертикален телефон: телескопът и масата не влизат в кадъра – поставяме телескопа в долния ляв ъгъл на екрана, планетата горе вдясно
    if (teleSpr) teleSpr.position.set(portraitHome ? (W * .2 - ox) / homeSc : 300, portraitHome ? (H - oy) / homeSc - 10 : 800);
    if (teleSpr) teleSpr.scale.set(portraitHome ? .62 : .82);
    if (planetSpr) planetSpr.position.set(portraitHome ? (W * .82 - ox) / homeSc : 1340, portraitHome ? (H * .2 - oy) / homeSc : Math.max(150, (-oy + 95) / homeSc + 80));
    if (zoriSpr) { zoriSpr.position.set(portraitHome ? (W * .66 - ox) / homeSc : 600, portraitHome ? 1010 : Math.min(1010, (H - oy) / homeSc + 20)); zoriSpr.scale.set((portraitHome ? 270 : 380) / zoriSpr.texture.height); }
    if (homeShip) { homeShip.x = WIN.x + (portraitHome ? 150 : 230); homeShip._y = WIN.y + (portraitHome ? 120 : -150); }
    if (foxSpr) { foxSpr.visible = S.parts > 0; foxSpr.alpha = .35 + .65 * Math.min(1, S.parts / N); }
    placeHotspots();
  }
  const toScreen = (x, y) => ({ x: homeOff.x + x * homeSc, y: homeOff.y + y * homeSc });
  function placeHotspots() { const topY = (-homeOff.y + 120) / homeSc, hs = { tele: teleSpr && [teleSpr.x + 60, Math.max(topY, teleSpr.y - 640 * teleSpr.scale.y)], map: [1180, 600], games: planetSpr && [planetSpr.x, planetSpr.y + (portraitHome ? 90 : -100)], fox: foxSpr && foxSpr.visible && [foxSpr.x, foxSpr.y - 160] };
    Object.entries(hs).forEach(([k, p]) => { const el = $(`#h-${k}`); if (!el) return; if (!p) { el.hidden = true; return; } el.hidden = false; const q = toScreen(p[0], p[1]); el.style.left = q.x + "px"; el.style.top = q.y + "px"; });
    if (portraitHome) { const m = $("#h-map"); if (m) m.hidden = true; } }
  window.addEventListener("resize", () => { if (homeScene.visible) homeLayout(); });
  app.ticker.add((dt) => { if (!homeScene.visible) return; const t = (performance.now() - t0) / 1000;
    skyStars.forEach(d => { d.alpha = .35 + .45 * (.5 + .5 * Math.sin(t * 1.6 + d._tw)); });
    lamps.forEach((g, i) => { const f = .55 + .12 * Math.sin(t * 9 + i * 2) + .08 * Math.sin(t * 23 + i); g.alpha = f; g.scale.set(g._k * (1 + .04 * Math.sin(t * 5 + i))); });
    motes.forEach(m => { m.y -= m._v * dt; m.x += Math.sin(t * .6 + m._p) * .2; m.alpha = .2 + .25 * (.5 + .5 * Math.sin(t * 1.3 + m._p)); if (m.y < 150) { m.y = 900; m.x = Math.random() * RW; } });
    MINI.forEach((p, i) => { if (i === S.lit) miniGlow[i].scale.set(.45 + .18 * (.5 + .5 * Math.sin(t * 3))); });
    if (homeShip) { homeShip.y = (homeShip._y || WIN.y - 150) + Math.sin(t * 1.4) * 10; homeShip.rotation = -.35 + Math.sin(t * 1.1) * .05; if (Math.random() < .4) emit(homeShip.x - 46 * Math.cos(.35) * .3 - 20, homeShip.y + 40, { layer: sky, angle: Math.PI * .62, spread: .4, speed: 1.2, life: 24, tint: Math.random() < .5 ? 0xFFB347 : 0xFF6B3D, scale: .9 }); }
    if (teleSpr && !teleSpr._busy) teleSpr.rotation = Math.sin(t * .5) * .012;
    if (zoriSpr) { const b = Math.sin(t * 2.2); zoriSpr.scale.y = zoriSpr.scale.x * (1 + b * .015); zoriSpr.skew.x = Math.sin(t * 1.1) * .015; }
    if (foxSpr && foxSpr.visible) foxSpr.y = 700 + Math.abs(Math.sin(t * 1.2)) * -4;
    if (planetSpr) { planetSpr.rotation = Math.sin(t * .4) * .08; planetSpr.y += Math.sin(t * 1.5) * .15; }
    // падаща звезда в прозореца
    shootT -= dt / 60; shoot.clear(); if (shootT < 0) { if (shootT < -1) shootT = 4 + Math.random() * 5; const k = -shootT, x = WIN.x + 260 - k * 420, y = WIN.y - 260 + k * 200;
      shoot.lineStyle(3, 0xFFFFFF, 1 - k).moveTo(x, y).lineTo(x + 70, y - 34); }
  });
  function homeHud(celebrate) {
    const nx = S.lit < N ? STARS[S.lit].t : "Аврора свети!";
    ui.innerHTML = `<header class="j-top"><div class="j-chip j-streak"><span class="j-flame">🔥</span><b>${S.streak}</b></div><div class="j-chip j-energy"><span class="j-gem"></span><b id="j-en">${S.energy}</b></div>
        <div class="j-title"><b>Звездна обсерватория</b><small>${S.lit} от ${N} звезди светят</small></div></header>
      <button class="j-hot j-hot-big" id="h-tele"><b>▶ Продължи</b><small>${nx}</small></button>
      <button class="j-hot" id="h-map"><b>Звездна карта</b></button><button class="j-hot" id="h-games"><b>Игри</b></button><button class="j-hot" id="h-fox"><b>Създания</b></button>
      <div class="j-bub j-hbub" id="j-bub"></div><div class="j-lens" id="j-lens"></div>`;
    $("#h-tele").onclick = () => throughTelescope(true); $("#h-map").onclick = () => throughTelescope(false); $("#h-fox").onclick = album; $("#h-games").onclick = () => { SFX.tap(); gsap.fromTo(planetSpr.scale, { x: .5, y: .5 }, { x: .42, y: .42, duration: .5, ease: "elastic.out(1,.4)" }); toast("Игрите идват скоро тук ✨"); };
    gsap.from(".j-hot", { scale: .6, opacity: 0, stagger: .08, duration: .45, ease: "back.out(2)", delay: .3 }); gsap.to("#h-tele", { scale: 1.06, repeat: -1, yoyo: true, duration: .9, ease: "sine.inOut", delay: 1 });
    gsap.from(".j-top > *", { y: -30, opacity: 0, stagger: .07, duration: .5, ease: "back.out(1.6)" });
    const line = celebrate ? "Виж! Новата звезда свети в небето!" : S.lit === 0 ? "Здравей! Звездите са угаснали. Погледни през телескопа!" : "Здравей! Да продължим към следващата звезда?";
    const b = $("#j-bub"); b.textContent = line; gsap.fromTo(b, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: "back.out(2)", delay: .5 }); speak(line);
    if (zoriSpr) { PIXI.Assets.load(`assets/img/zori/z_${celebrate ? "joy" : "explain"}.png`).then(t => { zoriSpr.texture = t; homeLayout(); }); }
    homeLayout();
  }
  function toast(t) { const d = document.createElement("div"); d.className = "j-toast"; d.textContent = t; document.body.appendChild(d); gsap.fromTo(d, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }); setTimeout(() => d.remove(), 1800); }
  // „през телескопа“: телескопът се накланя, кръгла леща расте до цял екран → небето (пътят); go = веднага мисия
  function throughTelescope(go) {
    SFX.tap(); SFX.whoosh(); const lens = $("#j-lens"), from = toScreen(teleSpr ? teleSpr.x + 120 : WIN.x, teleSpr ? teleSpr.y - 640 * teleSpr.scale.y : WIN.y);
    if (teleSpr) { teleSpr._busy = 1; gsap.to(teleSpr, { rotation: .08, duration: .35, yoyo: true, repeat: 1 }); }
    lens.style.left = from.x + "px"; lens.style.top = from.y + "px";
    gsap.fromTo(lens, { width: 10, height: 10, opacity: 1 }, { width: Math.hypot(app.screen.width, app.screen.height) * 2.2, height: Math.hypot(app.screen.width, app.screen.height) * 2.2, duration: .9 * FAST, ease: "power2.in", onComplete: () => {
      homeScene.visible = false; mapScene.visible = true; if (teleSpr) teleSpr._busy = 0; layout(); placeShip(S.lit, true); camY = camTarget; hud();
      const l2 = document.createElement("div"); l2.className = "j-lensout"; document.body.appendChild(l2); gsap.to(l2, { opacity: 0, duration: .7 * FAST, onComplete: () => l2.remove() });
      if (go && S.lit < N) setTimeout(() => { SFX.tap(); mission(); }, 900 * FAST); } });
  }
  function goHome(celebrate) {
    mapScene.visible = false; homeScene.visible = true; drawMini(); homeHud(celebrate);
    if (celebrate && S.lit > 0) { const p = MINI[S.lit - 1]; for (let k = 0; k < 40; k++) emit(p.x, p.y, { layer: sky, speed: 2 + Math.random() * 3, life: 50, tint: [0xFFE08A, 0xFFFFFF, 0x8FC7FF][k % 3], scale: 1.2 });
      gsap.fromTo(miniGlow[S.lit - 1].scale, { x: 2.5, y: 2.5 }, { x: .7, y: .7, duration: 1.4, ease: "power2.out" }); SFX.ignite(); }
  }

  // ---- старт ----
  drawPath(); nodes.forEach((_, i) => drawNode(i)); placeShip(S.lit, true); camY = camTarget; layout(); goHome(false);
  window.JOURNEY = { S, app, mission, ignite, reward, album, goHome, throughTelescope };   // за автоматичните проверки
})();
