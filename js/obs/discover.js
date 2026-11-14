/* Г1 „Небето оживява“ (14.11.2026): фигурите на съзвездията и сцената на откриването. Само изглед – нищо тук не променя ученето.
   Фигурата се показва само ако всички звезди на съзвездието имат пълна яркост (решава app.js от записаното състояние).
   Координатите са тези на небето (същите като звездите в app.js) – звездите не се местят заради фигурата. */
(function () {
  // ---- „Първи светлини“ (5–6 г., звезди 1–9): магически фенер. 8 и 7 – краищата на капака, 6 – до дясното стъкло, 5 – в стъклото,
  // 3 – левият край на основата, 4 – до пламъка, 9 – куката, на която виси; светлината пада към 1 и 2.
  const GLOBE = "M288 222 C 224 252 224 356 288 386 L 362 386 C 426 356 426 252 362 222 Z";
  function lantern() {
    return `<path class="f-beam" d="M258 396 L 98 448 L 156 348 Z"/>
      <circle class="f-glow" cx="325" cy="304" r="92"/>
      <path class="f-chain" d="M318 147 Q 266 126 221 154"/>
      <path class="f-under" d="${GLOBE}"/>
      <path class="f-fill f-glass" d="${GLOBE}"/>
      <path class="f-bars" d="M325 226 L325 384 M303 226 C 280 264 280 346 303 384 M347 226 C 370 264 370 346 347 384"/>
      <path class="f-fill f-metal" d="M282 206 C 290 178 360 178 368 206 Z"/>
      <path class="f-fill f-metal" d="M270 222 L380 222 L370 206 L280 206 Z"/>
      <path class="f-fill f-metal" d="M262 386 L388 386 L400 402 L250 402 Z"/>
      <path class="f-out" pathLength="1" d="${GLOBE}"/>
      <path class="f-out" pathLength="1" d="M284 206 C 284 142 366 142 366 206"/>
      <path class="f-out" pathLength="1" d="M282 206 C 290 178 360 178 368 206 M270 222 L380 222 L370 206 L280 206 Z"/>
      <path class="f-out" pathLength="1" d="M262 386 L388 386 L400 402 L250 402 Z"/>
      <circle class="f-out" pathLength="1" cx="325" cy="150" r="7"/>
      <g class="f-flame"><path class="f-fl1" d="M325 270 C 348 298 348 330 325 344 C 302 330 302 298 325 270 Z"/><path class="f-fl2" d="M325 293 C 335 307 335 324 325 332 C 315 324 315 307 325 293 Z"/></g>`;
  }
  // skel – „скелетът“ на фигурата между истинските звезди (като на звездна карта); trail – светлината към 1 и 2; flame – звездата-пламък
  const FIG = { A: { name: "Първи светлини", vb: "60 112 420 356", pivot: [325, 150], svg: lantern, hit: GLOBE,
    skel: [[8, 7], [7, 6], [6, 5], [5, 3], [3, 8], [9, 8]], trail: [[3, 2], [2, 1]], flame: 4 } };
  const NS = "http://www.w3.org/2000/svg";
  // постоянната фигура (на картата и в прозореца): деликатна, зад звездите; hit – зона за докосване (само на картата)
  function figure(id, opts) { const F = FIG[id]; if (!F) return ""; const o = opts || {};
    return `<g class="o-fig${o.cls ? " " + o.cls : ""}" data-c="${id}">${F.svg()}</g>${o.hit ? `<path class="o-fighit" data-c="${id}" d="${F.hit}"/>` : ""}`; }
  // вмъква фигурата в готово небе (прозореца на стаята след откриването) – пред звездите, за да остане зад тях
  function addTo(svg, id) { if (!svg || svg.querySelector(`.o-fig[data-c="${id}"]`)) return; const t = document.createElementNS(NS, "svg"); t.innerHTML = figure(id, { cls: "o-fig-new" });
    const before = svg.querySelector(".o-star"); [...t.childNodes].forEach(n => svg.insertBefore(n, before || null)); }

  // ---- сцената на откриването ----
  // o: { id, stars: [[n, x, y, big]], lines: [[a, b]], line, say(text) → Promise, stop(), sound, reduced, onSeen(), onDone() }
  const T0 = 380, STEP = 90, EDGE = 110;   // звездите светват една по една; после нишките между тях – по една
  let running = null;
  function play(o) {
    if (running) return running;   // никога две сцени наведнъж
    const F = FIG[o.id]; if (!F) { if (o.onDone) o.onDone(); return null; }
    const red = !!o.reduced, timers = [], later = (fn, ms) => timers.push(setTimeout(() => { if (!dead) fn(); }, ms));
    let dead = false, seen = false, closing = false;
    const P = {}; o.stars.forEach(s => { P[s[0]] = s; });
    const order = o.stars.map(s => s[0]), at = {}; order.forEach((n, i) => { at[n] = T0 + i * STEP; });
    const starsEnd = T0 + order.length * STEP, edges = F.skel.concat(F.trail || []), sk0 = starsEnd + 200, skEnd = sk0 + F.skel.length * EDGE;
    const figAt = skEnd + (F.trail ? F.trail.length * EDGE : 0) + 80, finalAt = red ? 250 : figAt + 650, sayAt = red ? 350 : figAt + 150;   // Зори – след като фигурата е разпозната (нотите отдавна са заглъхнали)
    const star = (s) => { const r = s[3] ? 15 : 10; return `<g class="od-st" style="--d:${at[s[0]]}ms" transform="translate(${s[1]} ${s[2]})"><circle class="od-sg" r="${r * 2.6}"/>
      <path class="od-sc" d="M0 ${-r}L${r * .3} ${-r * .3}L${r} 0L${r * .3} ${r * .3}L0 ${r}L${-r * .3} ${r * .3}L${-r} 0L${-r * .3} ${-r * .3}Z"/></g>`; };
    const field = Array.from({ length: 70 }, (_, i) => `<circle cx="${60 + (i * 137) % 420}" cy="${112 + (i * 89) % 356}" r="${(i % 3) * .5 + .5}" opacity="${.2 + (i % 4) * .12}"/>`).join("");
    const root = document.createElement("div"); root.className = "od" + (red ? " od-red od-final" : ""); root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Откритие: съзвездието " + F.name);
    root.innerHTML = `<button class="od-skip" type="button">Пропусни <span aria-hidden="true">›</span></button>
      <svg class="od-sky" viewBox="${F.vb}" aria-hidden="true"><defs>
        <radialGradient id="odg"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".45" stop-color="#F5C04A" stop-opacity=".55"/><stop offset="1" stop-color="#F5C04A" stop-opacity="0"/></radialGradient>
        <radialGradient id="odf"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".9"/><stop offset=".55" stop-color="#FFC44A" stop-opacity=".45"/><stop offset="1" stop-color="#FF9A2A" stop-opacity="0"/></radialGradient>
        <radialGradient id="odglass" cx=".5" cy=".56"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".6"/><stop offset=".7" stop-color="#F5C04A" stop-opacity=".2"/><stop offset="1" stop-color="#F5C04A" stop-opacity=".08"/></radialGradient>
        <linearGradient id="odbeam" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE29A" stop-opacity=".4"/><stop offset="1" stop-color="#FFE29A" stop-opacity="0"/></linearGradient></defs>
        <g class="od-field">${field}</g>
        <g class="od-fig" style="transform-origin:${F.pivot[0]}px ${F.pivot[1]}px">${F.svg()}</g>
        ${edges.map(([a, b], i) => `<line class="od-ln${i >= F.skel.length ? " od-tr" : ""}" pathLength="1" style="--d:${sk0 + i * EDGE}ms" x1="${P[a][1]}" y1="${P[a][2]}" x2="${P[b][1]}" y2="${P[b][2]}"/>`).join("")}
        ${o.stars.map(star).join("")}
        <path class="od-hit" d="${F.hit}"/></svg>
      <div class="od-name"><em>Ново съзвездие</em><b>${F.name}</b></div>
      <div class="od-z"><img src="assets/img/zori/z_joy.png" alt=""><div class="od-bub" role="status" aria-live="polite"></div></div>`;
    document.body.appendChild(root);
    const $ = (s) => root.querySelector(s);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("on")));
    // звук: по една тиха нота при всяка звезда (възходяща пентатоника), свършва преди репликата на Зори
    if (o.sound && !red) try { const ac = new (window.AudioContext || window.webkitAudioContext)(), f0 = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];
      order.forEach((n, i) => { const t = ac.currentTime + at[n] / 1000 + .05, os = ac.createOscillator(), g = ac.createGain(); os.type = "sine"; os.frequency.value = f0[i % f0.length];
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .28); os.connect(g).connect(ac.destination); os.start(t); os.stop(t + .3); });
      later(() => { try { ac.close(); } catch (e) {} }, starsEnd + 700); } catch (e) {}
    later(() => root.classList.add("figon"), red ? 0 : figAt);
    later(() => root.classList.add("named"), red ? 0 : figAt + 420);
    later(final, finalAt);
    // репликата: след нотите; автоматичното затваряне чака гласа да свърши (не го прекъсва)
    later(() => { const b = $(".od-bub"); b.textContent = o.line; root.classList.add("talk");
      Promise.resolve(o.say ? o.say(o.line) : null).catch(() => {}).then(() => later(close, 450)); }, sayAt);
    later(close, 12000);   // резерва, ако нещо със звука се обърка
    function final() { if (seen) return; seen = true; root.classList.add("od-final", "figon", "named"); try { if (o.onSeen) o.onSeen(); } catch (e) {} }
    function close() { if (closing) return; closing = true; final(); root.classList.add("out");
      setTimeout(() => { dead = true; timers.forEach(clearTimeout); document.removeEventListener("keydown", onKey, true); root.remove(); running = null; try { if (o.onDone) o.onDone(); } catch (e) {} }, 450); }
    function skip() { final(); try { if (o.stop) o.stop(); } catch (e) {} close(); }
    // детето докосва фенера: люлее се на веригата и пламъкът припламва – само реакция, сцената не се удължава
    const fig = $(".od-fig"); $(".od-hit").addEventListener("pointerdown", (e) => { e.preventDefault(); if (!root.classList.contains("figon") || red) return;
      fig.classList.remove("swing"); void fig.getBoundingClientRect(); fig.classList.add("swing"); });
    $(".od-skip").onclick = skip;
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); skip(); } }; document.addEventListener("keydown", onKey, true);
    running = { skip, el: root, get seen() { return seen; } };
    return running;
  }
  window.ObsDiscover = { FIG, figure, addTo, play, get running() { return running; } };
})();
