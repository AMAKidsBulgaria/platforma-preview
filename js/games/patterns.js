/* Закономерности (patterns, M1): редица от цветове, фигури или предмети и празно място „?“ накрая; детето докосва какво следва.
   Ниво 1 – АБАБ (цвят или фигура); ниво 2 – ААББ или АБВ. Една задача = едно решение (първият опит); при грешка – опит отново,
   след 2 грешки вярният отговор мига. Домашна (MATH_BANK, tools/math_banks/patterns.py): задачите идват от слота на рунда
   (Ч1 Р2 – упражнение). Свободна игра: ниво, вид на елементите и брой примери от настройките.
   Единица: { rule: "AB" | "AABB" | "ABC", seq: ["c:red", "c:blue", "c:red", "c:blue"], answer: "c:red", opts: ["c:red", "c:blue", "c:green"] }
   Елемент: "c:<цвят>" – цветен кръг, "s:<фигура>" – фигура, "o:<предмет>" – картинка assets/img/obj/<предмет>.png. */
(function () {
  const COLORS = { red: ["#E2493F", "червено"], blue: ["#2F7FE0", "синьо"], yellow: ["#F5C320", "жълто"], green: ["#22A56A", "зелено"], purple: ["#8E5CE0", "лилаво"] };
  const SHAPES = { circle: "кръг", square: "квадрат", triangle: "триъгълник", star: "звезда" };
  // комплекти (решение 25.10): форми – основен; плодове и зеленчуци; животни. Картинките – еднакъв размер, изглед отпред, без сенки (assets/img/pt)
  const OBJS = { apple: "ябълка", pear: "круша", banana: "банан", strawberry: "ягода", lemon: "лимон", cherries: "череши", carrot: "морков", tomato: "домат" };
  const ANIMALS = { cat: "котка", dog: "куче", rabbit: "зайче", bear: "мече", chick: "пиленце", frog: "жабка" };
  const LOOKALIKE = [["apple", "tomato"]];   // в една редица – не двата заедно (детето да не ги бърка)
  const SHAPE_SVG = {
    circle: '<circle cx="50" cy="50" r="40"/>', square: '<rect x="12" y="12" width="76" height="76" rx="8"/>',
    triangle: '<path d="M50 8 L92 88 L8 88 Z"/>', star: '<path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z"/>'
  };
  const KINDS = { c: Object.keys(COLORS), s: Object.keys(SHAPES), o: Object.keys(OBJS), a: Object.keys(ANIMALS) };
  const tok = t => {
    const [k, v] = t.split(":");
    if (k === "c") return `<span class="pt-tok pt-c" style="--c:${COLORS[v][0]}"></span>`;
    if (k === "s") return `<span class="pt-tok pt-s"><svg viewBox="0 0 100 100" aria-hidden="true">${SHAPE_SVG[v]}</svg></span>`;
    return `<span class="pt-tok pt-o"><img src="assets/img/pt/${v}.webp?v=1" alt="" draggable="false"></span>`;
  };
  const word = t => { const [k, v] = t.split(":"); return k === "c" ? COLORS[v][1] : k === "s" ? SHAPES[v] : k === "a" ? ANIMALS[v] : OBJS[v]; };
  const RULES = { AB: [0, 1], AABB: [0, 0, 1, 1], ABC: [0, 1, 2] };
  const LEVEL = { AB: 1, AABB: 2, ABC: 2 };

  class PatternsGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.examples) || 6; }
    get gameId() { return "patterns"; } get skillName() { return "Закономерност"; }
    start() {
      MATH_BANK.attach(this).then(() => {
        const mb = this.mb;
        if (mb && !mb.units.length) this.mb = null;
        else if (mb && mb.set === "practice" && mb.def.items) this.total = Math.min(mb.def.items, mb.units.length);
        super.start();
      });
    }
    render() { this.scene("wt-pt", "scene-island"); this.shell.setLabel("Какво следва?"); this.lastKey = ""; }
    // свободна игра: случайна редица по нивото и вида от настройките
    genUnit() {
      // „Форми“ – редица по цвят ИЛИ по фигура (никога и двете); „Смесено“ – различен комплект между задачите, но в една редица – един комплект и един признак
      const lvl = Number(this.s.level) || 1, ks = this.s.kind || "s", kindSet = ks === "mix" ? null : ks;
      let u;
      for (let t = 0; t < 20; t++) {
        const rule = lvl === 1 ? "AB" : (rnd(2) ? "AABB" : "ABC");
        const pool = kindSet === "s" ? ["c", "s"] : kindSet ? [kindSet] : lvl === 1 ? ["c", "s", "o"] : ["c", "s", "o", "a"], kind = pool[rnd(pool.length)];
        let pick; do { pick = shuffle(KINDS[kind].slice()).slice(0, 3); } while (LOOKALIKE.some(([x, y]) => pick.includes(x) && pick.includes(y)));
        const vals = pick.map(v => `${kind}:${v}`), r = RULES[rule];
        const len = rule === "AB" ? 4 + rnd(2) : rule === "AABB" ? 5 + rnd(2) : 5 + rnd(2);
        const full = Array.from({ length: len + 1 }, (_, i) => vals[r[i % r.length]]);
        u = { rule, seq: full.slice(0, len), answer: full[len], opts: vals.slice(0, 3) }; // АБ/ААББ: двата елемента + един чужд; АБВ: трите
        const key = u.seq.join() + u.answer; if (key !== this.lastKey) { this.lastKey = key; break; }
      }
      return u;
    }
    startRound() {
      this.stepWrong = 0;
      const u = (this.mb && this.mb.units[this.idx]) || this.genUnit(); this.unit = u; this.level = LEVEL[u.rule] || 1; const mi = this.modeInfo(), ttl = document.getElementById("game-title"); if (mi && ttl && !document.documentElement.classList.contains("look2") && !document.documentElement.classList.contains("home2")) ttl.textContent = mi[0]; // заглавието следва правилото на задачата
      this.opts = shuffle(u.opts.slice());
      this.box.innerHTML = `<div class="pt-row">${u.seq.map(tok).join("")}<span class="pt-tok pt-q" id="pt-q">?</span></div><div class="pcards pt-opts">${this.opts.map(o => `<button type="button" class="wtile pt-opt">${tok(o)}</button>`).join("")}</div>`;
      [...this.box.querySelectorAll(".pt-opt")].forEach((b, i) => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b, this.opts[i]); }));
      this.prompt(`${u.seq.map(word).join(", ")}. Какво следва?`);
    }
    tap(b, o) {
      if (this.finished || this.locked || b.classList.contains("bad")) return;
      const u = this.unit, text = u.seq.join(" ") + " ?";
      if (o === u.answer) {
        b.classList.add("good"); const q = this.box.querySelector("#pt-q"); q.outerHTML = tok(o).replace("pt-tok", "pt-tok pt-new");
        this.box.querySelectorAll(".pt-opt:not(.good)").forEach(x => x.classList.add("used"));
        this.done(text);
        const last = this.log[this.log.length - 1]; if (last) Object.assign(last, { answer: u.answer, given: o, rule: u.rule });
      } else {
        this.miss(text, o); b.classList.add("bad"); this.shake(b);
        this.shell.flash("Виж редицата още веднъж", "bad"); this.say(`Не е ${word(o)}. Виж кое се повтаря.`); this.later(() => this.shell.hideFlash(), 1300);
        if (this.stepWrong >= 2) [...this.box.querySelectorAll(".pt-opt")].forEach((x, i) => { if (this.opts[i] === u.answer) x.classList.add("hint"); });
      }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.patterns = {
    id: "patterns", name: "Закономерност", skill: "Закономерност", top: "palm", cls: PatternsGame, tiers: [0, 1, 2],
    task: s => Number(s.level) === 2 ? "Продължи редицата: ААББ или АБВ. Докосни какво следва." : "Продължи редицата АБАБ. Докосни какво следва.",
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 2, def: 1, help: "Ниво 1: АБАБ (цвят или фигура). Ниво 2: ААББ и АБВ." },
      { key: "kind", label: "Елементи", type: "cycle", options: [["s", "Форми"], ["o", "Плодове"], ["a", "Животни"], ["mix", "Смесено"]], def: "s", help: "Форми – основният комплект (по цвят или по фигура). Смесено – различен комплект между задачите; в една редица винаги един комплект и един признак." },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 10, def: 6 }
    ],
    paramsLine: s => `${s.examples || 6} редици · ниво ${s.level || 1}`
  };
})();
