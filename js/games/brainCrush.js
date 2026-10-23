/* Главоблъсканица — по кода им (25.js): Ниво 1..2, Брой примери 4..25, Диапазон 10/20, Действие.
   Ниво 1: две групи картинки върху облачета и знак между тях; Ниво 2: примерът с числа.
   Отговор: 4 бутона на масата (верният + 3 различни). Проверено на живо: след избор идва следваща задача. */
(function () {
  // 19.10: плодове и зеленчуци от градината в плетени табли (вместо риби); старите имена от банките се превеждат
  const OBJS = ["g/yabalka", "g/krusha", "g/yagoda", "g/chereshi", "g/morkov", "g/tikva", "g/gaba", "g/grozde"];
  const OLDO = { "obj/apple": "g/yabalka", "obj/pear": "g/krusha", "obj/strawberry": "g/yagoda", "obj/cherries": "g/chereshi", "obj/carrot": "g/morkov", "obj/pumpkin": "g/tikva", "obj/mushroom": "g/gaba", "obj/grapes": "g/grozde" };
  const src = n => { n = OLDO[n] || n; return n.startsWith("g/") ? `assets/img/garden_r/${n.slice(2)}.png?v=2` : `assets/img/${n}.png?v=p2`; };
  function example(range, op, adapt) {
    const kind = op === "mix" ? (Math.random() < 0.5 ? "add" : "sub") : op;
    if (kind === "add") { let a = rnd(range + 1), b = rnd(range - a + 1); if (adapt < 0) { a = rnd(6); b = rnd(Math.min(5, range - a) + 1); } return { a, b, op: "+", answer: a + b }; }
    let a = rnd(range + 1), b = rnd(a + 1); if (adapt < 0) { a = 1 + rnd(Math.min(6, range)); b = rnd(a + 1); } return { a, b, op: "−", answer: a - b };
  }
  function choices(answer, range) { const s = new Set([answer]); let g = 0; while (s.size < 4 && g++ < 200) { const v = Math.random() < .6 ? answer + (rnd(2) ? 1 : -1) * (1 + rnd(3)) : rnd(range + 1); if (v >= 0 && v <= range) s.add(v); } return shuffle([...s]); }
  const pics = (name, n) => `<span class="bc-pics" style="--k:${n > 8 ? 5 : n > 6 ? 4 : n > 2 ? Math.ceil(n / 2) : n}">${Array.from({ length: n }, () => `<img src="${src(name)}" alt="" draggable="false">`).join("")}</span>`;
  class BrainCrushGame extends BaseGame {
    get gameId() { return "brainCrush"; }
    get skillName() { return (this.s.op === "sub" ? "Изваждане" : this.s.op === "mix" ? "Събиране и изваждане" : "Събиране") + (Number(this.s.level) === 1 ? " с предмети" : "") + ` до ${this.s.range}`; }
    // Домашна: задачите идват от банката на рунда (config/math-banks.json): {a, op: "+"|"-", b[, obj]}; obj = картинката
    // на ниво 1 (при изваждане и двете облачета са от нея – „5 ябълки, махам 2 ябълки“). Без банка – случайният генератор.
    start() { MATH_BANK.attach(this).then(() => super.start()); }
    render() {
      this.level = Number(this.s.level || 1); this.range = Number(this.s.range || 10);
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-island"/></svg><div class="bc"><div class="bc-task" id="bc-task"></div><div class="bc-desk"><div class="bc-choices" id="bc-choices"></div></div></div>`;
      this.task = this.shell.arena.querySelector("#bc-task"); this.ch = this.shell.arena.querySelector("#bc-choices");
    }
    startRound() {
      const u = this.mb && this.mb.units[this.idx % this.mb.units.length];
      this.ex = u ? { a: u.a, b: u.b, op: u.op === "+" ? "+" : "−", answer: u.op === "+" ? u.a + u.b : u.a - u.b } : example(this.range, this.s.op, this.adapt);
      this.current = { text: `${this.ex.a} ${this.ex.op} ${this.ex.b}`, answer: this.ex.answer };
      const spoken = `${this.ex.a} ${this.ex.op === "+" ? "плюс" : "минус"} ${this.ex.b}`;
      if (this.level === 1) {
        let [n1, n2] = shuffle(OBJS.slice()).slice(0, 2);
        if (u && u.obj) n1 = n2 = u.obj;
        n2 = n1;   // 23.10 (проучване): един вид предмет в задачата – смесените предмети добавят излишно категоризиране
        this.task.innerHTML = `<div class="bc-cloud bc-tray">${this.ex.a ? pics(n1, this.ex.a) : ""}<i class="bc-rim"></i></div><div class="bc-op">${this.ex.op}</div><div class="bc-cloud bc-tray">${this.ex.b ? pics(n2, this.ex.b) : ""}<i class="bc-rim"></i></div>`;
        this.shell.setLabel(""); this.prompt(`${spoken}. Колко стават?`);
      } else { this.task.innerHTML = `<div class="bc-board"><span class="bc-chalk">${this.ex.a} ${this.ex.op} ${this.ex.b} = ?</span></div>`; this.shell.setLabel(""); this.prompt(spoken); }
      this.ch.innerHTML = "";
      choices(this.ex.answer, Math.max(this.range, this.ex.a, this.ex.answer)).forEach(v => { const b = document.createElement("button"); b.type = "button"; b.className = "bc-btn"; b.textContent = v; b.addEventListener("pointerdown", e => { e.preventDefault(); this.pick(v, b); }); this.ch.appendChild(b); });
    }
    pick(v, btn) {
      const ok = v === this.ex.answer;
      if (!this.answer(ok, { text: this.current.text, answer: this.ex.answer, given: v })) return;
      [...this.ch.children].forEach(b => b.disabled = true);
      if (ok) { btn.classList.add("right"); this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1200); }
      else { btn.classList.add("wrong"); [...this.ch.children].find(b => Number(b.textContent) === this.ex.answer).classList.add("right"); this.shell.flash(`${this.current.text} = ${this.ex.answer}`, "bad"); this.say(`Не. ${this.current.text.replace("+", "плюс").replace("−", "минус")} е ${this.ex.answer}`); this.advance(2400); }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.brainCrush = {
    id: "brainCrush", name: "Главоблъсканица", skill: "Действия с предмети", top: "waterfall", cls: BrainCrushGame, tiers: [0, 1, 2],
    task: s => Number(s.level) === 2 ? "Пресметни задачите с числа." : "Преброй предметите и пресметни колко стават.",
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 2, def: 1, help: "Ниво 1: с картинки. Ниво 2: само с числа." },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 25, def: 4 },
      { key: "range", label: "Диапазон на смятане", type: "select", options: [10, 20], def: 10 },
      { key: "op", label: "Избор на действие", type: "cycle", options: [["add", "Събиране"], ["sub", "Изваждане"], ["mix", "Смесено"]], def: "add" }
    ],
    paramsLine: s => `${s.examples} примера · до ${s.range} · ${({ add: "събиране", sub: "изваждане", mix: "смесено" })[s.op]}`
  };
})();
