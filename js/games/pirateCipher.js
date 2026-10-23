/* Пиратски шифър — по кода им (27.js): Ниво 1..2, Размер на полето 3x3/4x4/5x5, Брой примери 4..10.
   На полето има начални предмети (3x3: 2–3, 4x4: 3–4, 5x5: 4–6). Задачата: [предмет] [на/над/под/вляво/вдясно] [предмет на полето].
   Ниво 1: на, над, под („на“ = върху камъка в същата клетка); Ниво 2: и вляво/вдясно. Предметът се влачи от страничния панел
   върху клетката; при вярно остава на полето и идва следваща задача.
   Домашна (MATH_BANK, tools/math_banks/pirateCipher.py): задачите идват от слота на рунда вместо случайно.
   Единица: { n: 3, dir: "над", place: "obj/apple", ref: 4, items: [[4, "obj/pumpkin"], [0, "obj/pear"]] }
     n – размер на полето; ref – клетка (ред по ред, от 0) на опорния предмет, той е сред items; целта се смята от ref и dir
     („на“ – същата клетка, опорният предмет е камък). Едно решение на задача: първият опит (first_attempt_correct). */
(function () {
  // 19.10: градински предмети (рисуваните картинки на платформата) вместо риби; „на“ – върху пън или камък
  const FISH = ["p/yabalka", "p/krusha", "p/yagoda", "p/chereshi", "p/morkov", "p/tikva", "p/gaba", "p/grozde",
    "p/lale", "p/roza", "p/iglika", "p/peperuda", "p/pchela", "p/patitsa", "p/zhaba", "p/zayche"];
  const ROCKS = ["p/pan", "p/kamak"];
  const INIT = { 3: [2, 3], 4: [3, 4], 5: [4, 6] };
  const DIRS = { "на": [0, 0], "над": [0, -1], "под": [0, 1], "вляво от": [-1, 0], "вдясно от": [1, 0] };
  const NAME = { "p/yabalka": "ябълката", "p/krusha": "крушата", "p/yagoda": "ягодата", "p/chereshi": "черешите", "p/morkov": "моркова", "p/tikva": "тиквата", "p/gaba": "гъбата", "p/grozde": "гроздето",
    "p/lale": "лалето", "p/roza": "розата", "p/iglika": "игликата", "p/peperuda": "пеперудата", "p/pchela": "пчелата", "p/patitsa": "птичката", "p/zhaba": "жабата", "p/zayche": "зайчето", "p/pan": "пъна", "p/kamak": "камъка" };
  const nm = f => NAME[f] || "предмета";
  // старите банки (obj/…, fish_…, rock_…) – към новите предмети
  const OLD = { "obj/apple": "p/yabalka", "obj/pear": "p/krusha", "obj/strawberry": "p/yagoda", "obj/cherries": "p/chereshi", "obj/carrot": "p/morkov", "obj/pumpkin": "p/tikva", "obj/mushroom": "p/gaba", "obj/grapes": "p/grozde",
    "obj/lemon": "p/lale", "obj/banana": "p/roza", "obj/orange": "p/iglika", "obj/corn": "p/peperuda", "obj/tomato": "p/pchela", "obj/watermelon": "p/patitsa", "obj/pineapple": "p/zhaba", "rock_a": "p/pan", "rock_b": "p/kamak" };
  const nw = f => OLD[f] || f;
  const img = (f, st) => `<img src="${f.startsWith("p/") ? `assets/img/garden/${f.slice(2)}.png` : `assets/img/${f}.png?v=p2`}" alt="" draggable="false"${st ? ` style="${st}"` : ""}>`;
  const targetOf = u => { const [dx, dy] = DIRS[u.dir], x = u.ref % u.n + dx, y = Math.floor(u.ref / u.n) + dy; return (x < 0 || y < 0 || x >= u.n || y >= u.n) ? -1 : y * u.n + x; };
  class PirateCipherGame extends BaseGame {
    get gameId() { return "pirateCipher"; }
    get skillName() { return "Ориентиране: на, над, под, вляво, вдясно"; }
    start() {
      MATH_BANK.attach(this).then(() => {
        const mb = this.mb;
        if (mb && !mb.units.length) this.mb = null;
        else if (mb && mb.set === "practice" && mb.def.items) this.total = Math.min(mb.def.items, mb.units.length);
        super.start();
      });
    }
    render() {
      const u0 = this.mb && this.mb.units[0];
      this.level = u0 ? Number(this.mb.def.level || 1) : Number(this.s.level || 1);
      this.n = u0 ? u0.n : Number((this.s.field || "3x3")[0]);
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-chartroom"/></svg>
        <div class="pc"><div class="pc-task" id="pc-task"></div><div class="pc-mid"><div class="pc-palette" id="pal-l"></div><div class="pc-grid" id="pc-grid"></div><div class="pc-palette" id="pal-r"></div></div></div>`;
      this.grid = this.shell.arena.querySelector("#pc-grid"); this.taskEl = this.shell.arena.querySelector("#pc-task");
      const pl = this.shell.arena.querySelector("#pal-l"), pr = this.shell.arena.querySelector("#pal-r");
      FISH.forEach((f, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "pc-bubble"; b.dataset.f = f; b.innerHTML = img(f); b.addEventListener("pointerdown", e => this.dragStart(e, b)); (i < 8 ? pl : pr).appendChild(b); });
      this.buildGrid(this.n);
    }
    buildGrid(n) {
      this.n = n; this.grid.style.setProperty("--n", n); this.grid.innerHTML = ""; this.cells = [];
      for (let i = 0; i < n * n; i++) { const c = document.createElement("div"); c.className = "pc-cell"; c.dataset.i = i; this.grid.appendChild(c); this.cells.push(c); }
    }
    // свободна игра: случайна задача със същата форма като единицата от банката
    genUnit() {
      const n = this.n, [mn, mx] = INIT[n], count = mn + rnd(mx - mn + 1);
      const dirs = this.level === 1 ? ["над", "под"] : ["над", "под", "вляво от", "вдясно от"];   // 19.10: без „на“
      for (let tries = 0; tries < 300; tries++) {
        const cells = new Set(); while (cells.size < count) cells.add(rnd(n * n));
        const pool = shuffle(FISH.slice()), list = [...cells], dir = dirs[rnd(dirs.length)], ref = list[rnd(list.length)];
        const items = list.map((c, k) => [c, c === ref && dir === "на" ? ROCKS[rnd(2)] : pool[k]]);
        const u = { n, dir, place: pool[count], ref, items }, t = targetOf(u);
        if (t >= 0 && (dir === "на" || !cells.has(t))) return u;
      }
      return { n, dir: "под", place: FISH[0], ref: 0, items: [[0, FISH[1]]] };
    }
    startRound() {
      let u = (this.mb && this.mb.units[this.idx]) || this.genUnit();
      u = Object.assign({}, u, { place: nw(u.place), items: u.items.map(([c, f]) => [c, nw(f)]) });
      if (u.n !== this.n) this.buildGrid(u.n);
      this.cells.forEach(c => { c.innerHTML = ""; c.className = "pc-cell"; c.dataset.f = ""; });
      u.items.forEach(([idx, f]) => { this.cells[idx].dataset.f = f; this.cells[idx].innerHTML = img(f); });
      this.unit = u; this.stepWrong = 0; this.target = targetOf(u); this.place = u.place; this.refFish = this.cells[u.ref].dataset.f;
      const dir = u.dir;
      this.current = { text: `${u.place} ${dir} ${this.refFish}`, answer: String(this.target) };
      this.taskEl.innerHTML = `${img(u.place)}<b>${dir}</b>${img(this.refFish)}`;
      this.shell.setLabel("");   // задачата е в картинката горе – лентата не е нужна (методист 19.10)
      const a = nm(u.place), b = nm(this.refFish);
      this.prompt(`Сложи ${a} ${dir} ${b}`);   // без автоматичен глас в играта
    }
    dragStart(e, btn) {
      if (this.locked) return; e.preventDefault();
      const ghost = document.createElement("img"); ghost.src = btn.querySelector("img").src; ghost.className = "pc-ghost"; document.body.appendChild(ghost);
      const move = ev => { ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; };
      move(e);
      const up = ev => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); ghost.remove(); const el = document.elementFromPoint(ev.clientX, ev.clientY); const cell = el && el.closest(".pc-cell"); if (cell) this.drop(btn.dataset.f, cell); };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    }
    drop(f, cell) {
      const i = Number(cell.dataset.i), on = this.unit.dir === "на";
      if (this.locked || (cell.dataset.f && !on) || cell.classList.contains("right")) return;
      const bad = msg => { cell.classList.add("wrong"); this.shell.flash(msg, "bad"); this.say(msg); setTimeout(() => { cell.classList.remove("wrong"); this.shell.hideFlash(); }, 800); this.miss(cell); };
      if (f !== this.place) return bad("Не този предмет");
      if (i !== this.target) return bad("Не тук");
      if (!this.answer(true, { text: this.current.text, answer: this.current.answer, given: cell.dataset.i, first_attempt_correct: this.stepWrong === 0, attempt_count: this.stepWrong + 1 })) return;
      if (on) cell.innerHTML = img(cell.dataset.f, "grid-area:1/1") + img(f, "grid-area:1/1;width:58%;transform:translateY(-14%)");
      else { cell.dataset.f = f; cell.innerHTML = img(f); }
      cell.classList.add("right");
      this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1400);
    }
    miss(cell) {
      // грешен опит: брои се като грешка, но задачата остава, за да я довърши; събитието пази първия опит
      this.stepWrong++;
      if (this.tier === 0) { this.answer(false, { text: this.current.text, answer: this.current.answer, given: cell.dataset.i, first_attempt_correct: false, attempt_count: this.stepWrong }); return; }
      this.livesLeft--; this.renderLives(); this.wrong++; this.streak = 0;
      if (this.livesLeft < 0) { this.answer(false, { text: this.current.text, answer: this.current.answer, given: cell.dataset.i, first_attempt_correct: false, attempt_count: this.stepWrong }); return; }
      this.cells[this.target].classList.add("hint");
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.pirateCipher = {
    id: "pirateCipher", name: "Пиратски шифър", skill: "Ориентиране в поле", top: "deadtree", cls: PirateCipherGame, tiers: [0, 1, 2],
    task: "Подреди предметите на игралното поле според задачата.",
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 2, def: 1, help: "Ниво 1: над и под. Ниво 2: и вляво от, вдясно от." },
      { key: "field", label: "Размер на полето", type: "cycle", options: [["3x3", "3x3"], ["4x4", "4x4"], ["5x5", "5x5"]], def: "3x3" },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 10, def: 4 }
    ],
    paramsLine: s => `${s.examples} примера · поле ${s.field}`
  };
})();
