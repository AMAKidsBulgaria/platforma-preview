/* Звуково-буквен анализ (Букварика): за всеки звук детето избира чип според вида на звука.
   Категориите следват Букварика (методист, 17.10.2026):
     Б1–Б2 – още не се играе (съгласните не са въведени);
     Б3–Б5 – две категории: гласна (червен) / съгласна (син);
     от Б6 (Д/Т) – три: гласна / звучна съгласна (камбанка) / беззвучна съгласна (слушалки), и само с преподадените
     двойки звучна–беззвучна (Д/Т Б6, Б/П Б7, Г/К Б8, З/С Б9, В/Ф Б10, Ж/Ш Б11);
     от Б12 – и съгласните без двойка: М Н Л Р Й като звучни, Х Ц Ч като беззвучни (същите три чипа; след верен отговор
     „Да! М е звучна съгласна. Няма беззвучна двойка.“). Щ не влиза (два звука).
   В домашната урокът идва от контекста (lesson BK03…BK13); settings.classify отличава тази игра от другите изгледи с това име.
   Нива: 1 звук; 2 сричка от 2 букви; 3 две отворени срички (ма-ри); 4 две срички, едната затворена (у-дит) – не са думи.
   Методист 19.10: без автоматично озвучаване – детето само назовава звука; „Чуй“ е помощ (help_used). */
(function () {
  const TITLES = { 1: "Звукове", 2: "Срички от 2 букви", 3: "Проста комбинация от 2 срички", 4: "Сложна комбинация от 2 срички" };
  const CHIPS3 = [["vowel", "гласен", "chip-vowel"], ["voiced", "звучен", "chip-voiced"], ["unvoiced", "беззвучен", "chip-unvoiced"]];
  const CHIPS2 = [["vowel", "гласен", "chip-vowel"], ["consonant", "съгласен", "chip-consonant"]];
  // буквите по уроци (Букварика 1–13) и двойките звучна–беззвучна по реда на въвеждане
  const LESSON = ["аиу", "оеъ", "мн", "лр", "йюя", "дт", "бп", "гк", "зс", "вф", "жш", "хчц", "щь"];
  const PAIRS = { 6: "дт", 7: "бп", 8: "гк", 9: "зс", 10: "вф", 11: "жш" };
  const VOICED = "бвгдзж", VOWELS = "аъоуеи", SONOR = "мнлрй", UNPAIRED = "хцч";
  let CHIPS = CHIPS3;
  function types() { const a = (window.BUK.alphabet || {}).lettersTypes || {}; return { vowel: a.vowel || "аъоуеи", voiced: a.voised || "бвгджзмлнрй", unvoiced: a.notVoised || "пфктшсчцх" }; }
  let THREE = true, PAIRED = new Set(), NOPAIR = false;
  // двукатегорийно: гласна / съгласна; трикатегорийно: само гласни и преподадени двойни съгласни
  function typeOf(l) {
    if (VOWELS.includes(l)) return "vowel";
    if (!THREE) return /[а-я]/.test(l) && !"ьщюя".includes(l) ? "consonant" : null;
    if (PAIRED.has(l)) return VOICED.includes(l) ? "voiced" : "unvoiced";
    if (NOPAIR && SONOR.includes(l)) return "voiced";
    if (NOPAIR && UNPAIRED.includes(l)) return "unvoiced";
    return null;
  }
  function learned(n) { const s = new Set(); LESSON.slice(0, Math.min(n, LESSON.length)).forEach(g => [...g].forEach(l => s.add(l))); return s; }
  function setLesson(n) {
    THREE = n >= 6; NOPAIR = n >= 12; CHIPS = THREE ? CHIPS3 : CHIPS2;
    PAIRED = new Set(Object.keys(PAIRS).filter(k => Number(k) <= n).flatMap(k => [...PAIRS[k]]));
  }
  function pool(level, lesson) {
    const L = learned(lesson), sy = (window.BUK.syllables || {}).syllables, flat = a => (a || []).flat();
    const info = (window.BUK.alphabet || {}).lettersInfo || {}, dis = info.disabledLettersForSoundLetterParsing || "щюяь";
    let list;
    if (level === 1) list = [...((window.BUK.alphabet || {}).alphabet || "абвгдежзийклмнопрстуфхцчшщъьюя")].filter(l => L.has(l) && !dis.includes(l));
    else if (!sy) list = ["ма", "мо", "ну"];
    else if (level === 2) list = flat(sy.difficult_2.opened).filter(w => L.has(w[0])).concat(flat(sy.difficult_2.closed).filter(w => L.has(w[1])));
    else if (level === 3) list = flat(sy.difficult_4.opened).filter(w => L.has(w[0]) && L.has(w[2]));
    else list = flat(sy.difficult_4.closed).filter(w => L.has(w[1]) && L.has(w[3]));   // само затворени – иначе ниво 4 = ниво 3
    list = list.filter(w => [...w].every(l => typeOf(l)));
    if (level === 4 && list.length < 6) {   // Б3–Б5: в списъка няма затворени думички само с М Н Л Р – сглобяваме гласна-съгласна-гласна-съгласна
      const cs = [...L].filter(l => typeOf(l) && !VOWELS.includes(l)), vs = "аоуеи", out = [];
      vs.split("").forEach(a => cs.forEach(b => "аеи".split("").forEach(c => cs.forEach(d => { if (b !== d) out.push(a + b + c + d); }))));
      list = list.concat(out.filter((_, i) => i % 3 === 0));
    }
    if (list.length < 3) list = level === 1 ? [...L].filter(l => typeOf(l)) : (THREE ? ["да", "та", "до", "ту", "ад", "ит"] : ["ма", "мо", "ну", "ам", "ин"]);
    return list;
  }
  class SoundParsingGame extends BaseGame {
    constructor(shell, settings, tier, onFinish) {
      super(shell, settings, tier, onFinish);
      const fromHw = /^BK(\d\d)$/.exec(this.ctx.lesson || "");
      this.lesson = Math.max(3, fromHw ? Number(fromHw[1]) : Number(this.s.lessonNumber) || 3); setLesson(this.lesson);
      this.level = Number(this.s.level) || 1; this.total = Number(this.s.answersQty) || 2; this.timers = []; this.stepWrong = 0; this.roundOk = [];
    }
    get gameId() { return "soundLetterParsing"; }
    get skillName() { return (THREE ? "Гласна / звучна / беззвучна" : "Гласна / съгласна") + (this.level === 1 ? ": звукове" : ": срички и думички"); }
    renderProgress() { const p = this.shell.progress; p.innerHTML = ""; for (let i = 0; i < this.total; i++) { const li = document.createElement("li"); if (i < this.roundOk.length) li.className = this.roundOk[i] ? "ok" : "bad"; else if (i === this.roundOk.length) li.className = "now"; p.appendChild(li); } }
    later(fn, ms) { const t = setTimeout(() => { if (!this.finished) fn(); }, ms); this.timers.push(t); return t; }
    destroy() { this.timers.forEach(clearTimeout); super.destroy(); }
    render() {
      setLesson(this.lesson); this.items = shuffle(pool(this.level, this.lesson).slice()); this.k = 0;
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-meadow"/></svg>
        <div class="az sp"><div class="sp-card"><div class="sp-word" id="word"></div><div class="sp-cells" id="cells"></div><button type="button" class="fo-hear" id="hear">🔊 ${this.level === 1 ? "Чуй звука" : this.level === 2 ? "Чуй сричката" : "Чуй сричките"}</button></div>
        <div class="sp-chips" id="chips">${CHIPS.map(([k, label, sym]) => `<button type="button" class="sp-chip" data-t="${k}" aria-label="${label}"><svg viewBox="0 0 100 100"><use href="#${sym}"/></svg><span>${label}</span></button>`).join("")}</div></div>`;
      this.word = this.shell.arena.querySelector("#word"); this.cells = this.shell.arena.querySelector("#cells");
      this.shell.arena.querySelectorAll(".sp-chip").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b); }));
      this.shell.arena.querySelector("#hear").addEventListener("click", () => { if (this.finished || !this.cur) return; this.helpUsed = true; this.say(this.cur); });
      this.shell.setLabel(this.level === 1 ? "Какъв е звукът?" : "Звук по звук");
    }
    startRound() {
      this.stepWrong = 0; this.cur = this.items[this.k++ % this.items.length]; this.pos = 0;
      this.word.innerHTML = this.level === 1 ? `<span class="sp-br">[</span><span class="sp-l on">${this.cur}</span><span class="sp-br">]</span>` : [...this.cur].map((l, i) => `<span class="sp-l${i === 0 ? " on" : ""}">${l}</span>`).join("");
      this.cells.innerHTML = [...this.cur].map((_, i) => `<span class="sp-cell${i === 0 ? " on" : ""}"></span>`).join("");
      this.cells.hidden = this.level === 1; this.word.classList.toggle("single", this.level === 1);
      this.helpUsed = false; this.locked = false;   // без автоматично озвучаване (методист 19.10)
    }
    tap(b) {
      if (this.finished || this.locked) return;
      const l = this.cur[this.pos], want = typeOf(l), got = b.dataset.t;
      if (got === want) {
        this.correct++; this.streak++; this.renderScore();
        this.log.push(this.event(true, { text: this.level === 1 ? l : `${this.cur}:${l}`, answer: want, given: got, ok: true, ms: Date.now() - this.roundStart, adapt: 0 , first_attempt_correct: this.stepWrong === 0, attempt_count: this.stepWrong + 1, help_used: !!this.helpUsed }));
        const cell = this.cells.children[this.pos]; if (cell) { cell.className = `sp-cell done ${want}`; cell.innerHTML = `<svg viewBox="0 0 100 100"><use href="#${CHIPS.find(c => c[0] === want)[2]}"/></svg>`; }
        this.word.children[this.level === 1 ? 1 : this.pos].classList.add("done");
        if (NOPAIR && (SONOR + UNPAIRED).includes(l)) { const m = `Да! Звукът ${l} е ${want === "voiced" ? "звучен" : "беззвучен"} съгласен. Няма ${want === "voiced" ? "беззвучна" : "звучна"} двойка.`; this.shell.flash(m, "good"); this.say(m); this.later(() => this.shell.hideFlash(), 1600); }
        this.pos++;
        if (this.pos >= this.cur.length) {
          this.locked = true; this.roundOk.push(this.stepWrong === 0); this.idx++; this.renderProgress();
          this.shell.flash("Точно така!", "good"); this.say("Точно така!");
          this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 700);
        } else { const nx = this.word.children[this.pos]; [...this.word.children].forEach(c => c.classList.remove("on")); nx.classList.add("on"); [...this.cells.children].forEach(c => c.classList.remove("on")); this.cells.children[this.pos].classList.add("on"); }
      } else {
        this.wrong++; this.streak = 0; this.stepWrong++;
        this.log.push(this.event(false, { text: this.level === 1 ? l : `${this.cur}:${l}`, answer: want, given: got, ms: Date.now() - this.roundStart, ok: false, adapt: 0 , attempt: true, help_used: !!this.helpUsed }));
        b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
        // първа грешка – подкана, без да издаваме отговора; втора – светва верният чип
        if (this.stepWrong >= 2) { this.shell.arena.querySelector(`.sp-chip[data-t="${want}"]`).classList.add("hint"); this.shell.flash("Погледни светещия чип.", "bad"); this.say("Погледни светещия чип."); }
        else { this.shell.flash("Опитай пак. Назови звука.", "bad"); this.say("Опитай пак. Назови звука."); }
        this.later(() => this.shell.hideFlash(), 1300);
        this.loseLife();
      }
    }
    nextRound() { this.shell.arena.querySelectorAll(".sp-chip").forEach(c => c.classList.remove("hint")); super.nextRound(); }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.soundLetterParsing = {
    id: "soundLetterParsing", name: "Звуково-буквен анализ", module: "bukvarica", skill: "Звуков анализ", cls: SoundParsingGame,
    task: s => `${TITLES[Number(s.level) || 1]}. ` + (Number(s.lessonNumber) >= 6 ? "Избери чип за всеки звук: червен за гласен звук, камбанка за звучен съгласен, слушалки за беззвучен." : "Избери чип за всеки звук: червен за гласен звук, син за съгласен."),
    tiers: s => { const q = Number(s.answersQty) || 2; return [Math.ceil(q / 2), 2 * q, 3 * q]; },
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 4, def: 1, help: "1 Звукове: по един звук. 2 Срички от 2 букви (ма, ам). 3 Две отворени срички (ма-ри). 4 Две срички, едната затворена (у-дит)." },
      { key: "answersQty", label: "Брой отговори", type: "range", min: 2, max: 10, def: 2, help: "Колко задачи (звука или срички) ще реши детето." },
      { key: "lessonNumber", label: "Номер на урока", type: "range", min: 3, max: 13, def: 3, help: "Само изучените букви. Б3–Б5: гласен / съгласен звук. От Б6: гласен / звучен / беззвучен, само с преподадените двойки (Д/Т, Б/П, Г/К, З/С, В/Ф, Ж/Ш)." }
    ],
    paramsLine: s => `${TITLES[Number(s.level) || 1]} · ${s.answersQty} задачи · урок ${s.lessonNumber}`
  };
})();
