/* Нови механики на Читарика (методист, 17.10.2026; банки в config/sentence-tasks-ch.json):
   „Редактирай изречението“ (editSentence, Ч15 Р3, mode edit_sentence): изречение с една грешка. Стъпка 1 – детето докосва мястото
     на грешката (дума или празнината между две думи, когато липсва дума). Стъпка 2 – избира поправката от 3 варианта
     (при излишна дума „Махни я“; при словоред – докосва къде отива думата). Накрая вижда и чува поправеното изречение.
     Две оценени решения на задача: detection_correct и fix_correct (първият опит на всяка стъпка).
   „Думата в контекст“ (wordContext, Ч11 Р4, mode word_in_context): изречение с празно място и три думи от един вид; само едната е
     точна по смисъл. Оценява се първият избор; при грешка – подсказка към контекста и втори опит.
   В домашната рундът взима набор A, при повторно минаване (друга домашна) – набор B. Без домашна – всички задачи. */
(function () {
  const URL = "config/sentence-tasks-ch.json?v=3";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()));
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const PUNCT = /[.!?]$/;
  // набор за рунда: A първия път, B при друга домашна за същия рунд (стабилно на устройството)
  function pickSet(slot, sets, hw) {
    const keys = Object.keys(sets); if (!hw || keys.length < 2) return keys[0];
    const k = "platforma.setfirst." + slot; let first = null;
    try { first = localStorage.getItem(k); if (!first) localStorage.setItem(k, first = hw); } catch (e) {}
    return first && first !== hw ? keys[1] : keys[0];
  }
  function itemsFor(bank, ctx, s) {
    const slot = ctx.lesson && ctx.round != null ? `${ctx.lesson}.Р${ctx.round}` : null, r = slot && bank.rounds[slot];
    const by = Object.fromEntries(bank.items.map(x => [x.id, x]));
    // упражнение (Ч4 Р2, Ч14 Р2) и свободна практика: само practice пула – измервателното съдържание не се „изгаря“ предварително
    const practice = bank.items.filter(x => x.pool === "practice");
    if (r && r.pool) { const n = Number(s.examples) || r.shown; return { set: "practice", items: shuffle(practice.slice()).slice(0, n) }; }
    if (r) { const set = pickSet(slot, r.sets, ctx.hw); return { set, items: r.sets[set].map(id => by[id]).filter(Boolean) }; }
    const n = Number(s.examples) || practice.length; return { set: "practice", items: shuffle(practice.slice()).slice(0, n) };
  }

  class EditSentenceGame extends CardGame {
    get gameId() { return "editSentence"; }
    get skillName() { return "Откривам и поправям грешка в изречение"; }
    start() {
      load().then(d => { const r = itemsFor(d.edit, this.ctx, this.s); this.items = r.items; this.set = r.set; this.total = this.items.length || 1; super.start(); })
        .catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Задачите не се заредиха.</p>'; });
    }
    render() { this.scene("wt-st wt-es", "scene-space-game"); this.shell.setLabel("Поправи изречението"); }
    startRound() {
      const it = this.items[this.idx]; if (!it) { this.box.innerHTML = '<p class="bk-err">Няма задачи за този рунд.</p>'; return; }
      const last = it.words[it.words.length - 1], end = (last.match(PUNCT) || [""])[0];
      const words = it.words.map((w, i) => i === it.words.length - 1 ? w.replace(PUNCT, "") : w);
      const gapErr = it.err && typeof it.err === "object" ? it.err.gap : null;
      let det = null, fix = null, tries = 0;
      const draw = (sel, fixed) => {
        const parts = [];
        words.forEach((w, i) => {
          if (i > 0) parts.push(`<button type="button" class="es-gap" data-g="${i}" aria-label="Празно място"></button>`);
          parts.push(`<button type="button" class="es-w ${sel === i ? "on" : ""}" data-w="${i}">${esc(w)}</button>`);
        });
        parts.push(`<button type="button" class="es-gap" data-g="${words.length}" aria-label="Празно място"></button>${end ? `<span class="es-end">${end}</span>` : ""}`);
        return `<div class="es-sent ${fixed ? "done" : ""}">${parts.join("")}</div>`;
      };
      const step1 = () => {
        this.box.innerHTML = `<div class="es"><div class="az-hint">В изречението има една грешка. Докосни я.</div>${draw(null)}<p class="es-note">Ако липсва дума, докосни мястото, където трябва да е.</p></div>`;
        this.prompt("В изречението има една грешка. Докосни я.");
        this.box.querySelectorAll(".es-w, .es-gap").forEach(b => b.addEventListener("pointerdown", e => {
          e.preventDefault(); if (this.locked) return;
          const isGap = b.classList.contains("es-gap"), i = Number(isGap ? b.dataset.g : b.dataset.w);
          const ok = gapErr != null ? isGap && i === gapErr : !isGap && i === it.err; tries++;
          if (tries === 1) det = ok;
          if (ok) { b.classList.add("good"); this.locked = true; return this.later(() => { this.locked = false; step2(); }, 500); }
          b.classList.add("bad"); this.shake(b);
          if (tries === 1) { const h = it.hint || "Прочети изречението още веднъж. Кое не звучи правилно?"; this.shell.flash(it.hint || "Прочети изречението още веднъж", "bad"); this.say(h); this.later(() => { this.shell.hideFlash(); b.classList.remove("bad"); }, 1200); return; }
          const right = gapErr != null ? this.box.querySelector(`.es-gap[data-g="${gapErr}"]`) : this.box.querySelector(`.es-w[data-w="${it.err}"]`);
          right.classList.add("hint"); this.locked = true; this.later(() => { this.locked = false; step2(); }, 1300);
        }));
      };
      const step2 = () => {
        tries = 0;
        if (it.type === "order") {
          this.box.innerHTML = `<div class="es"><div class="az-hint">Къде трябва да е думата „${esc(words[it.err])}“? Докосни мястото.</div>${draw(it.err)}</div>`;
          this.prompt(`Къде трябва да е думата ${words[it.err]}? Докосни мястото.`);
          this.box.querySelectorAll(".es-gap").forEach(b => b.addEventListener("pointerdown", e => {
            e.preventDefault(); if (this.locked) return; const ok = Number(b.dataset.g) === it.move_to; tries++;
            if (tries === 1) fix = ok;
            if (ok || tries >= 2) { if (!ok) this.box.querySelector(`.es-gap[data-g="${it.move_to}"]`).classList.add("hint"); else b.classList.add("good"); this.locked = true; return this.later(() => { this.locked = false; finish(); }, ok ? 500 : 1300); }
            b.classList.add("bad"); this.shake(b); this.say("Опитай още веднъж.");
          }));
          return;
        }
        const opts = shuffle(it.options.slice()), q = it.type === "extra" ? "Какво да направим с тази дума?" : gapErr != null ? "Коя дума липсва?" : "С коя дума да я сменим?";
        this.box.innerHTML = `<div class="es"><div class="az-hint">${q}</div>${draw(gapErr != null ? null : it.err)}<div class="st-opts">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div></div>`;
        this.prompt(q);
        this.box.querySelectorAll(".st-opt").forEach(b => b.addEventListener("pointerdown", e => {
          e.preventDefault(); if (this.locked) return; const ok = opts[Number(b.dataset.i)] === it.options[0]; tries++;
          if (tries === 1) fix = ok;
          if (ok || tries >= 2) { b.classList.add(ok ? "good" : "bad"); if (!ok) this.box.querySelectorAll(".st-opt").forEach(x => { if (x.textContent === it.options[0]) x.classList.add("hint"); }); this.locked = true; return this.later(() => { this.locked = false; finish(); }, ok ? 500 : 1300); }
          b.classList.add("bad"); this.shake(b); this.say("Прочети изречението с тази дума. Има ли смисъл?");
        }));
      };
      const finish = () => {
        const both = !!det && !!fix;
        this.decisions = { task_count: 1, scored_decision_count: 2, correct_scored_decisions: (det ? 1 : 0) + (fix ? 1 : 0) };
        this.log.push(this.event(both, { text: it.fixed, answer: it.fixed, given: both ? it.fixed : "", ms: Date.now() - this.roundStart, first_attempt_correct: both,
          detection_correct: !!det, fix_correct: !!fix, error_type: it.type, bank_item: it.id, item_set: this.set }));
        if (both) this.correct++; this.roundOk.push(both); this.idx++; this.renderProgress(); this.renderScore();
        this.box.innerHTML = `<div class="es"><div class="az-hint">Ето поправеното изречение.</div><div class="es-sent done"><span class="es-fixed">${esc(it.fixed)}</span></div><button type="button" class="st-btn" id="es-next">Нататък</button></div>`;
        this.prompt(it.fixed); this.box.querySelector("#es-next").onclick = () => this.nextRound();
      };
      step1();
    }
  }

  class WordContextGame extends CardGame {
    get gameId() { return "wordContext"; }
    get skillName() { return "Избирам точната дума според смисъла"; }
    start() {
      load().then(d => { const r = itemsFor(d.context, this.ctx, this.s); this.items = r.items; this.set = r.set; this.total = this.items.length || 1; super.start(); })
        .catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Задачите не се заредиха.</p>'; });
    }
    render() { this.scene("wt-st wt-wc", "scene-space-game"); this.shell.setLabel("Коя дума е най-точна?"); }
    startRound() {
      const it = this.items[this.idx]; if (!it) { this.box.innerHTML = '<p class="bk-err">Няма задачи за този рунд.</p>'; return; }
      const opts = shuffle(it.options.slice()), [a, b] = it.text.split("___");
      let tries = 0, first = null;
      this.box.innerHTML = `<div class="es"><div class="az-hint">Коя дума е най-точна тук?</div><div class="es-sent"><span>${esc(a)}</span><span class="wc-blank" id="wc-blank">___</span><span>${esc(b)}</span></div>
        <div class="st-opts">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div><p class="es-note" id="wc-hint"></p></div>`;
      this.prompt("Прочети изречението. Коя дума е най-точна тук?");
      this.box.querySelectorAll(".st-opt").forEach(btn => btn.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked) return; const given = opts[Number(btn.dataset.i)], ok = given === it.options[0]; tries++;
        if (tries === 1) first = ok;
        if (ok || tries >= 2) {
          btn.classList.add(ok ? "good" : "bad"); if (!ok) this.box.querySelectorAll(".st-opt").forEach(x => { if (x.textContent === it.options[0]) x.classList.add("hint"); });
          this.box.querySelector("#wc-blank").textContent = it.options[0]; this.box.querySelector("#wc-blank").classList.add("on");
          this.log.push(this.event(!!first, { text: it.text, answer: it.options[0], given, ms: Date.now() - this.roundStart, first_attempt_correct: !!first, attempt_count: tries, bank_item: it.id, item_level: it.level, item_set: this.set }));
          if (first) this.correct++; this.roundOk.push(!!first); this.idx++; this.renderProgress(); this.renderScore(); this.locked = true;
          this.prompt(it.text.replace("___", it.options[0]));
          return this.later(() => { this.locked = false; this.nextRound(); }, 1800);
        }
        btn.classList.add("bad"); this.shake(btn); const h = this.box.querySelector("#wc-hint"); h.textContent = it.hint; this.say(it.hint);
      }));
    }
  }

  // „Направи изречението ясно“ (conventions, Ч14, mode sentence_conventions): буквите са плочки; докосване на буква сменя малка/главна,
  // докосване между две букви слага/маха интервал, накрая се избира знак. „Готово“ сравнява с целта; всяка нужна поправка е оценено решение.
  function parseConv(str) {
    const end = (str.match(/[.?!]$/) || [""])[0], body = str.replace(/[.?!]$/, ""), letters = [], space = [];
    for (const ch of body) { if (ch === " ") { if (letters.length) space[letters.length - 1] = true; } else { letters.push(ch); space[letters.length - 1] = space[letters.length - 1] || false; } }
    return { letters, space: letters.map((_, i) => !!space[i] && i < letters.length - 1), end };
  }
  class ConventionsGame extends CardGame {
    get gameId() { return "conventions"; }
    get skillName() { return "Пиша ясно: главна буква, интервали, краен знак"; }
    start() {
      load().then(d => { const r = itemsFor(d.conv, this.ctx, this.s); this.items = r.items; this.set = r.set; this.total = this.items.length || 1; super.start(); })
        .catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Задачите не се заредиха.</p>'; });
    }
    render() { this.scene("wt-st wt-es", "scene-space-game"); this.shell.setLabel("Направи изречението ясно"); }
    startRound() {
      const it = this.items[this.idx]; if (!it) { this.box.innerHTML = '<p class="bk-err">Няма задачи за този рунд.</p>'; return; }
      const T = parseConv(it.target), S = parseConv(it.shown);
      const st = { letters: S.letters.slice(), space: S.space.slice(), end: S.end };
      // нужните поправки: главни букви, интервали, знак
      const needCase = T.letters.map((c, i) => c !== S.letters[i]), needSpace = T.space.map((v, i) => v !== S.space[i]), needEnd = T.end !== S.end;
      const nNeed = needCase.filter(Boolean).length + needSpace.filter(Boolean).length + (needEnd ? 1 : 0);
      const draw = (checked) => {
        const parts = st.letters.map((c, i) => {
          const cls = checked ? (needCase[i] ? (c === T.letters[i] ? "good" : "hint") : c !== T.letters[i] ? "bad" : "") : "";
          const gap = i < st.letters.length - 1 ? `<button type="button" class="cv-gap ${st.space[i] ? "on" : ""} ${checked && (needSpace[i] || st.space[i] !== T.space[i]) ? (st.space[i] === T.space[i] ? "good" : "bad") : ""}" data-g="${i}" aria-label="Интервал"></button>` : "";
          return `<button type="button" class="cv-l ${cls}" data-l="${i}">${esc(c)}</button>${gap}`;
        }).join("");
        const endCls = checked ? (st.end === T.end ? (needEnd ? "good" : "") : "bad") : "";
        return `<div class="es-sent cv"><span class="cv-row">${parts}<span class="cv-end ${endCls}">${st.end || "&nbsp;"}</span></span></div>`;
      };
      const ui = () => {
        this.box.innerHTML = `<div class="es"><div class="az-hint">Направи изречението ясно: главна буква, интервали и знак накрая.</div>${draw(false)}
          <p class="es-note">Докосни буква, за да стане главна. Докосни между буквите, за да сложиш интервал.</p>
          <div class="st-opts cv-marks">${[".", "?", "!"].map(m => `<button type="button" class="wtile st-opt ${st.end === m ? "on" : ""}" data-m="${m}">${m}</button>`).join("")}</div>
          <button type="button" class="st-btn" id="cv-ok">Готово</button></div>`;
        this.box.querySelectorAll(".cv-l").forEach(b => b.onclick = () => { if (this.locked) return; const i = Number(b.dataset.l), c = st.letters[i]; st.letters[i] = c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase(); ui(); });
        this.box.querySelectorAll(".cv-gap").forEach(b => b.onclick = () => { if (this.locked) return; const i = Number(b.dataset.g); st.space[i] = !st.space[i]; ui(); });
        this.box.querySelectorAll(".cv-marks .st-opt").forEach(b => b.onclick = () => { if (this.locked) return; st.end = st.end === b.dataset.m ? "" : b.dataset.m; ui(); });
        this.box.querySelector("#cv-ok").onclick = check;
      };
      const check = () => {
        if (this.locked) return; this.locked = true;
        let good = 0;
        T.letters.forEach((c, i) => { if (needCase[i] && st.letters[i] === c) good++; });
        T.space.forEach((v, i) => { if (needSpace[i] && st.space[i] === v) good++; });
        if (needEnd && st.end === T.end) good++;
        const extra = T.letters.some((c, i) => !needCase[i] && st.letters[i] !== c) || T.space.some((v, i) => !needSpace[i] && st.space[i] !== v);
        const ok = good === nNeed && !extra && st.end === T.end;
        this.decisions = { task_count: 1, scored_decision_count: nNeed, correct_scored_decisions: good };
        const given = st.letters.map((c, i) => c + (st.space[i] ? " " : "")).join("") + st.end;
        this.log.push(this.event(ok, { text: it.target, answer: it.target, given, ms: Date.now() - this.roundStart, first_attempt_correct: ok, extra_changes: extra, bank_item: it.id, item_set: this.set,
          capital_fixed: T.letters.every((c, i) => !needCase[i] || st.letters[i] === c), space_fixed: T.space.every((v, i) => !needSpace[i] || st.space[i] === v), end_fixed: st.end === T.end }));
        if (ok) this.correct++; this.roundOk.push(ok); this.idx++; this.renderProgress(); this.renderScore();
        this.box.innerHTML = `<div class="es"><div class="az-hint">${ok ? "Точно така!" : "Ето как става ясно:"}</div>${draw(true)}<div class="es-sent done"><span class="es-fixed">${esc(it.target)}</span></div><button type="button" class="st-btn" id="es-next">Нататък</button></div>`;
        this.prompt(it.target); this.box.querySelector("#es-next").onclick = () => { this.locked = false; this.nextRound(); };
      };
      ui(); this.prompt("Направи изречението ясно.");
    }
  }

  window.GAMES = window.GAMES || {};
  window.GAMES.conventions = {
    id: "conventions", name: "Направи изречението ясно", module: "readica", skill: "Пиша по-ясно", cls: ConventionsGame,
    task: () => "Сложи главна буква, интервали и знак накрая.", tiers: () => [0, 1, 2],
    settings: [{ key: "examples", label: "Брой задачи", type: "range", min: 3, max: 12, def: 6 }], paramsLine: s => `${s.examples || 6} изречения`
  };
  window.GAMES.editSentence = {
    id: "editSentence", name: "Редактирай изречението", module: "readica", skill: "Откривам и поправям", cls: EditSentenceGame,
    task: () => "Намери грешката в изречението и я поправи.", tiers: () => [0, 1, 2],
    settings: [{ key: "examples", label: "Брой задачи", type: "range", min: 3, max: 12, def: 6 }], paramsLine: s => `${s.examples || 6} изречения`
  };
  window.GAMES.wordContext = {
    id: "wordContext", name: "Думата в контекст", module: "readica", skill: "Точната дума", cls: WordContextGame,
    task: () => "Избери думата, която е най-точна в изречението.", tiers: () => [0, 1, 2],
    settings: [{ key: "examples", label: "Брой задачи", type: "range", min: 3, max: 10, def: 4 }], paramsLine: s => `${s.examples || 4} изречения`
  };
})();
