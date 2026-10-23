/* Субитизация (subitize, M2, надграждане): карта с точки – като на зар, в редица или в рамка от 5 (10) – и три числа отдолу;
   детето докосва колко са точките. Точките остават видими (може да брои); само ако settings.flash > 0 картата се скрива след
   толкова милисекунди (при грешка се показва пак). Една задача = едно решение (първият опит).
   Домашна (MATH_BANK, tools/math_banks/subitize.py): задачите идват от слота на рунда (Ч5 Р2 – упражнение до 5).
   Единица: { n: 4, layout: "dice" | "row" | "frame5" | "frame10", opts: [3, 4, 5] } */
(function () {
  const DICE = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const NUM = ["нула", "една", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет", "десет"];
  const dots = (k, on) => Array.from({ length: k }, (_, i) => `<span class="sb-cell">${on(i) ? '<i class="sb-dot"></i>' : ""}</span>`).join("");
  function card(u) {
    if (u.layout === "dice" && DICE[u.n]) return `<div class="sb-card sb-dice">${dots(9, i => DICE[u.n].includes(i))}</div>`;
    if (u.layout === "row") return `<div class="sb-card sb-row">${dots(u.n, () => true)}</div>`;
    const k = u.layout === "frame10" || u.n > 5 ? 10 : 5;
    return `<div class="sb-card sb-frame${k === 10 ? " ten" : ""}">${dots(k, i => i < u.n)}</div>`;
  }
  class SubitizeGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.examples) || 6; }
    get gameId() { return "subitize"; } get skillName() { return "Колко са? (субитизация)"; }
    start() {
      MATH_BANK.attach(this).then(() => {
        const mb = this.mb;
        if (mb && !mb.units.length) this.mb = null;
        else if (mb && mb.set === "practice" && mb.def.items) this.total = Math.min(mb.def.items, mb.units.length);
        super.start();
      });
    }
    render() { this.scene("wt-sb", "scene-beach"); this.shell.setLabel("Колко са точките?"); this.lastN = 0; }
    // свободна игра: число 1..max, подреждане от настройките
    genUnit() {
      const max = Math.max(2, Math.min(10, Number(this.s.max) || 5)); let n;
      do n = 1 + rnd(max); while (n === this.lastN && max > 1);
      this.lastN = n;
      const want = this.s.layout && this.s.layout !== "mix" ? this.s.layout : ["dice", "row", "frame"][rnd(3)];
      let layout = want === "frame" ? (max > 5 ? "frame10" : "frame5") : want;
      if (layout === "dice" && !DICE[n]) layout = "frame10";
      let lo = Math.max(1, Math.min(n - 1 - rnd(2), max - 2)); if (lo + 2 < n) lo = n - 2;
      return { n, layout, opts: [lo, lo + 1, lo + 2] };
    }
    startRound() {
      this.stepWrong = 0; clearTimeout(this.flashT);
      const u = (this.mb && this.mb.units[this.idx]) || this.genUnit(); this.unit = u;
      this.box.innerHTML = `<div class="sb-wrap" id="sb-wrap">${card(u)}<span class="sb-cover">?</span></div><div class="pcards sb-opts">${u.opts.map(o => `<button type="button" class="wtile sb-opt">${o}</button>`).join("")}</div>`;
      [...this.box.querySelectorAll(".sb-opt")].forEach((b, i) => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b, u.opts[i]); }));
      const fl = Number(this.s.flash) || 0;
      if (fl > 0) this.flashT = this.later(() => this.box.querySelector("#sb-wrap").classList.add("hidden"), fl);
      this.prompt("Колко са точките?");
    }
    tap(b, o) {
      if (this.finished || this.locked || b.classList.contains("bad")) return;
      const u = this.unit, text = `${u.n} (${u.layout})`, w = this.box.querySelector("#sb-wrap");
      if (o === u.n) {
        clearTimeout(this.flashT); w.classList.remove("hidden"); b.classList.add("good");
        this.box.querySelectorAll(".sb-opt:not(.good)").forEach(x => x.classList.add("used"));
        this.done(text); const last = this.log[this.log.length - 1]; if (last) Object.assign(last, { answer: String(u.n), given: String(o), layout: u.layout });
      } else {
        this.miss(text, String(o)); b.classList.add("bad"); this.shake(b); w.classList.remove("hidden");
        this.shell.flash("Преброй пак", "bad"); this.say(o === 1 ? "Не е една. Преброй точките." : `Не са ${NUM[o] || o}. Преброй точките.`); this.later(() => this.shell.hideFlash(), 1300);
        if (this.stepWrong >= 2) [...this.box.querySelectorAll(".sb-opt")].forEach((x, i) => { if (u.opts[i] === u.n) x.classList.add("hint"); });
      }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.subitize = {
    id: "subitize", name: "Субитизация", skill: "Колко са? (субитизация)", top: "palm", cls: SubitizeGame, tiers: [0, 1, 2],
    task: s => Number(s.flash) > 0 ? "Точките се показват за кратко. Докосни колко са." : "Погледни точките и докосни колко са.",
    settings: [
      { key: "max", label: "До число", type: "range", min: 3, max: 10, def: 5 },
      { key: "layout", label: "Подреждане", type: "cycle", options: [["mix", "Смесено"], ["dice", "Като на зар"], ["row", "В редица"], ["frame", "В рамка"]], def: "mix" },
      { key: "flash", label: "Показване", type: "cycle", options: [["0", "Остават видими"], ["2000", "2 секунди"], ["1200", "1,2 секунди"]], def: "0", help: "По подразбиране точките остават и детето може да брои." },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 10, def: 6 }
    ],
    paramsLine: s => `${s.examples || 6} карти · до ${s.max || 5}` + (Number(s.flash) > 0 ? " · за кратко" : "")
  };
})();
