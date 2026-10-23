/* Графична диктовка (gridDictation, M6) – „Следвай стрелките“. Поле от точки 6×6, началната точка е със звездичка. Отгоре е редът
   от команди; текущата е голяма – стрелка и до нея цифра (числото е втора опора) – и се чува („Две надясно.“, 🔊 повтаря).
   Детето докосва точката, до която стига линията; линията се дочертава сама. Стрелката винаги значи посока по екрана (← = наляво
   по екрана, без завиване). Диагонална точка не е валидна (error_type diagonal).
   Оценяване (методист, 18.10.2026): всяка команда е отделно оценено решение – първият опит (command_accuracy). След грешка – командата
   се чува пак и още един опит; след втора грешка вярната точка мига; след трета системата сама дочертава до вярната точка и продължава
   оттам, така че една грешка не разваля следващите команди. drawing_completed_without_help (без подсказка) е допълнителен показател
   и не влиза в статуса. Едно събитие на рисунка с command_results, scored_decision_count = броя команди.
   Домашна (MATH_BANK, tools/math_banks/gridDictation.py). Единица: { name, start: [x, y], cmds: [["R", 2], ["U", 1], ...], level } */
(function () {
  const N = 6, S = 70, P0 = 35;
  const DV = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  const WORD = { R: "надясно", L: "наляво", U: "нагоре", D: "надолу" };
  const ROT = { R: 0, D: 90, L: 180, U: 270 };
  const STEPS = ["", "Една", "Две", "Три", "Четири", "Пет"];
  const px = v => P0 + v * S;
  const arrow = (d, size) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g transform="rotate(${ROT[d]} 50 50)"><path d="M12 42 H58 V22 L90 50 L58 78 V58 H12 Z" fill="#2F7FE0" stroke="#1E5BA8" stroke-width="4" stroke-linejoin="round"/></g></svg>`;
  const phrase = c => `${STEPS[c[1]]} ${WORD[c[0]]}.`;

  class GridDictationGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.examples) || 4; }
    get gameId() { return "gridDictation"; } get skillName() { return "Графична диктовка"; }
    start() {
      MATH_BANK.attach(this).then(() => {
        const mb = this.mb;
        if (mb && !mb.units.length) this.mb = null;
        else if (mb && mb.set === "practice" && mb.def.items) this.total = Math.min(mb.def.items, mb.units.length);
        super.start();
      });
    }
    render() { this.scene("wt-geo wt-gd", "scene-beach"); this.shell.setLabel("Следвай стрелките"); }
    // свободна игра: случаен път без повторени точки, по нивото от настройките
    genUnit() {
      const lvl = Number(this.s.level) || 1, n = lvl === 1 ? 3 + rnd(2) : 4 + rnd(2), mx = lvl === 1 ? 2 : 3;
      for (let t = 0; t < 400; t++) {
        let x = rnd(N), y = rnd(N); const start = [x, y], seen = new Set([x + "," + y]), cmds = []; let ok = true, prev = "";
        for (let k = 0; k < n && ok; k++) {
          const ds = Object.keys(DV).filter(d => d !== prev && !(prev && DV[d][0] === -DV[prev][0] && DV[d][1] === -DV[prev][1]));
          const d = ds[rnd(ds.length)], m = 1 + rnd(mx);
          for (let i = 0; i < m; i++) { x += DV[d][0]; y += DV[d][1]; if (x < 0 || y < 0 || x >= N || y >= N || seen.has(x + "," + y)) { ok = false; break; } seen.add(x + "," + y); }
          cmds.push([d, m]); prev = d;
        }
        if (ok && (lvl === 1 || (cmds.some(c => c[0] === "L") && cmds.some(c => c[0] === "R")))) return { name: "", start, cmds, level: lvl };
      }
      return { name: "", start: [0, 4], cmds: [["R", 1], ["U", 1], ["R", 1], ["U", 1]], level: 1 };
    }
    startRound() {
      this.stepWrong = 0;
      const u = (this.mb && this.mb.units[this.idx]) || this.genUnit(); this.unit = u;
      this.cur = u.start.slice(); this.k = 0; this.results = []; this.cmdWrong = 0; this.firstErr = null;
      let dots = "";
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) dots += `<g class="gd-dot" data-x="${x}" data-y="${y}"><circle cx="${px(x)}" cy="${px(y)}" r="30" fill="transparent"/><circle class="gd-pt" cx="${px(x)}" cy="${px(y)}" r="9"/></g>`;
      const star = `<path class="gd-star" transform="translate(${px(u.start[0])} ${px(u.start[1])}) scale(1.25)" d="M0 -16 L4.7 -6.5 L15.2 -4.9 L7.6 2.5 L9.4 12.9 L0 8 L-9.4 12.9 L-7.6 2.5 L-15.2 -4.9 L-4.7 -6.5 Z"/>`;
      this.box.innerHTML = `<div class="gd-top"><div class="gd-cmds">${u.cmds.map((c, i) => `<span class="gd-chip" data-i="${i}">${arrow(c[0], 30)}<b>${c[1]}</b></span>`).join("")}</div>
        <div class="gd-now"><button type="button" class="geo-say" aria-label="Чуй пак">🔊</button><span class="gd-big" id="gd-big"></span></div></div>
        <div class="geo-card gd-card"><svg class="gd-svg" viewBox="0 0 ${2 * P0 + (N - 1) * S} ${2 * P0 + (N - 1) * S}"><g id="gd-path"></g>${dots}${star}</svg></div>`;
      [...this.box.querySelectorAll(".gd-dot")].forEach(g => g.addEventListener("pointerdown", e => { e.preventDefault(); this.tapDot(Number(g.dataset.x), Number(g.dataset.y), g); }));
      this.box.querySelector(".geo-say").addEventListener("pointerdown", e => { e.preventDefault(); this.sayCmd(); });
      this.showCmd();
    }
    showCmd() {
      const c = this.unit.cmds[this.k]; this.cmdWrong = 0; this.cmdErr = null; this.helped = false; this.cmdStart = Date.now();
      this.box.querySelectorAll(".gd-chip").forEach((el, i) => { el.classList.toggle("now", i === this.k); el.classList.toggle("past", i < this.k); });
      this.box.querySelector("#gd-big").innerHTML = `${arrow(c[0], 96)}<b>${c[1]}</b>`;
      this.box.querySelectorAll(".gd-dot.hint").forEach(g => g.classList.remove("hint"));
      this.sayCmd();
    }
    sayCmd() { const c = this.unit.cmds[this.k]; if (c) this.say(phrase(c)); }
    target() { const c = this.unit.cmds[this.k], d = DV[c[0]]; return [this.cur[0] + d[0] * c[1], this.cur[1] + d[1] * c[1]]; }
    errorType(x, y) {
      const c = this.unit.cmds[this.k], [dx, dy] = DV[c[0]], ex = x - this.cur[0], ey = y - this.cur[1];
      if (ex && ey) return "diagonal";
      const along = dx ? ex : ey, across = dx ? ey : ex, sign = dx || dy;
      if (across) return "axis_swap";                       // нагоре/надолу вместо наляво/надясно или обратно
      if (Math.sign(along) !== sign) return dx ? "left_right" : "up_down";
      const dist = Math.abs(along); return dist === c[1] + 1 ? "off_by_one_more" : dist === c[1] - 1 ? "off_by_one_less" : "wrong_count";
    }
    drawTo(t, helped) {
      const seg = `<line x1="${px(this.cur[0])}" y1="${px(this.cur[1])}" x2="${px(t[0])}" y2="${px(t[1])}" class="gd-seg${helped ? " helped" : ""}"/>`;
      this.box.querySelector("#gd-path").insertAdjacentHTML("beforeend", seg); this.cur = t;
    }
    tapDot(x, y, g) {
      if (this.finished || this.locked || this.busy) return;
      if (x === this.cur[0] && y === this.cur[1]) return;   // докосване на точката, в която е линията – без отговор
      const c = this.unit.cmds[this.k], t = this.target();
      if (x === t[0] && y === t[1]) return this.cmdDone(false);
      const et = this.errorType(x, y);
      if (this.cmdWrong === 0) this.cmdErr = et;
      this.cmdWrong++;
      this.miss(`${this.unit.name || "рисунка"}: команда ${this.k + 1} ${c[0]}${c[1]}`, `${x},${y}`);
      const last = this.log[this.log.length - 1]; if (last) Object.assign(last, { command_index: this.k, command: c.join(""), error_type: et });
      g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 700);
      if (this.cmdWrong >= 3) { this.busy = true; this.helped = true; this.say("Ето докъде стига линията."); this.later(() => { this.busy = false; this.cmdDone(true); }, 1200); return; }
      if (this.cmdWrong >= 2) { this.helped = true; const h = this.box.querySelector(`.gd-dot[data-x="${t[0]}"][data-y="${t[1]}"]`); if (h) h.classList.add("hint"); }
      this.shell.flash("Опитай пак", "bad"); this.later(() => this.shell.hideFlash(), 1100);
      this.say(`Опитай пак. ${phrase(c)}`);
    }
    cmdDone(auto) {
      const c = this.unit.cmds[this.k];
      this.results.push({ command_index: this.k, command: c.join(""), first_attempt_correct: this.cmdWrong === 0, attempt_count: this.cmdWrong + 1,
        error_type: this.cmdErr, hint_shown: this.cmdWrong >= 2, auto_moved: !!auto, response_time_ms: Date.now() - this.cmdStart });
      this.drawTo(this.target(), auto || this.helped); this.k++;
      if (this.k < this.unit.cmds.length) return this.showCmd();
      // рисунката е готова: едно събитие с решенията по команди
      const n = this.results.length, k = this.results.filter(r => r.first_attempt_correct).length;
      const noHelp = this.results.every(r => !r.hint_shown && !r.auto_moved);
      this.box.querySelectorAll(".gd-chip").forEach(el => { el.classList.remove("now"); el.classList.add("past"); });
      this.decisions = { task_count: 1, scored_decision_count: n, correct_scored_decisions: k };
      this.done(this.unit.name || "рисунка", 1600);
      const last = this.log[this.log.length - 1];
      if (last) Object.assign(last, { first_attempt_correct: k === n, command_results: this.results, command_accuracy: Math.round(k / n * 100) / 100,
        status_metric: "command_accuracy", drawing_completed_without_help: noHelp, drawing_level: this.unit.level, bank_item: this.unit });
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.gridDictation = {
    id: "gridDictation", name: "Графична диктовка", skill: "Графична диктовка", top: "palm", cls: GridDictationGame, tiers: [0, 2, 4],
    task: "Слушай командата и докосни точката, до която стига линията.",
    settings: [
      { key: "level", label: "Ниво", type: "cycle", options: [["1", "3–4 команди, до 2 стъпки"], ["2", "4–5 команди, до 3 стъпки"]], def: "1" },
      { key: "examples", label: "Брой рисунки", type: "range", min: 2, max: 8, def: 4 }
    ],
    paramsLine: s => `${s.examples || 4} рисунки · ниво ${s.level || 1}`
  };
})();
