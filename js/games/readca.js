/* Читалка (Букварика).
   Режим „След урока“ (по подразбиране, по ревизията на Б1–Б5): свободно четене на глас след Б3 / Б4 / Б5 – 8 / 10 / 10 единици
   от банката на урока (същите срички и думи като в домашната), една по една, „Нататък“ когато детето е готово, ясен край
   „Прочете всичко!“. Без таймер, без статус и без „прочетено правилно“ – платформата не чува детето; четенето се потвърждава в часа.
   „Чуй как звучи“ е опора след прочита (детето първо чете само).
   Режим „С време“ (старата игра): срички или „космически думички“ за определено време; брои показаните. */
(function () {
  const TITLES = { 1: "Четем срички", 2: "Ударени срички", 3: "Космически думички" };
  const TASKS = { 1: "Прочети сричките на глас. Натискай „Следваща“, когато си готов.", 2: "Прочети сричките с ударение: ударената гласна е отбелязана.", 3: "Прочети измислените „космически“ думички сричка по сричка." };
  function learned(lessonNumber) {
    const plan = (window.BUK["lesson-plan-letters"] || {}).lessonPlanLetters || [];
    const set = new Set(); for (let i = 0; i < Math.min(lessonNumber, plan.length); i++) [...plan[i]].forEach(l => set.add(l));
    return set;
  }
  function pool(level, stage, lessonNumber) {
    const sy = (window.BUK.syllables || {}).syllables; if (!sy) return ["ма", "му", "ми", "на", "ну", "ни"];
    const L = learned(lessonNumber), flat = a => a.flat();
    const okAll = w => [...w].every(l => L.has(l)), okPos = (w, ps) => ps.every(i => L.has(w[i]));
    let list, filt;
    if (level === 1) { list = flat(sy.difficult_2.opened).concat(flat(sy.difficult_2.closed), sy.additionSyllables); filt = okAll; }
    else if (level === 2) { list = flat(sy.difficult_2.opened).concat(sy.additionSyllables); filt = okAll; }
    else {
      const d4 = flat(sy.difficult_4.opened), d6 = flat(sy.difficult_6.opened);
      list = stage <= 2 ? d4 : stage <= 5 ? d6 : d4.concat(d6);
      filt = w => okPos(w, w.length === 4 ? [0, 2] : [0, 2, 4]);
    }
    const f = list.filter(filt); return f.length >= 4 ? f : list;
  }
  const BANK = "config/banks-b1-5.json";
  const COUNT = { 3: 8, 4: 10, 5: 10 };
  // единиците за четене от банката на урока: Б3 – сричките; Б4 и Б5 – думите (написани, с изучени букви)
  function lessonUnits(bank, n) {
    const P = bank.pools[`BK0${n}`] || {}, all = Object.values(P).flat(), out = [], fam = {};
    all.forEach(u => { const w = (u.write || "").toLowerCase(); if (w && !w.includes(" ") && !out.includes(w) && (n === 3 ? w.length <= 3 : w.length > 2)) { out.push(w); fam[w] = u.fam; } });
    // първо добре познатите думи (пилотните като „лемур“, „омар“ са със средна познатост); срички – всички
    const high = out.filter(w => fam[w] === "висока"); if (n > 3 && high.length >= (COUNT[n] || 8)) return high;
    return out;
  }
  class ReadcaGame extends BaseGame {
    constructor(shell, settings, tier, onFinish) {
      super(shell, settings, tier, onFinish);
      this.level = Number(this.s.level) || 1; this.stage = Number(this.s.stageNumber) || 1;
      this.gameTime = Number(this.s.gameTime) || 30; this.auto = this.s.autoSwitch === "on"; this.speed = Number(this.s.speed) || 1;
      this.total = 0; this.timers = [];
    }
    get gameId() { return "readca"; }
    get lessonMode() { return (this.s.mode || "lesson") !== "timed"; }
    start() {
      if (!this.lessonMode) return super.start();
      const n = Number(this.s.afterLesson) || 3, want = COUNT[n] || 8;
      fetch(BANK).then(r => r.json()).then(bank => {
        this.list = shuffle(lessonUnits(bank, n)).slice(0, want); this.total = this.list.length; this.n = n; super.start();
      }).catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Думите не се заредиха.</p>'; });
    }
    get skillName() { if (this.lessonMode) return "Четене на глас (упражнение)"; return this.level === 3 ? "Четене на думички" : "Четене на срички"; }
    renderProgress() { this.shell.progress.innerHTML = ""; }
    nextRound() { if (this.finished) return; this.locked = false; this.roundStart = Date.now(); this.startRound(); }
    renderLives() { this.shell.lives.innerHTML = ""; }
    tick() { if (this.lessonMode) { this.shell.timer.textContent = ""; return; } this.tickTimed(); }
    tickTimed() {
      const left = Math.max(0, this.gameTime - Math.floor((Date.now() - this.startedAt) / 1000));
      this.shell.timer.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0 && !this.finished) { this.finished = true; this.shell.flash("Времето изтече. Браво!", "good"); this.say("Времето изтече. Браво!"); setTimeout(() => this.finish(false), 1200); }
    }
    render() {
      if (this.lessonMode) return this.renderLesson();
      this.items = shuffle(pool(this.level, this.stage, Number(this.s.lessonNumber) || 3).slice()); this.k = 0;
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-meadow"/></svg>
        <div class="az rd"><div class="rd-hint">${this.level === 3 ? "Това са измислени думички. Прочети ги сричка по сричка." : "Прочети на глас."}</div><div class="rd-card"><div class="rd-word" id="word" aria-live="polite"></div></div>
        ${this.auto ? `<div class="rd-auto">Сменя се автоматично на всеки ${this.speed} сек.</div>` : `<button type="button" class="gbtn gbtn-green rd-next" id="next">Следваща <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`}
        <div class="rd-count">Прочетени: <b id="cnt">0</b></div></div>`;
      this.word = this.shell.arena.querySelector("#word"); this.cnt = this.shell.arena.querySelector("#cnt");
      this.shell.setLabel(TITLES[this.level]);
      const n = this.shell.arena.querySelector("#next"); if (n) n.addEventListener("click", () => this.next());
    }
    renderLesson() {
      this.k = 0; document.body.classList.add("rd-practice");
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-meadow"/></svg>
        <div class="az rd"><div class="rd-hint">Прочети на глас. Когато си готов, натисни „Нататък“.</div><div class="rd-card"><div class="rd-word" id="word" aria-live="polite"></div></div>
        <div class="rd-row"><button type="button" class="gbtn rd-hear" id="hear">Чуй как звучи</button><button type="button" class="gbtn gbtn-green rd-next" id="next">Нататък</button></div>
        <div class="rd-count"><b id="cnt">1</b> от ${this.list.length}</div></div>`;
      this.word = this.shell.arena.querySelector("#word"); this.cnt = this.shell.arena.querySelector("#cnt");
      this.shell.setLabel(this.n === 3 ? "Чета срички" : "Чета думи");
      this.shell.arena.querySelector("#next").addEventListener("click", () => this.nextLesson());
      this.shell.arena.querySelector("#hear").addEventListener("click", () => { this.heard = true; this.say(this.cur); });
    }
    showLesson() {
      const w = this.list[this.k]; this.cur = w; this.heard = false; this.roundStart = Date.now();
      this.word.innerHTML = [...w].map(l => `<span class="rd-l">${l}</span>`).join("");
      this.word.classList.remove("in"); void this.word.offsetWidth; this.word.classList.add("in");
      this.cnt.textContent = this.k + 1;
    }
    nextLesson() {
      if (this.finished) return;
      this.log.push(this.event(null, { text: this.cur, answer: null, given: null, ok: null, practice_only: true, read_aloud: true, heard_model: this.heard, ms: Date.now() - this.roundStart, game_type: "free_reading", view_name: "Читалка след урока", after_lesson: `BK0${this.n}` }));
      this.k++;
      if (this.k < this.list.length) return this.showLesson();
      // ясен край: всичко прочетено на едно място, без оценка
      this.shell.arena.querySelector(".rd").innerHTML = `<div class="rd-done"><h3>Прочете всичко!</h3><div class="rd-all">${this.list.map(w => `<span>${w}</span>`).join("")}</div>
        <p>Прочети ги още веднъж на мама, татко или треньора.</p><button type="button" class="gbtn gbtn-green" id="done">Готово</button></div>`;
      this.say("Прочете всичко! Браво.");
      this.shell.arena.querySelector("#done").addEventListener("click", () => this.finish(false));
    }
    startRound() {
      if (this.lessonMode) return this.showLesson();
      this.show();
      if (this.auto) this.iv = setInterval(() => this.next(), this.speed * 1000);
    }
    stressIndex(w) {
      if (this.level === 2) return w.length - 1;
      if (this.level === 3) { const m = { 1: 1, 2: 3, 3: 1, 4: 3, 5: 5 }; if (this.stage <= 5) return Math.min(m[this.stage], w.length - 1); const c = w.length === 4 ? [1, 3] : [1, 3, 5]; return c[rnd(c.length)]; }
      return -1;
    }
    show() {
      const w = this.items[this.k % this.items.length], si = this.stressIndex(w);
      this.word.innerHTML = [...w].map((l, i) => `<span class="rd-l${i === si ? " acc" : ""}">${l}</span>`).join("");
      this.word.classList.remove("in"); void this.word.offsetWidth; this.word.classList.add("in");
      this.cur = w; this.roundStart = Date.now();
    }
    next() {
      if (this.finished) return;
      this.locked = false; this.answer(true, { text: this.cur, answer: this.cur, given: this.cur }); this.locked = false;
      this.total = this.log.length; this.cnt.textContent = this.log.length; this.k++; this.show();
    }
    finish(early) {
      if (this.finished && this.timerId === null) return;
      clearInterval(this.iv); this.total = Math.max(1, this.log.length);
      document.body.classList.remove("rd-practice"); super.finish(early);
    }
    destroy() { clearInterval(this.iv); document.body.classList.remove("rd-practice"); super.destroy(); }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.readca = {
    id: "readca", name: "Читалка", module: "bukvarica", skill: "Четене на срички", cls: ReadcaGame,
    task: s => s.mode === "timed" ? `${TITLES[Number(s.level) || 1]}. ${TASKS[Number(s.level) || 1]}` : `Прочети на глас ${({ 3: "8 срички", 4: "10 думи", 5: "10 думи" })[s.afterLesson || "3"]} от урока. Без време – натискай „Нататък“, когато си готов.`,
    tiers: () => [0, 0, 0],
    settings: [
      { key: "mode", label: "Режим", type: "cycle", def: "lesson", options: [["lesson", "След урока"], ["timed", "С време"]], help: "След урока: 8–10 срички или думи от банката на урока, без време. С време: старата игра с таймер и скорост." },
      { key: "afterLesson", label: "Урок", type: "choice", def: "3", hiddenIf: s => s.mode === "timed", options: [["3", "Б3", "8 срички"], ["4", "Б4", "10 думи"], ["5", "Б5", "10 думи"]] },
      { key: "level", label: "Ниво", type: "range", min: 1, max: 3, def: 1, hiddenIf: s => s.mode !== "timed", help: "1 Четем срички: отворени и затворени срички. 2 Ударени срички: с отбелязано ударение. 3 Космически думички: измислени думи от 2 или 3 срички." },
      { key: "autoSwitch", label: "Автоматично превключване", hiddenIf: s => s.mode !== "timed", type: "cycle", options: [["off", "Изключено"], ["on", "Включено"]], def: "off", help: "Изключено: детето натиска „Следваща“, когато е прочело. Включено: сричките се сменят сами през избраната скорост." },
      { key: "gameTime", label: "Време за игра", hiddenIf: s => s.mode !== "timed", type: "range", min: 30, max: 360, step: 30, def: 30, unit: "сек.", help: "Колко секунди трае четенето: от 30 секунди до 6 минути." },
      { key: "lessonNumber", label: "Номер на урока", hiddenIf: s => s.mode !== "timed", type: "range", min: 1, max: 14, def: 3, help: "Показват се само срички от буквите, изучени до този урок по тематичния план (урок 3: а, и, у, о, е, ъ, м, н)." },
      { key: "speed", label: "Скорост", type: "range", min: 1, max: 5, step: 0.5, def: 1, unit: "сек.", hiddenIf: s => s.mode !== "timed" || s.autoSwitch !== "on", help: "Само при автоматично превключване: секунди, през които идва следващата сричка (1 е най-бързо)." },
      { key: "stageNumber", label: "Етап", type: "range", min: 1, max: 6, def: 1, hiddenIf: s => s.mode !== "timed" || Number(s.level) !== 3, help: "Само за ниво 3: етапи 1 и 2 са думички от 2 срички (ударение на 1-вата или 2-рата), 3 до 5 от 3 срички, 6 е смесен с произволно ударение." }
    ],
    paramsLine: s => { if (s.mode !== "timed") return `След Букварика ${s.afterLesson || 3} · ${({ 3: 8, 4: 10, 5: 10 })[s.afterLesson || "3"]} единици · без време`; const l = Number(s.level) || 1; return `${TITLES[l]} · ${s.gameTime} сек. · урок ${s.lessonNumber}` + (s.autoSwitch === "on" ? ` · авто ${s.speed} сек.` : "") + (l === 3 ? ` · етап ${s.stageNumber}` : ""); }
  };
})();
