/* Умни везни — две механики според нивото (проверено на живо):
   Ниво 1: везна с две блюда от един и същ предмет; табела „Повече“ / „По-малко“; две квадратчета под везната.
           След избор: ✓ в квадратчето под вярното блюдо, ✗ в грешното; после нова задача с нов предмет.
   Ниво 2: „Сравни числата“: числа в блюдата, бутони > = <; знакът влиза в пръстена на стълба.
   Диапазон на смятане важи за числата на ниво 2. Брой примери 4..25. Норми 0 / 1 / 2. */
(function () {
  const OBJS = ["obj/apple", "obj/banana", "obj/carrot", "obj/cherries", "obj/cookie", "obj/cupcake", "obj/donut-sprinkles", "obj/ice-cream-cne", "obj/strawberry", "obj/watermelon", "obj/pear", "obj/pumpkin", "obj/lemon", "obj/orange", "obj/mushroom", "obj/pineapple", "obj/grapes", "obj/coconut", "obj/corn", "obj/tomato", "fish_orange", "fish_blue", "fish_red", "fish_green", "fish_pink", "fish_brown"];
  const MAXPILE = 10;
  const LOOK2 = () => document.documentElement.classList.contains("look2");
  // „един свят“: рисуваните плодове и зеленчуци (без кант), по-голям размер и повече въздух
  const G2 = ["yabalka", "krusha", "yagoda", "chereshi", "morkov", "tikva", "gaba", "grozde"].map(n => "garden_r/" + n);
  const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#22A56A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const CROSS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#E2493F" stroke-width="4" stroke-linecap="round"/></svg>`;
  const pileHtml = (name, count) => { const cols = count <= 3 ? count : count <= 6 ? 3 : 4; return `<span class="pan-pics" style="--cols:${cols}">${Array.from({ length: count }, () => `<img src="assets/img/${name}.png?v=p2" alt="" draggable="false">`).join("")}</span>`; };

  // Подрежда count картинки върху блюдо с център cx (SVG единици), в редове по 4, отдолу нагоре.
  // ref – по-голямата от двете групи: размерът и редът са еднакви от двете страни (детето сравнява броя, не размера)
  function loadSvg(name, count, cx, ref = count) {
    const big = LOOK2(), m = Math.max(count, ref);
    const size = big ? (m <= 3 ? 74 : m <= 4 ? 64 : m <= 6 ? 56 : m <= 8 ? 50 : 46) : (count <= 6 ? 44 : 36), per = big ? (m <= 3 ? 3 : m <= 8 ? 4 : 5) : (count <= 3 ? count : count <= 6 ? 3 : 4), gap = big ? 12 : 4;
    const v = name.startsWith("garden_r/") ? "2" : "p2";
    let html = "", i = 0, row = 0;
    while (i < count) {
      const n = Math.min(per, count - i), w = n * size + (n - 1) * gap, x0 = cx - w / 2, y = 376 - size - row * (size + (big ? 4 : -10)) - 2;
      for (let k = 0; k < n; k++) html += `<image href="assets/img/${name}.png?v=${v}" x="${(x0 + k * (size + gap)).toFixed(1)}" y="${y}" width="${size}" height="${size}"/>`;
      i += n; row++;
    }
    return html;
  }
  const numSvg = (v, cx) => `<text x="${cx}" y="360" text-anchor="middle" class="pan-num-svg">${v}</text>`;
  // Геометрия на везната в координати на SVG 800x520: ос на гредата (400,160), рамене ±300, дължина на прътите 200
  const PIVOT = { x: 400, y: 160 }, ARM = 300, DROP = 210;

  class ScalesGame extends BaseGame {
    get gameId() { return "intellectScales"; }
    get skillName() { return this.mb && this.mb.units[0] && this.mb.units[0].wl ? "Лек и тежък" : Number(this.s.level) === 2 ? `Сравняване на числа до ${this.s.range}` : "Повече и по-малко"; }
    // Домашна: задачите идват от банката на рунда (config/math-banks.json): {l, r[, ask: "more"|"less"]} – l/r са количествата
    // в лявото/дясното блюдо (ниво 1: брой предмети, ask = табелата; ниво 2: числата за знака). Без банка – случайно.
    start() { MATH_BANK.attach(this).then(() => super.start()); }
    unit() { return this.mb ? this.mb.units[this.idx % this.mb.units.length] : null; }
    render() {
      this.level = Number(this.s.level || 1); this.range = Number(this.s.range || 3);
      this.shell.arena.innerHTML = `
        <svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-deck"/></svg>
        <div class="balance-wrap">
          <svg class="balance" viewBox="0 0 800 520" aria-hidden="true">
            <use href="${LOOK2() ? "#balance2" : "#balance"}" x="0" y="0" width="800" height="520"/>
            <g id="beam" transform="rotate(0 400 160)">
              <path d="M96 160 C130 128 210 150 290 146 C340 143 372 138 400 128 C428 138 460 143 510 146 C590 150 670 128 704 160 C670 192 590 170 510 174 C460 177 428 182 400 192 C372 182 340 177 290 174 C210 170 130 192 96 160 Z" fill="url(#g-bronze)" stroke="#4E3418" stroke-width="2.5"/>
              <path d="M120 156 C180 146 250 158 330 152" fill="none" stroke="#F3E0A8" stroke-width="3" stroke-linecap="round" opacity=".8"/>
              <path d="M470 152 C550 158 620 146 680 156" fill="none" stroke="#F3E0A8" stroke-width="3" stroke-linecap="round" opacity=".8"/>
              <path d="M96 160 c-18 -22 -6 -46 14 -40 c12 4 12 22 -2 26" fill="none" stroke="url(#g-bronze-v)" stroke-width="7" stroke-linecap="round"/>
              <path d="M704 160 c18 -22 6 -46 -14 -40 c-12 4 -12 22 2 26" fill="none" stroke="url(#g-bronze-v)" stroke-width="7" stroke-linecap="round"/>
              <circle cx="96" cy="160" r="10" fill="#3E2A12"/><circle cx="704" cy="160" r="10" fill="#3E2A12"/>
              <circle cx="400" cy="160" r="16" fill="url(#g-bronze-v)" stroke="#4E3418" stroke-width="2.5"/><circle cx="400" cy="160" r="6" fill="#4E3418"/>
            </g>
            <g id="panL">
              <line x1="96" y1="160" x2="20" y2="372" stroke="#3E2A12" stroke-width="5" stroke-dasharray="6 5" stroke-linecap="round"/><line x1="96" y1="160" x2="176" y2="372" stroke="#3E2A12" stroke-width="5" stroke-dasharray="6 5" stroke-linecap="round"/>
              <ellipse cx="98" cy="384" rx="100" ry="24" fill="url(#g-pan)"/><ellipse cx="98" cy="376" rx="86" ry="14" fill="#C7A25C" opacity=".55"/><path d="M0 384 a98 22 0 0 0 196 0" fill="none" stroke="#3E2A12" stroke-width="2" opacity=".6"/>
              <g id="loadL"></g>
            </g>
            <g id="panR">
              <line x1="704" y1="160" x2="628" y2="372" stroke="#3E2A12" stroke-width="5" stroke-dasharray="6 5" stroke-linecap="round"/><line x1="704" y1="160" x2="784" y2="372" stroke="#3E2A12" stroke-width="5" stroke-dasharray="6 5" stroke-linecap="round"/>
              <ellipse cx="702" cy="384" rx="100" ry="24" fill="url(#g-pan)"/><ellipse cx="702" cy="376" rx="86" ry="14" fill="#C7A25C" opacity=".55"/><path d="M604 384 a98 22 0 0 0 196 0" fill="none" stroke="#3E2A12" stroke-width="2" opacity=".6"/>
              <g id="loadR"></g>
            </g>
          </svg>
          <div class="ring-sign" id="ring" hidden></div>
        </div>
        <div class="crate-ui">
          <div class="plate-wood" id="plate"></div>
          <div class="boxes" id="boxes"></div>
        </div>`;
      this.beam = this.shell.arena.querySelector("#beam"); this.panL = this.shell.arena.querySelector("#panL"); this.panR = this.shell.arena.querySelector("#panR");
      this.loadL = this.shell.arena.querySelector("#loadL"); this.loadR = this.shell.arena.querySelector("#loadR");
      this.plate = this.shell.arena.querySelector("#plate"); this.boxes = this.shell.arena.querySelector("#boxes"); this.ring = this.shell.arena.querySelector("#ring");
      if (LOOK2()) this.look2();
    }
    // „един свят“: дърво и месинг, по-големи блюда (+15 %), детето докосва самото блюдо; плавен наклон
    look2() {
      const A = this.shell.arena; A.querySelector(".balance-wrap").classList.add("b2"); A.querySelector(".balance-wrap").classList.toggle("lv2", this.level === 2);
      A.querySelector("svg.balance").setAttribute("viewBox", "-80 0 960 540"); A.querySelector("svg.balance").setAttribute("overflow", "visible");
      A.querySelectorAll("#beam path")[0].setAttribute("fill", "url(#b2-wood)");
      A.querySelectorAll("#beam path")[0].setAttribute("stroke", "#5E3A1A");
      A.querySelectorAll("#panL line, #panR line").forEach(l => { const x2 = Number(l.getAttribute("x2")), x1 = Number(l.getAttribute("x1")); l.setAttribute("x2", x1 + (x2 - x1) * 1.75); l.setAttribute("stroke", "#9C7224"); l.setAttribute("stroke-dasharray", "2 7"); l.setAttribute("stroke-width", "6"); });
      [["#panL", 98], ["#panR", 702]].forEach(([s, cx]) => {
        const g = A.querySelector(s), es = g.querySelectorAll("ellipse");
        es[0].setAttribute("rx", 150); es[0].setAttribute("ry", 30); es[0].setAttribute("fill", "url(#b2-brass)"); es[0].setAttribute("stroke", "#7A5418"); es[0].setAttribute("stroke-width", "2.5");
        es[1].setAttribute("rx", 132); es[1].setAttribute("ry", 17); es[1].setAttribute("fill", "#C9952F"); es[1].setAttribute("opacity", ".45");
        g.querySelector("path").remove();
        // зона за докосване – цялото блюдо с товара
        g.insertAdjacentHTML("beforeend", `<rect class="pan-hit" x="${cx - 155}" y="220" width="310" height="200" rx="30" fill="transparent"/><g class="pan-mark"></g>`);
      });
      this.plate.hidden = true;   // въпросът е в лентата горе – табелата не е нужна
    }
    // ниво 1 и лек/тежък: изборът е с докосване на блюдото (вместо празните квадратчета)
    bindPans(onPick) {
      const pans = [this.panL, this.panR]; this.boxes.innerHTML = "";
      pans.forEach((g, side) => { g.classList.add("pickable"); g.querySelector(".pan-mark").innerHTML = ""; g.onpointerdown = e => { e.preventDefault(); if (this.locked || !g.classList.contains("pickable")) return; onPick(side); }; });
    }
    markPan(side, ok) {
      const g = [this.panL, this.panR][side], cx = side ? 702 : 98;
      g.querySelector(".pan-mark").innerHTML = `<circle cx="${cx}" cy="250" r="30" fill="${ok ? "#4CAF50" : "#E0715E"}" stroke="#fff" stroke-width="5"/>` +
        (ok ? `<path d="M${cx - 13} 251 l9 9 l17 -19" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="M${cx - 11} 239 l22 22 M${cx + 11} 239 l-22 22" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`);
      [this.panL, this.panR].forEach(x => x.classList.remove("pickable"));
    }
    // Наклон: по-тежкото блюдо слиза. deg > 0 → лявото надолу.
    tilt(deg) {
      if (LOOK2()) {   // плавно (CSS преход), без рязко
        const dy = Math.sin(deg * Math.PI / 180) * ARM;
        this.beam.removeAttribute("transform"); this.beam.style.transform = `rotate(${-deg}deg)`;
        this.panL.style.transform = `translateY(${dy.toFixed(1)}px)`; this.panR.style.transform = `translateY(${(-dy).toFixed(1)}px)`; return;
      }
      this.beam.setAttribute("transform", `rotate(${-deg} ${PIVOT.x} ${PIVOT.y})`);
      const rad = deg * Math.PI / 180, dy = Math.sin(rad) * ARM;
      this.panL.setAttribute("transform", `translate(0 ${dy.toFixed(1)})`); this.panR.setAttribute("transform", `translate(0 ${(-dy).toFixed(1)})`);
    }
    startRound() {
      this.boxes.innerHTML = ""; [this.panL, this.panR].forEach(g => { g.classList.remove("pickable"); const m = g.querySelector(".pan-mark"); if (m) m.innerHTML = ""; }); this.ring.hidden = true; this.ring.className = "ring-sign"; this.loadL.innerHTML = ""; this.loadR.innerHTML = "";
      this.tilt(0);
      const u = this.unit();
      if (u && u.wl) this.roundWeights(u); else if (this.level === 1) this.roundPiles(); else this.roundNumbers();
    }
    // ---- лек / тежък (Ч14 Р4, банка): по един предмет във всяко блюдо, в еднакъв размер; везната стои права до отговора ----
    roundWeights(u) {
      const heavy = u.ask === "heavy", word = heavy ? "по-тежко" : "по-леко", hs = u.heavy === "l" ? 0 : 1, okSide = heavy ? hs : 1 - hs;
      // конфликтна двойка (u.big): по-лекият предмет е нарисуван по-голям – проверява заблудата „по-голямо = по-тежко“
      const sz = side => !u.big ? 148 : (u.big === side ? 190 : 104);
      const img = (p, cx, side) => `<image href="assets/img/${p}.png?v=p2" x="${cx - sz(side) / 2}" y="${376 - sz(side)}" width="${sz(side)}" height="${sz(side)}"/>`;
      this.current = { text: `${word}: ${u.wl.split("_").pop()} / ${u.wr.split("_").pop()}`, answer: [u.wl, u.wr][okSide].split("_").pop() };
      this.loadL.innerHTML = img(u.wl, 98, "l"); this.loadR.innerHTML = img(u.wr, 702, "r");
      this.plate.textContent = word.toUpperCase(); this.shell.setLabel(`Кое е ${word}?`); this.prompt(`Кое е ${word}?`);
      if (LOOK2()) return this.bindPans(side => {
        const ok = side === okSide;
        if (!this.answer(ok, { text: this.current.text, answer: this.current.answer, given: [u.wl, u.wr][side].split("_").pop() })) return;
        const last = this.log[this.log.length - 1]; if (last) last.size_weight_conflict = !!u.big;
        this.tilt(hs === 0 ? 10 : -10); this.markPan(okSide, true); if (!ok) this.markPan(side, false);
        if (ok) { this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1600); }
        else { this.shell.flash(`Виж везната: ${word} е другото.`, "bad"); this.say(`Не. Виж везната. ${word[0].toUpperCase() + word.slice(1)} е другото.`); this.advance(2600); }
      });
      this.boxes.innerHTML = `<button type="button" class="abox" data-side="0" aria-label="Лявото блюдо"></button><button type="button" class="abox" data-side="1" aria-label="Дясното блюдо"></button>`;
      const boxes = [...this.boxes.children];
      boxes.forEach(btn => btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        const side = Number(btn.dataset.side), ok = side === okSide;
        if (!this.answer(ok, { text: this.current.text, answer: this.current.answer, given: [u.wl, u.wr][side].split("_").pop() })) return;
        const last = this.log[this.log.length - 1]; if (last) last.size_weight_conflict = !!u.big;   // конфликтна двойка: по-голямото на вид е по-лекото
        boxes.forEach(x => x.disabled = true); this.tilt(hs === 0 ? 10 : -10);   // след отговора тежкото блюдо слиза
        boxes[okSide].innerHTML = CHECK; boxes[okSide].classList.add("right");
        if (ok) { this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1400); }
        else { boxes[side].innerHTML = CROSS; boxes[side].classList.add("wrong"); this.shell.flash(`Виж везната: ${word} е другото.`, "bad"); this.say(`Не. Виж везната. ${word[0].toUpperCase() + word.slice(1)} е другото.`); this.advance(2600); }
      }));
    }
    // ---- ниво 1 ----
    roundPiles() {
      const u = this.unit();
      let more = Math.random() < 0.5, a, b;
      if (u) { a = u.l; b = u.r; if (u.ask) more = u.ask === "more"; }
      else {
        const minDiff = this.adapt > 0 ? 1 : this.adapt < 0 ? 4 : 1, maxDiff = this.adapt > 0 ? 2 : this.adapt < 0 ? 8 : 6;
        do { a = 1 + rnd(MAXPILE); b = 1 + rnd(MAXPILE); } while (a === b || Math.abs(a - b) < minDiff || Math.abs(a - b) > maxDiff);
      }
      const name = LOOK2() ? G2[rnd(G2.length)] : OBJS[rnd(OBJS.length)];
      const okSide = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
      const word = more ? "Повече" : "По-малко";
      this.current = { text: `${word}: ${a} или ${b}`, answer: [a, b][okSide] };
      this.shell.setLabel(`Къде са ${word.toLowerCase()}?`); this.prompt(`Къде са ${word.toLowerCase()}?`);
      this.loadL.innerHTML = loadSvg(name, a, 98, b); this.loadR.innerHTML = loadSvg(name, b, 702, a);
      // везната се накланя към по-тежкото блюдо (пропорционално на разликата)
      this.plate.textContent = word.toUpperCase();
      if (LOOK2()) return this.bindPans(side => {
        const ok = side === okSide;
        if (!this.answer(ok, { text: this.current.text, answer: this.current.answer, given: [a, b][side] })) return;
        this.tilt(Math.max(-12, Math.min(12, (a - b) * 2)));   // след отговора: по-пълното блюдо леко слиза
        this.markPan(okSide, true); if (!ok) this.markPan(side, false);
        if (ok) { this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1500); }
        else { this.shell.flash(`Тук са ${[a, b][side]}, а тук ${[a, b][okSide]}. ${word} са ${[a, b][okSide]}.`, "bad"); this.say(`Не. Тук са ${[a, b][side]}, а тук ${[a, b][okSide]}. ${word} са ${[a, b][okSide]}.`); this.advance(2600); }
      });
      this.boxes.innerHTML = `<button type="button" class="abox" data-side="0" aria-label="Лявото блюдо"></button><button type="button" class="abox" data-side="1" aria-label="Дясното блюдо"></button>`;
      const boxes = [...this.boxes.children];
      boxes.forEach(btn => btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        const side = Number(btn.dataset.side), ok = side === okSide;
        if (!this.answer(ok, { text: this.current.text, answer: this.current.answer, given: [a, b][side] })) return;
        boxes.forEach(x => x.disabled = true);
        boxes[okSide].innerHTML = CHECK; boxes[okSide].classList.add("right");
        if (ok) { this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1200); }
        else {
          boxes[side].innerHTML = CROSS; boxes[side].classList.add("wrong");
          this.shell.flash(`Тук са ${[a, b][side]}, а тук ${[a, b][okSide]}. ${word} са ${[a, b][okSide]}.`, "bad");
          this.say(`Не. Тук са ${[a, b][side]}, а тук ${[a, b][okSide]}. ${word} са ${[a, b][okSide]}.`);
          this.advance(2600);
        }
      }));
    }
    // ---- ниво 2 ----
    roundNumbers() {
      const u = this.unit();
      let a = rnd(this.range + 1), b = rnd(this.range + 1);
      if (u) { a = u.l; b = u.r; }
      else {
        if (this.adapt > 0 && Math.random() < 0.5) b = Math.min(this.range, Math.max(0, a + (rnd(3) - 1)));
        if (this.adapt < 0) { while (Math.abs(a - b) < 2 && this.range >= 3) b = rnd(this.range + 1); }
      }
      const rel = a > b ? ">" : a < b ? "<" : "=";
      const words = { ">": "по-голямо от", "<": "по-малко от", "=": "равно на" };
      this.current = { text: `${a} ? ${b}`, answer: rel };
      this.shell.setLabel("Сравни числата"); this.prompt(`Сравни числата: ${a} и ${b}`);
      this.loadL.innerHTML = numSvg(a, 98); this.loadR.innerHTML = numSvg(b, 702);
      this.ring.hidden = false; this.ring.textContent = "?";
      this.plate.textContent = "СРАВНИ";
      this.boxes.innerHTML = `<button type="button" class="abox sign" data-rel=">" aria-label="По-голямо">&gt;</button><button type="button" class="abox sign" data-rel="=" aria-label="Равно">=</button><button type="button" class="abox sign" data-rel="<" aria-label="По-малко">&lt;</button>`;
      const btns = [...this.boxes.children];
      btns.forEach(btn => btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        const given = btn.dataset.rel, ok = given === rel;
        if (!this.answer(ok, { text: this.current.text, answer: rel, given })) return;
        btns.forEach(x => x.disabled = true);
        this.ring.textContent = given; this.ring.classList.add(ok ? "right" : "wrong");
        const okBtn = btns.find(x => x.dataset.rel === rel); okBtn.classList.add("right");
        if (ok) { this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1300); }
        else { btn.classList.add("wrong"); this.shell.flash(`${a} е ${words[rel]} ${b}`, "bad"); this.say(`Не. ${a} е ${words[rel]} ${b}`); setTimeout(() => { this.ring.textContent = rel; this.ring.className = "ring-sign right"; }, 900); this.advance(2500); }
      }));
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.intellectScales = {
    id: "intellectScales", name: "Умни везни", skill: "Повече и по-малко", top: "pink", cls: ScalesGame,
    tiers: [0, 1, 2],
    task: s => Number(s.level) === 2 ? "Сравни числата и избери знака: по-голямо, равно или по-малко." : "Определи къде предметите са повече или по-малко.",
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 2, def: 1, help: "Ниво 1: сравняване на количества върху везната. Ниво 2: сравняване на числа със знак." },
      { key: "range", label: "Диапазон на смятане", type: "select", options: [3, 5, 10, 20], def: 3, help: "Най-голямото число на ниво 2." },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 25, def: 4 }
    ],
    paramsLine: s => `${s.examples} примера` + (Number(s.level) === 2 ? ` · числа до ${s.range}` : "")
  };
})();
