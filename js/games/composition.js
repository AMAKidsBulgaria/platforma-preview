/* Състав на числата — по генератора от досегашната платформа (28.js):
   Числа 3..20 = числото, което се разлага. Сложност 1 = винаги това число; 2 = случайно от 3 до него.
   Задача: горе цялото число, долу две части; лявата е дадена, дясната се въвежда от клавиатура 0..10 (0..20 при числа над 10).
   Верен: дясният кръг става зелен с числото → следваща задача. Грешен: розов с грешното число, после показваме вярното. Норми 0/1/2. */
(function () {
  class CompositionGame extends BaseGame {
    get gameId() { return "numberComposition"; }
    get skillName() { return `Състав на числата до ${this.s.numbers}`; }
    // Домашна: задачите идват от банката на рунда (config/math-banks.json); задача = две от n/a/b, третото се търси:
    // {n,a} → n е a и ?; {n,b} → n е ? и b; {a,b} → ? е a и b (цялото). Без банка – случайният генератор по-долу.
    start() { MATH_BANK.attach(this).then(() => super.start()); }
    render() {
      this.numbers = Number(this.s.numbers || 3); this.complexity = Number(this.s.complexity || 1);
      this.keys = this.numbers <= 10 ? 10 : 20;
      this.prevPart = null;
      this.shell.arena.innerHTML = `
        <svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-cabin"/></svg>
        <div class="comp">
          <div class="comp-tree">
            <svg class="comp-ropes" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><path d="M200 20 C200 90 110 90 90 190" fill="none" stroke="#3E2A12" stroke-width="7" stroke-dasharray="8 6" stroke-linecap="round"/><path d="M200 20 C200 90 290 90 310 190" fill="none" stroke="#3E2A12" stroke-width="7" stroke-dasharray="8 6" stroke-linecap="round"/></svg>
            <div class="comp-whole" id="whole"><span></span></div>
            <div class="comp-parts"><div class="comp-part" id="partA"><span></span></div><div class="comp-part" id="partB"><span></span></div></div>
          </div>
          <div class="keypad" id="keypad"></div>
        </div>`;
      this.whole = this.shell.arena.querySelector("#whole span"); this.partA = this.shell.arena.querySelector("#partA"); this.partB = this.shell.arena.querySelector("#partB");
      this.keypad = this.shell.arena.querySelector("#keypad"); this.keypad.classList.toggle("wide", this.keys > 10);
      for (let k = 0; k <= this.keys; k++) { const b = document.createElement("button"); b.type = "button"; b.className = "key"; b.textContent = k; b.addEventListener("pointerdown", e => { e.preventDefault(); this.pick(k, b); }); this.keypad.appendChild(b); }
    }
    makeExample() {
      const whole = this.complexity === 1 ? this.numbers : 3 + rnd(this.numbers - 2);
      let p, guard = 0;
      do {
        // адаптивност: +1 избягва тривиалните части (0 и цялото); -1 ги предпочита
        if (this.adapt < 0 && Math.random() < 0.5) p = rnd(2) ? 0 : whole;
        else if (this.adapt > 0 && whole >= 2) p = 1 + rnd(whole - 1);
        else p = rnd(whole + 1);
        guard++;
      } while ((p === this.prevPart || whole - p === this.prevPart) && guard < 20);
      this.prevPart = p;
      return { whole, a: p, b: whole - p };
    }
    bankExample() {
      const u = this.mb.units[this.idx % this.mb.units.length];
      if (u.n == null) return { whole: u.a + u.b, a: u.a, b: u.b, miss: "whole" };
      if (u.a == null) return { whole: u.n, a: u.n - u.b, b: u.b, miss: "a" };
      return { whole: u.n, a: u.a, b: u.n - u.a, miss: "b" };
    }
    startRound() {
      this.ex = this.mb ? this.bankExample() : Object.assign(this.makeExample(), { miss: "b" });
      const ex = this.ex, q = v => ex.miss === v ? "?" : ex[v];
      ex.want = ex[ex.miss];
      this.box = ex.miss === "whole" ? this.whole.parentNode : ex.miss === "a" ? this.partA : this.partB;
      this.current = { text: `${q("whole")} = ${q("a")} + ${q("b")}`, answer: ex.want };
      const wb = this.whole.parentNode; wb.style.background = wb.style.borderColor = ""; this.partA.className = "comp-part"; this.partB.className = "comp-part";
      this.whole.textContent = ex.miss === "whole" ? "" : ex.whole;
      this.partA.querySelector("span").textContent = ex.miss === "a" ? "" : ex.a;
      this.partB.querySelector("span").textContent = ex.miss === "b" ? "" : ex.b;
      [...this.keypad.children].forEach(k => k.disabled = false);
      this.shell.setLabel(this.current.text);
      this.prompt(ex.miss === "whole" ? `Колко е ${ex.a} и ${ex.b}?` : ex.miss === "a" ? `${ex.whole} е колко и ${ex.b}?` : `${ex.whole} е ${ex.a} и колко?`);
    }
    // цялото (горе) няма класове right/wrong в CSS – оцветяваме го на място със същите цветове като частите
    mark(c) {
      if (this.box !== this.whole.parentNode) { this.box.classList.remove("right", "wrong"); if (c) this.box.classList.add(c); return; }
      const bg = { right: "radial-gradient(circle at 40% 35%, #C9F7C6, #95FF93 75%, #5FD64A)", wrong: "radial-gradient(circle at 40% 35%, #FFD3D3, #FF9393 75%, #E86A6A)" };
      this.box.style.background = c ? bg[c] : ""; this.box.style.borderColor = c ? `var(--${c === "right" ? "good" : "bad"})` : "";
    }
    pick(v, key) {
      const ex = this.ex, ok = v === ex.want, span = this.box.querySelector("span");
      if (!this.answer(ok, { text: this.current.text, answer: ex.want, given: v })) return;
      [...this.keypad.children].forEach(k => k.disabled = true);
      span.textContent = v;
      const full = `${ex.whole} е ${ex.a} и ${ex.b}`;
      if (ok) { this.mark("right"); this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.advance(1400); }
      else {
        this.mark("wrong"); key.classList.add("wrong"); this.shell.flash(full, "bad"); this.say(`Не. ${full}`);
        setTimeout(() => { this.mark("right"); span.textContent = ex.want; key.classList.remove("wrong"); }, 1100);
        this.advance(2600);
      }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.numberComposition = {
    id: "numberComposition", name: "Състав на числата", skill: "Състав на числото", top: "palm", cls: CompositionGame,
    tiers: [0, 1, 2],
    task: "Определи състава на числата: кое число липсва, за да се получи цялото.",
    settings: [
      { key: "numbers", label: "Числа", type: "range", min: 3, max: 20, def: 3, help: "Числото, което детето разлага на две части." },
      { key: "complexity", label: "Сложност", type: "cycle", options: [["1", "Едно число"], ["2", "Смесени числа"]], def: "1", help: "Едно число: всички примери са с избраното число. Смесени числа: всеки пример е със случайно число от 3 до избраното." },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 10, def: 4 }
    ],
    paramsLine: s => `${s.examples} примера · число ${s.numbers} · ${String(s.complexity) === "2" ? "смесени числа" : "едно число"}`
  };
})();
