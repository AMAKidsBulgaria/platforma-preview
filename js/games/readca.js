/* Читалка (Букварика).
   Режим „След урока“ (по подразбиране, по ревизията на Б1–Б5): свободно четене на глас след Б3 / Б4 / Б5 – 8 / 10 / 10 единици
   от банката на урока (същите срички и думи като в домашната), една по една, „Нататък“ когато детето е готово, ясен край
   „Прочете всичко!“. Без таймер, без статус и без „прочетено правилно“ – платформата не чува детето; четенето се потвърждава в часа.
   „Чуй как звучи“ е опора след прочита (детето първо чете само).
   Режим „С време“ (старата игра): за определено време; брои показаните. Методист 19.10: ниво 1 срички, 2 думички, 3 думички с ударение;
   „Етап“ вече не е настройка – на ниво 3 играта сама минава 2 срички (уд. 1-ва) → 2 срички (уд. 2-ра) → 3 срички (1-ва, 2-ра, 3-та)
   през 5 прочетени думички; подетапът се записва (stress_pattern). Твърдо правило: никога дума с неизучена буква – при 1–3 думички
   показваме само тях, при 0 нивото е заключено („Ще се отключи след още букви.“). */
(function () {
  const TITLES = { 1: "Четем срички", 2: "Четем думички", 3: "Думички с ударение" };
  const TASKS = { 1: "Прочети сричките на глас. Натискай „Следваща“, когато си готов.", 2: "Прочети измислените думички сричка по сричка.", 3: "Прочети думичките и натъртвай отбелязаната сричка." };
  function learned(lessonNumber) {
    const plan = (window.BUK["lesson-plan-letters"] || {}).lessonPlanLetters || [];
    const set = new Set(); for (let i = 0; i < Math.min(lessonNumber, plan.length); i++) [...plan[i]].forEach(l => set.add(l));
    return set;
  }
  // само думички/срички от изучените букви – без допълване от целия списък
  function pool(level, lessonNumber) {
    const sy = (window.BUK.syllables || {}).syllables; if (!sy) return [];
    const L = learned(lessonNumber), flat = a => a.flat(), ok = w => [...w].every(l => L.has(l));
    if (level === 1) return flat(sy.difficult_2.opened).concat(flat(sy.difficult_2.closed), sy.additionSyllables).filter(ok);
    return flat(sy.difficult_4.opened).concat(flat(sy.difficult_6.opened)).filter(ok);
  }
  // подетапи на ниво 3: [дължина, индекс на ударената гласна, описание за възрастния]
  const STAGES = [[4, 1, "2 срички · ударение на 1-ва"], [4, 3, "2 срички · ударение на 2-ра"], [6, 1, "3 срички · ударение на 1-ва"], [6, 3, "3 срички · ударение на 2-ра"], [6, 5, "3 срички · ударение на 3-та"]];
  const PER_STAGE = 5;
  window.READCA_POOL = pool;   // за заключване на нивата в настройките
  const BANK = "config/banks-b1-5.json?v=5";
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
      this.level = Number(this.s.level) || 1; this.stage = 0; this.inStage = 0;
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
    get skillName() { if (this.lessonMode) return "Четене на глас (упражнение)"; return this.level >= 2 ? "Четене на думички" : "Четене на срички"; }
    renderProgress() { this.shell.progress.innerHTML = ""; }
    nextRound() { if (this.finished) return; this.locked = false; this.roundStart = Date.now(); this.startRound(); }
    renderLives() { this.shell.lives.innerHTML = ""; }
    tick() { if (this.lessonMode) { this.shell.timer.textContent = ""; return; } this.tickTimed(); }
    tickTimed() {
      const left = Math.max(0, this.gameTime - Math.floor((Date.now() - this.startedAt) / 1000));
      this.shell.timer.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0 && !this.finished) { this.finished = true; this.shell.flash("Времето изтече.", "good"); this.say("Времето изтече."); setTimeout(() => this.finish(false), 1200); }
    }
    render() {
      if (this.lessonMode) return this.renderLesson();
      document.body.classList.remove("rd-practice");   // остатък от режим „След урока“
      this.items = shuffle(pool(this.level, Number(this.s.lessonNumber) || 3).slice()); this.k = 0;
      if (this.level === 3) { this.byStage = STAGES.map(([n]) => shuffle(this.items.filter(w => w.length === n))); this.stages = STAGES.map((_, i) => i).filter(i => this.byStage[i].length); this.stage = 0; this.inStage = 0; }
      if (!this.items.length) { this.shell.arena.innerHTML = '<p class="bk-err">За този урок още няма думички с изучените букви. Ще се отключи след още букви.</p>'; this.finished = true; return; }
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-meadow"/></svg>
        <div class="az rd"><div class="rd-hint">${this.level >= 2 ? "Това са измислени думички. Прочети ги сричка по сричка." : "Прочети на глас."}</div><div class="rd-card"><div class="rd-word" id="word" aria-live="polite"></div></div>
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
    // ниво 3: текущият подетап (след последния – остава на него); след PER_STAGE прочетени – следващият наличен
    curStage() { return this.stages[Math.min(this.stage, this.stages.length - 1)]; }
    show() {
      if (!this.items || !this.items.length) return;
      let w, si = -1;
      if (this.level === 3) { const st = this.curStage(), list = this.byStage[st]; w = list[this.inStage % list.length]; si = STAGES[st][1]; this.pattern = STAGES[st][2]; }
      else w = this.items[this.k % this.items.length];
      this.word.innerHTML = [...w].map((l, i) => `<span class="rd-l${i === si ? " acc" : ""}">${l}</span>`).join("");
      this.word.classList.remove("in"); void this.word.offsetWidth; this.word.classList.add("in");
      this.cur = w; this.roundStart = Date.now();
    }
    next() {
      if (this.finished) return;
      this.locked = false; this.answer(true, Object.assign({ text: this.cur, answer: this.cur, given: this.cur }, this.level === 3 ? { stress_stage: this.curStage() + 1, stress_pattern: this.pattern } : {})); this.locked = false;
      if (this.level === 3 && ++this.inStage >= PER_STAGE && this.stage < this.stages.length - 1) { this.stage++; this.inStage = 0; }
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
      { key: "afterLesson", label: "Урок", type: "choice", def: "3", hiddenIf: s => s.mode === "timed", options: [["3", "Б3", "8 срички с М, Н"], ["4", "Б4", "10 думи + Л, Р"], ["5", "Б5", "10 думи + Й, Ю, Я"]] },   // една механика – разликата е в изучените букви
      { key: "level", label: "Ниво", type: "range", min: 1, max: 3, def: 1, hiddenIf: s => s.mode !== "timed", help: "1 Срички: отворени и затворени. 2 Думички: измислени думички от 2 и 3 срички. 3 Думички с ударение: ударената сричка е отбелязана; играта сама минава от 2 към 3 срички. Нивата без думички с изучените букви са заключени.",
        valueOff: (v, s) => !!window.READCA_POOL && !window.READCA_POOL(Number(v), Number(s.lessonNumber) || 3).length, offHint: "Ще се отключи след още букви." },
      { key: "autoSwitch", label: "Автоматично превключване", hiddenIf: s => s.mode !== "timed", type: "cycle", options: [["off", "Изключено"], ["on", "Включено"]], def: "off", help: "Изключено: детето натиска „Следваща“, когато е прочело. Включено: сричките се сменят сами през избраната скорост." },
      { key: "gameTime", label: "Време за игра", hiddenIf: s => s.mode !== "timed", type: "range", min: 30, max: 360, step: 30, def: 30, unit: "сек.", help: "Колко секунди трае четенето: от 30 секунди до 6 минути." },
      { key: "lessonNumber", label: "Номер на урока", hiddenIf: s => s.mode !== "timed", type: "range", min: 1, max: 14, def: 3, help: "Показват се само срички от буквите, изучени до този урок по тематичния план (урок 3: а, и, у, о, е, ъ, м, н)." },
      { key: "speed", label: "Скорост", type: "range", min: 1, max: 5, step: 0.5, def: 1, unit: "сек.", hiddenIf: s => s.mode !== "timed" || s.autoSwitch !== "on", help: "Само при автоматично превключване: секунди, през които идва следващата сричка (1 е най-бързо)." },
    ],
    paramsLine: s => { if (s.mode !== "timed") return `След Букварика ${s.afterLesson || 3} · ${({ 3: 8, 4: 10, 5: 10 })[s.afterLesson || "3"]} единици · без време`; const l = Number(s.level) || 1; return `${TITLES[l]} · ${s.gameTime} сек. · урок ${s.lessonNumber}` + (s.autoSwitch === "on" ? ` · авто ${s.speed} сек.` : ""); }
  };
})();
