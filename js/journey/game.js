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
  // Говоренето управлява устата на Зори: събитие „zori-talk“ (true, докато звучи репликата). Телефоните не пускат звук преди първото докосване –
  // тогава репликата чака и тръгва при първото докосване; изчакваме и индексите, за да не се губи поздравът при отваряне.
  let AUD = {}, AUDZ = {}, curA = null, pendingA = null;
  const audReady = Promise.all([
    fetch("config/abacus-audio.json?v=4").then(r => r.json()).then(a => a.forEach(x => { AUD[x.t] = x.f; })).catch(() => {}),
    fetch("config/abacus-audio-zori.json?v=13").then(r => r.json()).then(a => a.forEach(x => { AUDZ[x.t] = x.f; })).catch(() => {})]);
  const talk = (on, a) => { if (a === curA) window.dispatchEvent(new CustomEvent("zori-talk", { detail: { on, f: a._f } })); };
  function speak(t) { if (Q.get("voice") === "0") return; audReady.then(() => { const f = AUDZ[t] || AUD[t]; if (!f) return;
    try { if (curA) { curA.pause(); talk(false, curA); } const a = curA = new Audio("assets/audio/abacus/" + f); a._f = f.replace(/\.mp3$/, ""); pendingA = null;
      a.addEventListener("playing", () => talk(true, a)); a.addEventListener("pause", () => talk(false, a)); a.addEventListener("ended", () => talk(false, a));
      a.play().catch(() => { pendingA = a; }); } catch (e) {} }); }
  document.addEventListener("pointerdown", () => { const a = pendingA; pendingA = null; if (a && a === curA) a.play().catch(() => {}); }, true);

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
    p.innerHTML = `<div class="j-ask">Гледай абакуса!</div><div class="j-flash"><div class="j-abw">${abSvg(0)}</div></div>`; speak("Гледай абакуса!");
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
  // Детето не влиза в „приложение със задачи“, а в своята обсерватория, откъдето изследва Вселената; математиката е инструментът.
  // Стаята е ЕДНА картина (хоризонтална 1536×1024 или вертикална 1024×1536 за телефон); навигацията са нарисуваните предмети, всеки по веднъж:
  //   звездната карта → пътят с мисиите (главният вход: свети най-силно, Зори насочва към нея; картата се „разгръща“ на цял екран),
  //   телескопът → игри и предизвикателства (поглед през лещата: небесни обекти, всеки е игра), абакусът на бюрото → свободният тренажор
  //   (камерата приближава бюрото), лисичето на възглавницата → създанията. Сандъкът е само част от стаята.
  // Надписите не стоят постоянно: при първите посещения, в обиколката със Зори и при подсказка (иначе предметите само леко светят).
  // При докосване „изрязано“ копие на същата област подскача (с меки ръбове) и светва.
  // В прозореца (маска по рамката) – звездите на детето, трептящи звезди, падащи звезди и корабът. Фенерите трептят и пламват при докосване.
  const ROOMS = {
    land: { url: "assets/img/journey/room_land.webp?v=3", w: 1536, h: 1024, win: { x: 779, y: 327, r: 246 }, zori: { x: 787, y: 944, h: 281 }, fox: { x: 885, y: 619, h: 102 },
      box: { tele: [187, 281, 477, 880], map: [437, 445, 630, 800], abac: [1084, 562, 1233, 664], games: [1047, 732, 1339, 971], fox: [808, 553, 963, 645] },
      lamps: [[179, 583, .94], [1352, 232, .85], [1060, 563, .68]] },
    port: { url: "assets/img/journey/room_port.webp", w: 1024, h: 1536, win: { x: 510, y: 325, r: 240 }, zori: { x: 500, y: 1430, h: 380 }, fox: { x: 534, y: 712, h: 110 },
      box: { tele: [50, 470, 385, 1235], map: [255, 625, 495, 1015], abac: [695, 690, 872, 822], games: [655, 955, 955, 1250], fox: [455, 640, 612, 750] },
      lamps: [[60, 270, 1], [985, 410, .9], [643, 735, .8]] } };
  let RM = ROOMS.land, roomKey = "";
  const backdrop = new PIXI.Graphics(); backdrop.beginFill(0x160F0A).drawRect(-6000, -6000, 12000, 12000).endFill(); homeScene.addChild(backdrop);
  const sky = new PIXI.Container(), room = new PIXI.Container(); homeScene.addChild(room); room.sortableChildren = true;
  const roomSpr = new PIXI.Sprite(); roomSpr.zIndex = 0; room.addChild(roomSpr);
  const ROOMTEX = {}; Object.entries(ROOMS).forEach(([k, r]) => PIXI.Assets.load(r.url).then(t => { ROOMTEX[k] = t; roomKey = ""; homeLayout(); }));
  // мекият преход по краищата на картината към фона (когато екранът е по-широк/по-висок от нея)
  const fadeTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 4; const g = c.getContext("2d"), r = g.createLinearGradient(0, 0, 64, 0);
    r.addColorStop(0, "rgba(22,15,10,1)"); r.addColorStop(1, "rgba(22,15,10,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 4); return PIXI.Texture.from(c); })();
  const fades = [0, 1, 2].map(() => { const s = new PIXI.Sprite(fadeTex); s.zIndex = 9; room.addChild(s); return s; });
  // небето в прозореца (над картината, с маска по стъклото)
  sky.zIndex = 1; room.addChild(sky); const skyMask = new PIXI.Graphics(); room.addChild(skyMask); sky.mask = skyMask;
  const skyStars = []; for (let i = 0; i < 70; i++) { const d = new PIXI.Sprite(dotTex); d.anchor.set(.5); d._a = Math.random() * Math.PI * 2; d._r = Math.sqrt(Math.random()); d.scale.set(.3 + Math.random() * .7); d._tw = Math.random() * 6; d.blendMode = PIXI.BLEND_MODES.ADD; sky.addChild(d); skyStars.push(d); }
  // звездите на детето в прозореца: малката Аврора – запалените светят, следващата пулсира
  let MINI = [];
  const miniG = new PIXI.Graphics(); sky.addChild(miniG); const miniGlow = STARS.map(() => { const g = new PIXI.Sprite(glowTex); g.anchor.set(.5); g.tint = 0xFFC94A; g.blendMode = PIXI.BLEND_MODES.ADD; sky.addChild(g); return g; });
  function drawMini() { const W0 = RM.win, k = W0.r / 380; MINI = STARS.map((_, i) => ({ x: W0.x + (-230 + i * 58) * k, y: W0.y + (40 - Math.sin(i * .9) * 90 - i * 6) * k }));
    miniG.clear(); miniGlow.forEach((g, i) => g.position.set(MINI[i].x, MINI[i].y));
    for (let i = 0; i < N - 1; i++) if (i + 1 < S.lit) miniG.lineStyle(3, 0xFFD86A, .7).moveTo(MINI[i].x, MINI[i].y).lineTo(MINI[i + 1].x, MINI[i + 1].y);
    MINI.forEach((p, i) => { const lit = i < S.lit, cur = i === S.lit; miniG.lineStyle(0); miniG.beginFill(lit ? 0xFFE08A : cur ? 0xFFFFFF : 0x8F93C8, lit || cur ? 1 : .55).drawPolygon(starPts(lit ? 14 : 10, lit ? 6 : 4.5).map((v, k2) => v + (k2 % 2 ? p.y : p.x))).endFill();
      miniGlow[i].visible = lit || cur; miniGlow[i].scale.set(lit ? .7 : .45); }); }
  const shoot = new PIXI.Graphics(); sky.addChild(shoot); let shootT = 3, homeShip = null;
  PIXI.Assets.load("assets/img/journey/ship.webp").then(t => { homeShip = new PIXI.Sprite(t); homeShip.anchor.set(.5); homeShip.scale.set(.22); homeShip.rotation = -.35; sky.addChild(homeShip); homeLayout(); });
  // докосване на прозореца – падаща звезда
  const winHit = new PIXI.Container(); winHit.eventMode = "static"; winHit.zIndex = 2; room.addChild(winHit); winHit.on("pointertap", () => { shootT = 0; SFX.chime(); });
  // фенерите: трептене + пламване при докосване
  const lamps = [0, 1, 2].map(() => { const g = new PIXI.Sprite(glowTex); g.anchor.set(.5); g.tint = 0xFFB347; g.blendMode = PIXI.BLEND_MODES.ADD; g._f = 0; g.zIndex = 3; room.addChild(g);
    const h = new PIXI.Container(); h.eventMode = "static"; h.zIndex = 3; h.on("pointertap", () => { tone(880, 0, .25, "sine", .06); gsap.fromTo(g, { _f: 1 }, { _f: 0, duration: 1.2, ease: "power2.out" }); }); room.addChild(h); g._hit = h; return g; });
  const motes = []; for (let i = 0; i < 34; i++) { const m = new PIXI.Sprite(dotTex); m.anchor.set(.5); m.tint = 0xFFD9A0; m.alpha = .3; m.scale.set(.3 + Math.random() * .5); m._v = .1 + Math.random() * .25; m._p = Math.random() * 6; m.zIndex = 8; room.addChild(m); motes.push(m); }
  // предметите-бутони: меко „изрязано“ копие на областта от картината (подскача при докосване) + светлина + невидима зона за докосване
  const featherTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 40, 64, 64, 64);
    r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return PIXI.Texture.from(c); })();
  const PROPS = {}; ["tele", "map", "abac", "fox"].forEach(k => { const p = PROPS[k] = { k, lift: new PIXI.Container(), pic: new PIXI.Sprite(), mask: new PIXI.Sprite(featherTex), glow: new PIXI.Sprite(glowTex), hit: new PIXI.Container() };
    p.lift.addChild(p.pic, p.mask); p.pic.mask = p.mask; p.lift.zIndex = 4; p.lift.visible = false;
    p.glow.anchor.set(.5); p.glow.tint = 0xFFD27A; p.glow.blendMode = PIXI.BLEND_MODES.ADD; p.glow.zIndex = 4; p.glow.alpha = 0;
    p.hit.eventMode = "static"; p.hit.cursor = "pointer"; p.hit.zIndex = 7; p.hit.on("pointertap", () => go(k));
    room.addChild(p.glow, p.lift, p.hit); });
  let foxSpr = null, zoriSpr = null;
  PIXI.Assets.load("assets/img/journey/creature_aurora.webp").then(t => { foxSpr = new PIXI.Sprite(t); foxSpr.anchor.set(.5, 1); foxSpr.zIndex = 5; foxSpr.eventMode = "static"; foxSpr.cursor = "pointer"; foxSpr.on("pointertap", () => go("fox")); room.addChild(foxSpr); homeLayout(); });
  PIXI.Assets.load("assets/img/zori/z_calm.png").then(t => { zoriSpr = new PIXI.Sprite(t); zoriSpr.anchor.set(.5, 1); zoriSpr.zIndex = 6; zoriSpr.visible = !zvReady; room.addChild(zoriSpr); homeLayout(); });
  // меките сенки под Зори (стъпва на пода, не „плува“)
  const zShadow = new PIXI.Sprite(glowTex); zShadow.anchor.set(.5); zShadow.tint = 0x000000; zShadow.alpha = .55; zShadow.zIndex = 5; room.addChild(zShadow);

  // жив Зори: прозрачни видеа (fal.ai Kling) над платното – HEVC с алфа за WebKit (Safari, всички браузъри на iPhone), VP9 с алфа за Chrome/Android
  // (Chrome понякога приема HEVC, но без алфа – черен правоъгълник). Устата е затворена в покой; за всяка постоянна реплика има клип,
  // в който устата е синхронизирана с думите (Kling LipSync) – пуска се в мига, в който тръгне звукът, и свършва с него. Ако видеото не тръгне – остава картинката.
  const ZEXT = /Apple/.test(navigator.vendor || "") ? "mov" : "webm", ZV = {};
  const ZTALK = new Set(["zr_1b8a6af07a", "zr_67eba3aea2", "zr_3fc93ee148", "zr_4d91ff6f99", "zr_568c954995", "zr_82b1ccea7b", "zr_2d1d86edec", "zr_c0eecbb870", "zr_56758eff9f"]);
  let zvOn = null, zvReady = false;
  const zvBox = document.createElement("div"); zvBox.className = "j-zv"; document.body.insertBefore(zvBox, $("#ui"));
  function zClip(n) { if (ZV[n]) return ZV[n]; const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto"; v.loop = n === "rest";
    v.src = `assets/video/journey/zori_${n}.${ZEXT}`; v.addEventListener("ended", () => { if (zvOn === v) zoriRest(); });
    v.addEventListener("playing", () => { if (zvReady) return; zvReady = true; if (zoriSpr) zoriSpr.visible = false; zvBox.classList.add("on"); homeLayout(); });
    zvBox.appendChild(v); return ZV[n] = v; }
  zClip("rest"); ZTALK.forEach(f => zClip("talk_" + f));
  function zoriPlay(n) { const v = zClip(n); if (zvOn && zvOn !== v) { zvOn.classList.remove("on"); zvOn.pause(); }
    v.classList.add("on"); zvOn = v; try { v.currentTime = 0; } catch (e) {} const p = v.play(); if (p && p.catch) p.catch(() => {}); return v; }
  function zoriRest() { zoriPlay("rest"); }
  window.addEventListener("zori-talk", e => { const { on, f } = e.detail; if (!homeScene.visible) return;
    if (on) { const v = ZTALK.has(f) && ZV["talk_" + f]; if (v && v.readyState >= 2 && !v.error) zoriPlay("talk_" + f); } else if (zvOn && zvOn !== ZV.rest) zoriRest(); });
  zvBox.onclick = () => { if (homeScene.visible) { SFX.tap(); sayZ("Здравей! Аз съм Зори."); } };
  function placeZoriVideo() { if (!zoriSpr || !zoriSpr.texture.height) return;
    // кадърът на видеото (396×516): героят е 431 px висок (= цялата картинка), стъпалата на 93% от височината, центърът на 47% от ширината
    const h = zoriSpr.texture.height * zoriSpr.scale.x * homeSc * 516 / 431, w = h * 396 / 516, p = toScreen(zoriSpr.x, zoriSpr.y);
    Object.assign(zvBox.style, { width: w + "px", height: h + "px", left: (p.x - w * .472) + "px", top: (p.y - h * .931) + "px" });
    zvBox.style.display = homeScene.visible ? "" : "none";
    // балонът с репликата – до главата на Зори (вдясно, вляво или над нея – където има място)
    const b = $("#j-bub"); if (!b) return; const W = app.screen.width, head = p.y - h * .93, cx = p.x - w * .03, side = w * .36, spR = W - (cx + side) - 10, spL = cx - side - 10, bw = Math.min(300, Math.max(spR, spL));
    const st = { maxWidth: bw + "px", width: "", bottom: "auto", right: "auto", transform: "none", transformOrigin: "0 100%" };
    if (spR >= 150 && spR >= Math.min(300, spL)) Object.assign(st, { left: cx + side + "px", top: Math.max(70, head + h * .05) + "px" });
    else if (spL >= 150) Object.assign(st, { left: "auto", right: (W - (cx - side)) + "px", top: Math.max(70, head + h * .05) + "px", transformOrigin: "100% 100%" });
    else Object.assign(st, { maxWidth: Math.min(340, W - 24) + "px", left: (W - Math.min(340, W - 24)) / 2 + "px", width: Math.min(340, W - 24) + "px", top: "72px", transformOrigin: "50% 0" });   // тесен екран – горе, под заглавието
    Object.assign(b.style, st);
    // ако закрива надпис на предмет – горе, под заглавието
    const r = b.getBoundingClientRect(), hit = [...document.querySelectorAll(".j-hot")].some(e => { if (e.hidden) return false; const q = e.getBoundingClientRect(); return r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top; });
    if (hit && st.top !== "72px") Object.assign(b.style, { maxWidth: Math.min(340, W - 24) + "px", width: Math.min(340, W - 24) + "px", left: (W - Math.min(340, W - 24)) / 2 + "px", right: "auto", top: "72px", transformOrigin: "50% 0" }); }
  window.addEventListener("orientationchange", () => setTimeout(homeLayout, 300));
  let homeSc = 1, homeOff = { x: 0, y: 0 };
  // картината запълва екрана, но режем най-много ~20% (иначе губим прозореца или предмети) – остатъкът е тъмен фон с мек преход
  function homeLayout() {
    const W = app.screen.width, H = app.screen.height, key = H > W * 1.05 ? "port" : "land"; RM = ROOMS[key];
    const cover = Math.max(W / RM.w, H / RM.h), contain = Math.min(W / RM.w, H / RM.h); homeSc = Math.min(cover, contain * 1.25);
    const vw = W / homeSc, vh = H / homeSc, ox = (W - RM.w * homeSc) / 2, oy = key === "port" ? H - RM.h * homeSc : vh >= RM.h ? (H - RM.h * homeSc) / 2 : -(RM.h - vh) * .55 * homeSc;
    homeOff = { x: ox, y: oy }; homeScene.scale.set(homeSc); homeScene.position.set(ox, oy);
    if (key !== roomKey && ROOMTEX[key]) { roomKey = key; roomSpr.texture = ROOMTEX[key]; layoutRoom(); }
    // преходите – само там, където картината не стига до ръба на екрана
    const [fl, fr, ft] = fades; fl.visible = ox > 1; fr.visible = ox > 1; ft.visible = oy > 1;
    fl.position.set(0, 0); fl.width = 90; fl.height = RM.h; fr.position.set(RM.w, 0); fr.width = -90; fr.height = RM.h;
    ft.rotation = Math.PI / 2; ft.position.set(RM.w, 0); ft.width = 110; ft.height = RM.w;
    placeHotspots(); placeZoriVideo();
  }
  function layoutRoom() {
    const W0 = RM.win; skyMask.clear().beginFill(0xffffff).drawCircle(W0.x, W0.y, W0.r).endFill(); winHit.hitArea = new PIXI.Circle(W0.x, W0.y, W0.r * .85);
    skyStars.forEach(d => d.position.set(W0.x + Math.cos(d._a) * d._r * W0.r, W0.y + Math.sin(d._a) * d._r * W0.r)); drawMini();
    if (homeShip) { homeShip.x = W0.x - W0.r * .5; homeShip._y = W0.y + W0.r * .12; }
    lamps.forEach((g, i) => { const [x, y, k] = RM.lamps[i]; g.position.set(x, y); g._k = k; g._hit.hitArea = new PIXI.Circle(x, y, 60); });
    motes.forEach(m => m.position.set(Math.random() * RM.w, RM.h * (.25 + Math.random() * .6)));
    Object.values(PROPS).forEach(p => { const [x0, y0, x1, y1] = RM.box[p.k], w = x1 - x0, h = y1 - y0, pad = 14;
      p.hit.hitArea = new PIXI.Rectangle(x0 - pad, y0 - pad, w + pad * 2, h + pad * 2);
      p.pic.texture = new PIXI.Texture(roomSpr.texture.baseTexture, new PIXI.Rectangle(Math.max(0, x0), Math.max(0, y0), Math.min(w, RM.w - x0), Math.min(h, RM.h - y0)));
      p.pic.position.set(-w / 2, -h); p.mask.position.set(-w / 2 - w * .08, -h - h * .08); p.mask.width = w * 1.16; p.mask.height = h * 1.16;
      p.lift.position.set(x0 + w / 2, y1); p.glow.position.set(x0 + w / 2, y0 + h / 2); p.glow.width = w * 1.5; p.glow.height = h * 1.3; p._w = w; p._h = h; });
    if (zoriSpr) { zoriSpr.position.set(RM.zori.x, RM.zori.y); zoriSpr.scale.set(RM.zori.h / zoriSpr.texture.height); }
    zShadow.position.set(RM.zori.x, RM.zori.y - 6); zShadow.width = RM.zori.h * .55; zShadow.height = RM.zori.h * .1;
    if (foxSpr) { foxSpr.position.set(RM.fox.x, RM.fox.y); foxSpr.scale.set(RM.fox.h / foxSpr.texture.height); foxSpr._y = RM.fox.y; }
  }
  const toScreen = (x, y) => ({ x: homeOff.x + x * homeSc, y: homeOff.y + y * homeSc });
  // надписите стоят над предметите (не излизат над горния край); лисичето – само след първата част
  function placeHotspots() { if (foxSpr) { foxSpr.visible = S.parts > 0; foxSpr.alpha = .4 + .6 * Math.min(1, S.parts / N); }
    const topY = (-homeOff.y + 112) / homeSc, b = RM.box, lbl = k => [(b[k][0] + b[k][2]) / 2, Math.max(topY, b[k][1] - 20)];
    const hs = { tele: [b.tele[0] + (b.tele[2] - b.tele[0]) * .5, b.tele[1] + (b.tele[3] - b.tele[1]) * .5], abac: lbl("abac"), map: lbl("map"), fox: foxSpr && foxSpr.visible && lbl("fox") };
    PROPS.fox.hit.eventMode = foxSpr && foxSpr.visible ? "static" : "none";
    const W = app.screen.width;   // надписите не излизат извън екрана
    Object.entries(hs).forEach(([k, p]) => { const el = $(`#h-${k}`); if (!el) return; if (!p) { el.hidden = true; return; } el.hidden = false; el.classList.toggle("off", !labelsOn); const q = toScreen(p[0], p[1]), hw = (el.offsetWidth || 120) / 2 + 8;
      el.style.left = Math.min(W - hw, Math.max(hw, q.x)) + "px"; el.style.top = q.y + "px"; }); }
  window.addEventListener("resize", () => { if (homeScene.visible) homeLayout(); });
  app.ticker.add((dt) => { if (!homeScene.visible) return; const t = (performance.now() - t0) / 1000;
    skyStars.forEach(d => { d.alpha = .25 + .55 * (.5 + .5 * Math.sin(t * 1.6 + d._tw)); });
    lamps.forEach((g, i) => { const f = .5 + .12 * Math.sin(t * 9 + i * 2) + .08 * Math.sin(t * 23 + i), on = g._on == null ? 1 : g._on; g.alpha = Math.min(1, f + g._f * .5) * on; g.scale.set((g._k || 1) * (1 + .04 * Math.sin(t * 5 + i) + g._f * .8) * (.4 + .6 * on)); });
    motes.forEach(m => { m.y -= m._v * dt; m.x += Math.sin(t * .6 + m._p) * .2; m.alpha = .18 + .22 * (.5 + .5 * Math.sin(t * 1.3 + m._p)); if (m.y < RM.h * .2) { m.y = RM.h * .85; m.x = Math.random() * RM.w; } });
    MINI.forEach((p, i) => { if (i === S.lit) miniGlow[i].scale.set(.45 + .18 * (.5 + .5 * Math.sin(t * 3))); });
    if (homeShip) { homeShip.y = (homeShip._y || 0) + Math.sin(t * 1.4) * 8; homeShip.rotation = -.35 + Math.sin(t * 1.1) * .05; if (Math.random() < .35) emit(homeShip.x - 14, homeShip.y + 26, { layer: sky, angle: Math.PI * .62, spread: .4, speed: 1, life: 22, tint: Math.random() < .5 ? 0xFFB347 : 0xFF6B3D, scale: .7 }); }
    // входовете „дишат“ със светлина (вълна от единия към другия) и от време на време проблясват – подсказка, че се докосват
    Object.values(PROPS).forEach((p, i) => { if (p.k === "fox" && !(foxSpr && foxSpr.visible)) { p.glow.alpha = 0; return; }
      p.glow.alpha = (p.k === "map" ? .26 : .11) * (.55 + .45 * Math.sin(t * (p.k === "map" ? 2.6 : 1.8) - i * 1.1)) + (p._f || 0) * .5;
      if (Math.random() < .012) { const [x0, y0, x1, y1] = RM.box[p.k]; emit(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0) * .8, { layer: room, speed: .5, life: 40, tint: 0xFFE08A, scale: .8 }); } });
    if (foxSpr && foxSpr.visible) foxSpr.y = (foxSpr._y || 0) - Math.abs(Math.sin(t * 1.2)) * 4;
    // падаща звезда в прозореца
    shootT -= dt / 60; shoot.clear(); if (shootT < 0) { if (shootT < -1) shootT = 4 + Math.random() * 5; const k = -shootT, W0 = RM.win, x = W0.x + W0.r * .7 - k * W0.r * 1.1, y = W0.y - W0.r * .7 + k * W0.r * .55;
      shoot.lineStyle(3, 0xFFFFFF, 1 - k).moveTo(x, y).lineTo(x + 70, y - 34); }
    // подсказка, ако детето не прави нищо: Зори маха и подсказва телескопа (веднъж за посещение, само когато мълчи)
    if (homeIdle >= 0 && !busyGo && (!curA || curA.paused || curA.ended) && (homeIdle += dt / 60) > 10) { homeIdle = -1; showLabels(true); sayZ("Докосни картата и да тръгваме!"); setTimeout(() => press("map", true), 1000); }
  });
  let homeIdle = -1; document.addEventListener("pointerdown", () => { if (homeIdle >= 0) homeIdle = 0; }, true);
  function sayZ(t) { const b = $("#j-bub"); if (b) { b.textContent = t; placeZoriVideo(); gsap.fromTo(b, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "back.out(2)" }); } speak(t); }
  // „натискане“ на нарисуван предмет: копието на областта подскача (пружина), светлината пламва, искри
  function press(k, quiet) { const p = PROPS[k]; if (!p || !p.pic.texture) return; p.lift.visible = true; gsap.killTweensOf([p.lift.scale, p.lift, p]);
    if (!p.cm) { p.cm = new PIXI.ColorMatrixFilter(); p.pic.filters = [p.cm]; }
    const y0 = p.lift.y, tl = gsap.timeline({ onComplete: () => { p.lift.visible = false; p.lift.y = y0; } });
    tl.to(p.lift.scale, { x: 1.1, y: .9, duration: .08, ease: "power2.out" })                                    // натиск
      .to(p.lift.scale, { x: .96, y: 1.1, duration: .14, ease: "power2.out" }).to(p.lift, { y: y0 - p._h * .07, duration: .14, ease: "power2.out" }, "<")   // отскок нагоре
      .to(p.lift.scale, { x: 1, y: 1, duration: .7, ease: "elastic.out(1,.35)" }).to(p.lift, { y: y0, duration: .5, ease: "bounce.out" }, "<");
    gsap.fromTo(p, { _f: 1 }, { _f: 0, duration: 1.1, ease: "power2.out", onUpdate: () => p.cm.brightness(1 + p._f * .35, false) });
    if (!quiet) { const [x0, y0, x1, y1] = RM.box[k]; for (let i = 0; i < 26; i++) emit((x0 + x1) / 2, (y0 + y1) / 2, { layer: room, speed: 2 + Math.random() * 3, life: 40, tint: [0xFFE08A, 0xFFFFFF, 0x8FC7FF][i % 3], scale: 1 }); } }
  // докосване на вход: предметът подскача и светва, после плавен преход (камерата приближава предмета)
  let busyGo = false, labelsOn = false;
  function showLabels(on) { labelsOn = on; document.querySelectorAll(".j-hot-s").forEach(e => e.classList.toggle("off", !on)); if (on) gsap.fromTo(".j-hot-s:not([hidden])", { scale: .6 }, { scale: 1, duration: .4, stagger: .08, ease: "back.out(2)" }); }
  function go(k) { if (!homeScene.visible || busyGo) return; if (homeIdle > 0) homeIdle = 0;
    if (k === "fox") { SFX.tap(); if (foxSpr) gsap.fromTo(foxSpr.scale, { x: foxSpr.scale.x * 1.15, y: foxSpr.scale.y * .85 }, { x: foxSpr.scale.x, y: foxSpr.scale.y, duration: .7, ease: "elastic.out(1,.35)" }); sayZ("Моите звездни създания!"); setTimeout(album, 900 * FAST); return; }
    busyGo = true; SFX.tap(); press(k, true); homeIdle = -1;
    if (k === "map") openMap(); else if (k === "abac") openAbacus(); else if (k === "tele") openScope(); }
  // камерата: стаята се увеличава така, че областта на предмета запълва екрана (Зори и надписите изчезват)
  function zoomTo(k, dur, fill) { const [x0, y0, x1, y1] = RM.box[k], W = app.screen.width, H = app.screen.height, sc = Math.min(W / (x1 - x0), H / (y1 - y0)) * (fill || .9), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    gsap.to(zvBox, { opacity: 0, duration: .2 }); gsap.to("#ui .j-hot, #j-bub, #ui .j-top", { opacity: 0, duration: .2 });
    return new Promise(res => { gsap.to(homeScene.scale, { x: sc, y: sc, duration: dur * FAST, ease: "power2.inOut" }); gsap.to(homeScene.position, { x: W / 2 - cx * sc, y: H / 2 - cy * sc, duration: dur * FAST, ease: "power2.inOut", onComplete: res }); }); }
  function curtain(color, dur) { const c = document.createElement("div"); c.className = "j-curtain"; c.style.background = color; document.body.appendChild(c); return new Promise(res => gsap.fromTo(c, { opacity: 0 }, { opacity: 1, duration: dur * FAST, onComplete: () => res(c) })); }
  function leaveHome() { homeScene.visible = false; zvBox.style.display = "none"; Object.values(ZV).forEach(v => v.pause()); if (curA) curA.pause(); busyGo = false; }
  // абакусът → свободният тренажор: камерата приближава бюрото, после се отваря дигиталният абакус
  async function openAbacus() { [0, .1, .2].forEach(d => tone(1400 + Math.random() * 300, d, .04, "square", .04)); await zoomTo("abac", .75, .85); await curtain("#0B0E2A", .25);
    location.href = "abacus-app.html?back=journey" + (Q.get("p") ? "&p=" + encodeURIComponent(Q.get("p")) : ""); }
  // картата → пътят: камерата приближава картата, пергаментът „се разгръща“ (светла вълна), отваря се звездният път
  async function openMap() { SFX.whoosh(); await zoomTo("map", .65, 1.05); const c = await curtain("radial-gradient(circle, #F4E3B5 0%, #C9A86A 60%, #6B4A22 100%)", .3);
    leaveHome(); mapScene.visible = true; layout(); placeShip(S.lit, true); camY = camTarget; hud(); gsap.to(c, { opacity: 0, duration: .6 * FAST, onComplete: () => c.remove() }); }
  // телескопът → игрите: телескопът се накланя, лещата расте до цял екран → небето с обектите-игри
  async function openScope() { SFX.whoosh(); const [x0, y0, x1, y1] = RM.box.tele, from = toScreen(x0 + (x1 - x0) * .12, y0 + (y1 - y0) * .3), lens = $("#j-lens");
    lens.style.left = from.x + "px"; lens.style.top = from.y + "px"; const D = Math.hypot(app.screen.width, app.screen.height) * 2.2;
    await new Promise(res => gsap.fromTo(lens, { width: 10, height: 10, opacity: 1 }, { width: D, height: D, duration: .8 * FAST, ease: "power2.in", onComplete: res }));
    leaveHome(); scope(); gsap.to(lens, { opacity: 0, duration: .3 }); }

  // =================== ПРЕЗ ТЕЛЕСКОПА: игри и предизвикателства ===================
  // Всеки небесен обект е игра. Играе се със звездите, които детето вече е запалило (нищо ново – само упражнение); „скоро“ – заключени.
  const GAMES = [{ id: "flash", t: "Звездни сигнали", img: "comet", sub: "Виж за миг и познай числото" }, { id: "calc", t: "Звездни сметки", img: "planet", sub: "Смятай на абакуса" },
    { id: "mem", t: "Нощна памет", img: "moon", soon: 1 }, { id: "fix", t: "Поправи телескопа", img: "galaxy", soon: 1 }];
  function scope() {
    ui.innerHTML = `<div class="j-scope" id="j-scope"><header class="j-top"><button class="j-chip j-home" id="j-sh" title="Към обсерваторията">⌂</button><div class="j-chip j-energy"><span class="j-gem"></span><b id="j-en">${S.energy}</b></div>
        <div class="j-title"><b>През телескопа</b><small>Избери небесен обект</small></div></header>
      <div class="j-sky">${GAMES.map((g, i) => `<button class="j-obj${g.soon ? " soon" : ""}" data-g="${g.id}" style="--i:${i}"><img src="assets/img/journey/sky_${g.img}.webp" alt=""><b>${g.t}</b><small>${g.soon ? "скоро" : g.sub}</small></button>`).join("")}</div></div>`;
    gsap.from(".j-obj", { scale: .3, opacity: 0, stagger: .1, duration: .55, ease: "back.out(1.8)" }); speak("Какво виждаш? Избери игра!");
    $("#j-sh").onclick = () => { SFX.tap(); goHome(false); };
    document.querySelectorAll(".j-obj").forEach(b => b.onclick = () => { const g = GAMES.find(x => x.id === b.dataset.g); SFX.tap(); gsap.fromTo(b, { scale: 1.15 }, { scale: 1, duration: .5, ease: "elastic.out(1,.4)" });
      if (g.soon) { speak("Тази игра идва скоро!"); toast("Тази игра идва скоро ✨"); return; } practice(g); });
  }
  // упражнение: 5 въпроса от вече запалените звезди; спокойно при грешка; накрая – енергия и „Още веднъж“
  async function practice(g) { const st = STARS[Math.max(0, Math.min(S.lit, N) - 1)], sc = $("#j-scope"); let ok = 0;
    sc.querySelector(".j-sky").remove(); sc.querySelector(".j-title small").textContent = g.t;
    sc.insertAdjacentHTML("beforeend", `<div class="j-pdots">${[0, 1, 2, 3, 4].map(() => "<i></i>").join("")}</div><section class="j-panel" id="j-panel"></section>`);
    for (let q = 0; q < 5; q++) { const r = g.id === "flash" ? await flashQ(st, q === 0) : await calcQ(st, false); if (r) { ok++; SFX.good(ok); } else SFX.bad();
      sc.querySelectorAll(".j-pdots i")[q].className = r ? "ok" : "no"; }
    save(); $("#j-panel").innerHTML = `<div class="j-pend"><div class="j-stars">${[0, 1, 2].map(x => `<span class="${x < (ok >= 5 ? 3 : ok >= 3 ? 2 : 1) ? "on" : ""}">★</span>`).join("")}</div><p>${ok} от 5 верни</p>
      <div class="j-prow"><button class="j-btn" id="j-pa">Още веднъж</button><button class="j-btn j-ghost" id="j-pb">Други игри</button></div></div>`;
    gsap.from(".j-pend .j-stars span", { scale: 0, rotation: -90, stagger: .15, duration: .4, ease: "back.out(3)" }); speak("Браво! Хайде пак?");
    $("#j-pa").onclick = () => { SFX.tap(); scope(); practice(g); }; $("#j-pb").onclick = () => { SFX.tap(); scope(); }; }

  function homeHud(celebrate) { if (!homeHud._v) { homeHud._v = 1; S.visits = (S.visits || 0) + 1; save(); }
    const nx = S.lit < N ? STARS[S.lit].t : "Аврора свети!";
    ui.innerHTML = `<header class="j-top"><div class="j-chip j-streak"><span class="j-flame">🔥</span><b>${S.streak}</b></div><div class="j-chip j-energy"><span class="j-gem"></span><b id="j-en">${S.energy}</b></div>
        <div class="j-title"><b>Звездна обсерватория</b><small>${S.lit} от ${N} звезди светят</small></div></header>
      <button class="j-hot j-hot-s j-hot-main" id="h-map"><b><i>🗺️</i>Звездна карта</b><small>${nx}</small></button><button class="j-hot j-hot-s" id="h-tele"><b><i>🔭</i>Игри</b></button>
      <button class="j-hot j-hot-s" id="h-abac"><b><i>🧮</i>Абакус</b></button><button class="j-hot j-hot-s" id="h-fox"><b><i>🦊</i>Създания</b></button>
      <div class="j-bub j-hbub" id="j-bub"></div><div class="j-lens" id="j-lens"></div>`;
    ["tele", "abac", "map", "fox"].forEach(k => { $(`#h-${k}`).onclick = () => go(k); });
    gsap.from(".j-top > *", { y: -30, opacity: 0, stagger: .07, duration: .5, ease: "back.out(1.6)" });
    const first = !S.tour, line = celebrate ? "Виж! Новата звезда свети в небето!" : first ? "Здравей! Аз съм Зори. Това е нашата обсерватория." : "Здравей! Следващата звезда ни чака. Докосни картата!";
    if (zoriSpr && !zvReady) { PIXI.Assets.load(`assets/img/zori/z_${celebrate ? "joy" : "calm"}.png`).then(t => { zoriSpr.texture = t; homeLayout(); }); }
    // нова звезда: Зори подскача, около него искри, и казва репликата (клипът е синхронизиран с нея); иначе – поздравът
    zoriRest(); lightsOn(); setTimeout(() => { if (first && !celebrate) tour(); else sayZ(line); }, celebrate ? 300 : 1300 * FAST);
    if (celebrate) { gsap.fromTo(zvBox, { y: 0 }, { y: -38, duration: .22, ease: "power2.out", yoyo: true, repeat: 3, delay: .1 });
      for (let i = 0; i < 36; i++) emit(RM.zori.x + (Math.random() - .5) * 160, RM.zori.y - RM.zori.h * .6 - Math.random() * 160, { layer: room, speed: 2 + Math.random() * 2.5, life: 55, tint: [0xFFE08A, 0xFFFFFF, 0xFF8FB1][i % 3], scale: 1.1 }); }
    homeIdle = 0; busyGo = false; labelsOn = S.visits <= 3; homeLayout();
  }
  // влизане: стаята е тъмна, фенерите светват един по един, телескопът леко се завърта
  const dark = new PIXI.Graphics(); dark.beginFill(0x05040A).drawRect(-200, -200, 4000, 4000).endFill(); dark.zIndex = 8.5; dark.alpha = 0; room.addChild(dark);
  function lightsOn() { dark.alpha = .78; gsap.to(dark, { alpha: 0, duration: 1.6 * FAST, ease: "power1.in", delay: .2 });
    lamps.forEach((g, i) => { g._on = 0; gsap.to(g, { _on: 1, duration: .5, delay: (.25 + i * .3) * FAST, ease: "back.out(3)", onStart: () => tone(660 + i * 220, 0, .18, "sine", .04) }); });
    setTimeout(() => press("tele", true), 900 * FAST); }
  // първо посещение: Зори представя обсерваторията и показва всеки вход (с надпис и светване)
  async function tour() { homeIdle = -1; showLabels(true); const say = async (t, k) => { if (k) press(k, true); sayZ(t); await new Promise(r => setTimeout(r, 400)); while (curA && !curA.paused && !curA.ended) await new Promise(r => setTimeout(r, 150)); await new Promise(r => setTimeout(r, 300)); };
    await say("Здравей! Аз съм Зори. Това е нашата обсерватория."); await say("Това е абакусът. С него тренираме.", "abac");
    await say("През телескопа ще видиш игрите.", "tele"); await say("А това е звездната карта. Оттук тръгваме на мисия.", "map");
    S.tour = 1; save(); await say("Докосни картата и да тръгваме!", "map"); homeIdle = 0; }
  function toast(t) { const d = document.createElement("div"); d.className = "j-toast"; d.textContent = t; document.body.appendChild(d); gsap.fromTo(d, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }); setTimeout(() => d.remove(), 1800); }
  const throughTelescope = () => go("tele");   // старото име (за автоматичните проверки)
  function goHome(celebrate) {
    mapScene.visible = false; homeScene.visible = true; gsap.killTweensOf([homeScene.scale, homeScene.position]); zvBox.style.opacity = ""; drawMini(); homeHud(celebrate);
    if (celebrate && S.lit > 0) { const p = MINI[S.lit - 1]; for (let k = 0; k < 40; k++) emit(p.x, p.y, { layer: sky, speed: 2 + Math.random() * 3, life: 50, tint: [0xFFE08A, 0xFFFFFF, 0x8FC7FF][k % 3], scale: 1.2 });
      gsap.fromTo(miniGlow[S.lit - 1].scale, { x: 2.5, y: 2.5 }, { x: .7, y: .7, duration: 1.4, ease: "power2.out" }); SFX.ignite(); }
  }

  // ---- старт ----
  drawPath(); nodes.forEach((_, i) => drawNode(i)); placeShip(S.lit, true); camY = camTarget; layout(); goHome(false);
  window.JOURNEY = { S, app, mission, ignite, reward, album, goHome, throughTelescope, go, PROPS, press, scope, practice, GAMES };   // за автоматичните проверки
})();
