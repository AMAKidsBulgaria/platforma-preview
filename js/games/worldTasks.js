/* „Сортиране по тема“ – механика с режими по околен свят (методист, 18.10.2026; tools/konspekt/matematika/DECISIONS.md т. 4).
   Едно детско действие = едно заглавие и един task_mode (js/games/modes.js, „sorting“ по settings.task):
     classify – „Къде отива?“ (картинка → група), cause – „Помага ли? Защо?“, action – „Какво ще направиш?“,
     sequence – „Подреди какво става“, explain – „Кое обяснение е вярно?“, identify_respect – „Познай и покажи уважение“.
   Двустъпкова измервателна единица: стъпка 1 – избор/подреждане; стъпка 2 – избор измежду 3 (step2_type: criterion – признак, reason – причина,
   relation – ред/принадлежност, evidence – кое показва; методист 18.10.2026: не всяка втора стъпка е „защо“).
   Двете решения се пазят отделно (primary_correct, reason_correct; reason_distractor_type на избраната грешна причина).
   Банка: config/world-tasks.json (tools/world_tasks_bank.py). В домашната – набор A, при друга домашна B; упражнение – practice пул. */
(function () {
  const URL = "config/world-tasks.json?v=6";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()));
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  function pickSet(slot, sets, hw) {   // както в sentenceTasks.js / readicaBank.js
    const keys = Object.keys(sets); if (!hw || keys.length < 2) return keys[0];
    const k = "platforma.setfirst." + slot; let first = null;
    try { first = localStorage.getItem(k); if (!first) localStorage.setItem(k, first = hw); } catch (e) {}
    return first && first !== hw ? keys[1] : keys[0];
  }
  const pic = (src, label) => `<div class="wq-pic"><img src="assets/img/${src}" alt="${esc(label || "")}" draggable="false" onerror="this.parentNode.classList.add('nopic');this.remove()"><span class="wq-lab">${esc(label || "")}</span></div>`;

  class WorldTaskGame extends CardGame {
    get gameId() { return "sorting"; }
    get skillName() { return "Светът около мен"; }
    start() {
      load().then(d => {
        this.d = d; const c = this.ctx, theme = this.s.theme, slot0 = c.lesson && c.round != null ? `${c.lesson}.Р${c.round}` : null,
          slot = slot0 && d.rounds[`${slot0}/${theme}`] ? `${slot0}/${theme}` : slot0, r = slot && d.rounds[slot];   // Ч32 Р3: пет теми в един рунд → „MW32.Р3/<тема>“
        const by = Object.fromEntries(d.items.map(x => [x.id, x]));
        if (r && r.sets) { this.set = pickSet(slot, r.sets, c.hw); this.items = r.sets[this.set].map(id => by[id]).filter(Boolean); }
        else { const th = (r && r.theme) || theme; this.set = "practice"; this.items = shuffle(d.items.filter(x => x.theme === th && x.set === "practice")).slice(0, Number(this.s.examples) || (r && r.shown) || 6); }
        this.th = d.themes[(this.items[0] || {}).theme] || {}; this.s.task = this.s.task || this.th.mode || this.th.task;   // режимът (заглавието) ≠ как се рисува (th.task)
        this.total = this.items.length || 1; super.start();
      }).catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Задачите не се заредиха.</p>'; });
    }
    render() { document.documentElement.classList.toggle("teacher-view", /[?&]teacher=1\b/.test(location.search + "&" + location.hash)); this.scene("wt-st wt-wq", "scene-space-game"); const mi = this.modeInfo(); this.shell.setLabel(mi ? mi[0] : "Светът около мен"); }
    hear(btn, text) { btn.addEventListener("click", e => { e.stopPropagation(); this.say(text); }); }
    startRound() {
      const it = this.items[this.idx]; if (!it) { this.box.innerHTML = '<p class="bk-err">Няма задачи за този рунд.</p>'; return; }
      this.res = { primary: null, reason: null, reasonType: null, given: null };
      if (this.th.task === "sequence") return this.stepSequence(it);
      const opts = this.th.task === "action" || !this.th.colors ? shuffle((it.options || this.th.options).slice()) : this.th.options.slice();   // без цветове (професии, сетива…) – разбъркан ред, за да няма шаблон по позиция
      const q = this.th.q1, stim = this.th.task === "action" ? `<div class="wq-sit">${pic(it.img, "")}<p class="wq-say">${esc(it.label)}</p></div>` : pic(it.img, it.label);
      this.box.innerHTML = `<div class="wq"><div class="az-hint">${esc(q)} <button type="button" class="wq-ear" id="ear" aria-label="Чуй пак">🔊</button></div>${stim}
        <div class="st-opts wq-opts ${this.th.task === "action" ? "long" : ""}">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}"${this.th.colors && this.th.task !== "action" ? ` style="border-left:16px solid ${this.th.colors[i]}"` : ""}>${esc(o)}</button>`).join("")}</div></div>`;
      // репликите се пускат поотделно – всяка е отделен запис на диктора (tools/audio_script_world.py → config/audio-world.csv)
      const spoken = [it.label, q].concat(this.th.task === "action" ? opts : []);
      this.hear(this.box.querySelector("#ear"), spoken); this.say(spoken);
      let tries = 0;
      this.box.querySelectorAll(".st-opt").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked) return; const o = opts[Number(b.dataset.i)], ok = o === it.primary_answer || (it.accepted_answers || []).includes(o); tries++;   // accepted_answers – и друг отговор е верен (емоции, Ч29/Ч30)
        if (tries === 1) { this.res.primary = ok; this.res.given = o; this.res.acceptedAlt = ok && o !== it.primary_answer; }
        if (ok || tries >= 2) { b.classList.add(ok ? "good" : "bad"); if (!ok) this.box.querySelectorAll(".st-opt").forEach(x => { if (opts[Number(x.dataset.i)] === it.primary_answer) x.classList.add("hint"); });
          this.locked = true; return this.later(() => { this.locked = false; this.stepReason(it); }, ok ? 600 : 1500); }
        b.classList.add("bad"); this.shake(b); this.say("Помисли още веднъж."); this.later(() => b.classList.remove("bad"), 900);
      }));
    }
    stepSequence(it) {
      const order = shuffle(it.imgs.map((src, i) => ({ src, i }))); let k = 0, mistakes = 0;
      this.box.innerHTML = `<div class="wq"><div class="az-hint">${esc(this.th.q1)} <button type="button" class="wq-ear" id="ear" aria-label="Чуй пак">🔊</button></div>
        <div class="wq-slots">${it.imgs.map((_, i) => `<span class="wq-slot" data-s="${i}">${i + 1}</span>`).join("")}</div>
        <div class="wq-cards">${order.map(o => `<div class="wq-cw"><button type="button" class="wq-card" data-i="${o.i}">${pic(o.src, it.stages[o.i])}</button><button type="button" class="wq-ear wq-ear-s" data-say="${esc(it.stages[o.i])}" aria-label="Чуй">🔊</button></div>`).join("")}</div></div>`;
      // всяка карта може да се чуе – децата още не четат (особено при „седмица“, където етапът е „ден – занимание“)
      this.box.querySelectorAll(".wq-ear-s").forEach(b => this.hear(b, b.dataset.say));
      const spoken = [this.th.q1, it.label, "Какво е първо, какво после?"]; this.hear(this.box.querySelector("#ear"), spoken); this.say(spoken);
      this.box.querySelectorAll(".wq-card").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked || b.classList.contains("used")) return; const i = Number(b.dataset.i);
        if (i === it.primary_answer[k]) {
          b.classList.add("used"); if (b.nextElementSibling) b.nextElementSibling.style.visibility = "hidden"; const s = this.box.querySelector(`.wq-slot[data-s="${k}"]`); s.innerHTML = pic(it.imgs[i], it.stages[i]); s.classList.add("on"); k++;
          if (k >= it.imgs.length) { this.res.primary = mistakes === 0; this.res.given = mistakes ? "грешен ред" : "верен ред"; this.locked = true; this.say(it.stages.slice()); this.later(() => { this.locked = false; this.stepReason(it); }, 1400); }
        } else {
          mistakes++; b.classList.add("bad"); this.shake(b); this.later(() => b.classList.remove("bad"), 800);
          this.say(k === 0 ? "Кое е най-напред?" : "Кое идва после?");
          if (mistakes >= 2) this.box.querySelectorAll(".wq-card").forEach(x => { if (Number(x.dataset.i) === it.primary_answer[k]) x.classList.add("hint"); });
        }
      }));
    }
    stepReason(it) {
      const q = it.reason_prompt || this.th.q2 || "Защо?", opts = shuffle(it.reason_options.slice()); let tries = 0;
      this.box.innerHTML = `<div class="wq"><div class="az-hint">${esc(q)} <button type="button" class="wq-ear" id="ear" aria-label="Чуй пак">🔊</button></div>
        <div class="st-opts wq-opts long">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div></div>`;
      const spoken = [q].concat(opts); this.hear(this.box.querySelector("#ear"), spoken); this.say(spoken);
      this.box.querySelectorAll(".st-opt").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked) return; const o = opts[Number(b.dataset.i)], ok = o === it.reason_answer; tries++;
        if (tries === 1) { this.res.reason = ok; this.res.reasonGiven = o; if (!ok) this.res.reasonType = it.reason_options.indexOf(o) === 1 ? it.reason_distractor_type_1 : it.reason_distractor_type_2; }
        if (ok || tries >= 2) { b.classList.add(ok ? "good" : "bad"); if (!ok) this.box.querySelectorAll(".st-opt").forEach(x => { if (opts[Number(x.dataset.i)] === it.reason_answer) x.classList.add("hint"); });
          this.locked = true; return this.later(() => this.finishItem(it), ok ? 700 : 1600); }   // остава заключено до следващата задача (nextRound отключва)
        b.classList.add("bad"); this.shake(b); this.say("Помисли още веднъж."); this.later(() => b.classList.remove("bad"), 900);
      }));
    }
    finishItem(it) {
      // бързо второ докосване по бутоните на „защо“ записваше задачата два пъти и прескачаше следващата (изиграване 23.10)
      if (this.res.done) return; this.res.done = true;
      const p = !!this.res.primary, r = !!this.res.reason, both = p && r;
      this.decisions = { task_count: 1, scored_decision_count: 2, correct_scored_decisions: (p ? 1 : 0) + (r ? 1 : 0) };
      this.log.push(this.event(both, { unit_id: it.id, text: it.label, answer: String(it.primary_answer), given: this.res.given, ms: Date.now() - this.roundStart, first_attempt_correct: both,
        task_mode: this.s.task, render_task: this.th.task, step2_type: it.step2_type || this.th.step2_type, image_dependency: it.image_dependency || this.th.image_dependency, theme: it.theme, primary_correct: p, accepted_alt: !!this.res.acceptedAlt, reason_correct: r, reason_distractor_type: this.res.reasonType, reason_given: this.res.reasonGiven || null, bank_item: it.id, item_set: this.set, scope: it.scope }));
      if (both) this.correct++; this.roundOk.push(both); this.idx++; this.renderProgress(); this.renderScore();
      this.say(both ? "Точно така!" : "Добре. Продължаваме."); this.later(() => this.nextRound(), 700);
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.sorting = {
    id: "sorting", name: "Светът около мен", module: "math", skill: "Околен свят", cls: WorldTaskGame,
    task: "Избери или подреди, после избери защо.", tiers: () => [0, 2, 4],
    settings: [{ key: "theme", label: "Тема", type: "cycle", def: "plant_needs", options: [["plant_needs", "Помага ли на растението?"], ["waste", "В кой контейнер?"]] },
               { key: "examples", label: "Брой задачи", type: "range", min: 3, max: 8, def: 6 }],
    paramsLine: s => `${s.examples || 6} задачи`
  };
})();
