/* Фонетика (Букварика): картинка и първата буква на думата; детето определя с какъв звук започва.
   Ниво 2 „Звучни и беззвучни“ (само думи със съгласна), ниво 3 „Гласни и съгласни“. Ниво 1 „Твърди и меки“ не се ползва за български. */
(function () {
  const TITLES = { 2: "Звучни и беззвучни", 3: "Гласни и съгласни" };
  function types() { const a = (window.BUK.alphabet || {}).lettersTypes || {}; return { vowel: a.vowel || "аъоуеи", voiced: a.voised || "бвгджзмлнрй", unvoiced: a.notVoised || "пфктшсчцх" }; }
  function learned(n) { const plan = (window.BUK["lesson-plan-letters"] || {}).lessonPlanLetters || []; const s = new Set(); for (let i = 0; i < Math.min(n, plan.length); i++) [...plan[i]].forEach(l => s.add(l)); return s; }
  class PhoneticsGame extends BaseGame {
    constructor(shell, settings, tier, onFinish) {
      super(shell, settings, tier, onFinish);
      this.level = Math.max(2, Number(this.s.level) || 2); this.total = Number(this.s.answersQty) || 2; this.timers = []; this.stepWrong = 0; this.roundOk = []; this.used = new Set();
      const T = types(), L = learned(Number(this.s.lessonNumber) || 3);
      const all = window.BUK_WORDS.filter(x => T.vowel.includes(x.w[0]) || T.voiced.includes(x.w[0]) || T.unvoiced.includes(x.w[0]));
      let pool = all.filter(x => L.has(x.w[0]) && (this.level === 3 || !T.vowel.includes(x.w[0])));
      if (pool.length < 4) pool = all.filter(x => this.level === 3 || !T.vowel.includes(x.w[0]));
      this.pool = pool; this.T = T;
      this.chips = this.level === 2 ? [["voiced", "звучен", "chip-voiced"], ["unvoiced", "беззвучен", "chip-unvoiced"]] : [["vowel", "гласен", "chip-vowel"], ["consonant", "съгласен", "chip-consonant"]];
    }
    get gameId() { return "phonetics"; }
    get skillName() { return this.level === 2 ? "Звучни и беззвучни съгласни" : "Гласни и съгласни"; }
    kind(l) { return this.level === 2 ? (this.T.voiced.includes(l) ? "voiced" : "unvoiced") : (this.T.vowel.includes(l) ? "vowel" : "consonant"); }
    renderProgress() { const p = this.shell.progress; p.innerHTML = ""; for (let i = 0; i < this.total; i++) { const li = document.createElement("li"); if (i < this.roundOk.length) li.className = this.roundOk[i] ? "ok" : "bad"; else if (i === this.roundOk.length) li.className = "now"; p.appendChild(li); } }
    later(fn, ms) { const t = setTimeout(() => { if (!this.finished) fn(); }, ms); this.timers.push(t); return t; }
    destroy() { this.timers.forEach(clearTimeout); super.destroy(); }
    render() {
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-meadow"/></svg>
        <div class="az fo"><div class="fo-card"><div class="fo-letter" id="letter"></div><div class="fo-pic" id="pic"></div><div class="fo-word" id="word"></div><button type="button" class="fo-hear" id="hear" aria-label="Чуй думата">🔊 Чуй думата</button></div>
        <div class="sp-chips" id="chips">${this.chips.map(([k, label, sym]) => `<button type="button" class="sp-chip" data-t="${k}" aria-label="${label}"><svg viewBox="0 0 100 100"><use href="#${sym}"/></svg><span>${label}</span></button>`).join("")}</div></div>`;
      this.shell.arena.querySelectorAll(".sp-chip").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b); }));
      this.shell.arena.querySelector("#hear").addEventListener("click", () => { if (this.finished || !this.cur) return; this.helpUsed = true; this.say(this.cur.w); });
      this.shell.setLabel(TITLES[this.level]);
    }
    startRound() {
      this.stepWrong = 0; this.shell.arena.querySelectorAll(".sp-chip").forEach(c => c.classList.remove("hint", "right"));
      let c = this.pool.filter(x => !this.used.has(x.w)); if (!c.length) { this.used.clear(); c = this.pool.slice(); }
      this.cur = c[rnd(c.length)]; this.used.add(this.cur.w); const l = this.cur.w[0];
      this.shell.arena.querySelector("#letter").textContent = l.toUpperCase() + l;
      this.shell.arena.querySelector("#pic").innerHTML = window.BUK_PIC(this.cur);
      /* методист 19.10: детето само назовава картинката – без автоматично озвучаване, думата се показва след отговора;
         „Чуй думата“ е помощ и се записва (help_used) */
      const w = this.shell.arena.querySelector("#word"); w.textContent = ""; w.classList.remove("shown"); this.helpUsed = false; this.locked = false;
    }
    tap(b) {
      if (this.finished || this.locked) return;
      const l = this.cur.w[0], want = this.kind(l), got = b.dataset.t;
      if (got === want) {
        this.locked = true; this.correct++; this.renderScore(); this.log.push(this.event(true, { text: this.cur.w, answer: want, given: got, ok: true, ms: Date.now() - this.roundStart, adapt: 0 , first_attempt_correct: this.stepWrong === 0, help_used: !!this.helpUsed, attempt_count: this.stepWrong + 1 }));
        this.roundOk.push(this.stepWrong === 0); this.idx++; this.renderProgress();
        const w = this.shell.arena.querySelector("#word"), W = this.cur.w[0].toUpperCase() + this.cur.w.slice(1);
        w.textContent = this.cur.w; w.classList.add("shown"); b.classList.add("right");
        const kindM = { vowel: "гласен", consonant: "съгласен", voiced: "звучен", unvoiced: "беззвучен" }[want];
        this.shell.flash(`${W}. Първият звук е /${l}/. Той е ${kindM}.`, "good"); this.say(`${W}. Първият звук е ${l}. Той е ${kindM}.`);
        this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 3000);
      } else {
        this.wrong++; this.streak = 0; this.stepWrong++; this.log.push(this.event(false, { text: this.cur.w, answer: want, given: got, ok: false, ms: Date.now() - this.roundStart, adapt: 0 , attempt: true, help_used: !!this.helpUsed }));
        b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
        // първа грешка – само подкана (без да издаваме отговора); втора – подсказка на верния чип
        if (this.stepWrong >= 2) { this.shell.arena.querySelector(`.sp-chip[data-t="${want}"]`).classList.add("hint"); this.shell.flash("Погледни светещия чип.", "bad"); this.say("Погледни светещия чип."); }
        else { this.shell.flash("Опитай пак. Чуй първия звук.", "bad"); this.say("Опитай пак. Чуй първия звук."); }
        this.later(() => this.shell.hideFlash(), 1300);
        this.loseLife();
      }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.phonetics = {
    id: "phonetics", name: "Фонетика", module: "bukvarica", skill: "Видове звукове", cls: PhoneticsGame,
    task: s => `${TITLES[Math.max(2, Number(s.level) || 2)]}. Назови картинката, чуй първия звук и избери чипа.`,
    tiers: s => { const q = Number(s.answersQty) || 2; return [Math.ceil(q / 2), q, 2 * q]; },
    settings: [
      // вътрешно 2/3 (така е в домашните), за детето и учителя – 1/2
      { key: "level", label: "Ниво", type: "range", min: 2, max: 3, def: 2, show: v => Number(v) - 1, help: "1 Звучни и беззвучни: думи със съгласна в началото (камбанка = звучна, слушалки = беззвучна). 2 Гласни и съгласни." },
      { key: "answersQty", label: "Брой отговори", type: "range", min: 2, max: 10, def: 2, help: "Колко думи ще определи детето." },
      { key: "lessonNumber", label: "Номер на урока", type: "range", min: 1, max: 14, def: 3, help: "Използват се думи, чиято първа буква е изучена до този урок." }
    ],
    paramsLine: s => `${TITLES[Math.max(2, Number(s.level) || 2)]} · ${s.answersQty} думи · урок ${s.lessonNumber}`
  };
})();
